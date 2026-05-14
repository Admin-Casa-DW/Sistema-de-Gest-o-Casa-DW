// =============================================================================
// DOCUMENT SCANNER MODULE v2 — Casa DW
// Canvas API + jsPDF — full document scanning workflow
// =============================================================================

// --- Scanner State ---
var _scannerStep = 1;
var _scannerCorners = null;
var _scannerImage = null;
var _scannerImageFile = null;
var _scannedPages = [];
var _scannerRotation = 0;
var _scannerFlipH = 1;
var _scannerFlipV = 1;
var _currentFilter = 'original';
var _step2ImageData = null;
var _step2Canvas = null;
var _isDraggingCorner = -1;
var _overlayScale = 1;
var _addMoreMode = false;
var _overlayReady = false;

// Scanic WASM state
var _scanicAvailable = false;
var _scanicModule = null;

// Load Scanic WASM via dynamic ES module import
(function initScanicOnLoad() {
    try {
        import('https://unpkg.com/scanic@1.0.6/dist/scanic.js')
            .then(function(mod) {
                _scanicModule = mod;
                if (mod.initialize) {
                    return mod.initialize();
                }
            })
            .then(function() {
                _scanicAvailable = true;
                console.log('[Scanner] Scanic WASM loaded and initialized');
            })
            .catch(function(e) {
                _scanicAvailable = false;
                _scanicModule = null;
                console.warn('[Scanner] Scanic not available, using fallback:', e.message);
            });
    } catch (e) {
        _scanicAvailable = false;
        _scanicModule = null;
        console.warn('[Scanner] Dynamic import not supported:', e.message);
    }
})();

// Adjustment state
var _flipH = 1;
var _flipV = 1;
var _adjustments = {
    brightness: 100,
    contrast: 100,
    saturation: 100,
    sharpness: 0
};

// =============================================================================
// HANDLE RECEIPT UPLOAD — entry point from file input
// =============================================================================

function handleReceiptUpload(event) {
    var files = Array.from(event.target.files);
    if (files.length === 0) return;
    event.target.value = '';

    files.forEach(function(file) {
        if (file.type === 'application/pdf') {
            currentReceiptFiles.push(file);
            displayReceiptPreview();
        } else if (file.type.startsWith('image/')) {
            cropperQueue.push(file);
        }
    });

    processNextInCropperQueue();
}

// =============================================================================
// CAMERA CAPTURE — for Digitalizar button
// =============================================================================

function captureReceipt() {
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.multiple = false;
    input.onchange = function(e) {
        handleReceiptUpload(e);
    };
    input.click();
}

// =============================================================================
// QUEUE PROCESSING
// =============================================================================

function processNextInCropperQueue() {
    if (cropperQueue.length === 0) return;
    var modal = document.getElementById('cropperModal');
    var modalOpen = modal && (modal.style.display === 'flex' || modal.style.display === 'block');
    // If modal is already open and we're NOT in addMore mode, skip
    if (modalOpen && !_addMoreMode) return;
    var nextFile = cropperQueue.shift();
    initDocumentScanner(nextFile);
}

// =============================================================================
// INIT SCANNER — Opens modal at Step 1
// =============================================================================

function initDocumentScanner(file, editIndex) {
    var modal = document.getElementById('cropperModal');
    var image = document.getElementById('cropperImage');

    currentCropperFileIndex = (editIndex !== undefined && editIndex !== null) ? editIndex : file;
    isEditingExistingReceipt = (editIndex !== undefined && editIndex !== null);
    _scannerImageFile = file;
    _scannerRotation = 0;
    _scannerFlipH = 1;
    _scannerFlipV = 1;
    _flipH = 1;
    _flipV = 1;
    _currentFilter = 'original';
    _overlayReady = false;
    resetAdjustments();

    // Update queue badge
    var badge = document.getElementById('cropperQueueBadge');
    if (badge) {
        var remaining = cropperQueue.length;
        if (remaining > 0) {
            badge.textContent = '(+' + remaining + ' na fila)';
            badge.style.display = 'inline';
        } else {
            badge.style.display = 'none';
        }
    }

    // Read file
    var reader = new FileReader();
    reader.onload = function(e) {
        var img = new Image();
        img.onload = function() {
            _scannerImage = img;
            image.src = e.target.result;
            image.style.transform = '';

            // Destroy old cropper if any
            if (typeof cropperInstance !== 'undefined' && cropperInstance) {
                cropperInstance.destroy();
                cropperInstance = null;
            }

            modal.style.display = 'flex';
            goToScanStep(1);

            // Wait for image layout, then setup overlay with retries
            waitForImageAndSetupOverlay(image, 0);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function waitForImageAndSetupOverlay(imgEl, attempt) {
    if (attempt > 15) {
        console.warn('[Scanner] Image layout failed after retries');
        resetCorners();
        return;
    }
    // Check if image has rendered with non-zero dimensions
    if (imgEl.offsetWidth > 10 && imgEl.offsetHeight > 10 && imgEl.naturalWidth > 0) {
        setupOverlay();
        resetCorners();
        // Auto-detect edges if Scanic is available
        if (_scanicAvailable && _scanicModule) {
            setTimeout(function() { autoDetectEdges(); }, 200);
        }
    } else {
        setTimeout(function() {
            waitForImageAndSetupOverlay(imgEl, attempt + 1);
        }, 100);
    }
}

// Backward compat
function openImageCropper(file, editIndex) {
    initDocumentScanner(file, editIndex);
}

// =============================================================================
// STEP NAVIGATION
// =============================================================================

function goToScanStep(step) {
    _scannerStep = step;

    // Hide all panels
    var panels = document.querySelectorAll('.scanner-panel');
    panels.forEach(function(p) { p.style.display = 'none'; });

    // Show active panel
    var panel = document.getElementById('scannerStep' + step);
    if (panel) panel.style.display = 'flex';

    // Update step indicators
    var steps = document.querySelectorAll('.scanner-step');
    steps.forEach(function(s) {
        var stepNum = parseInt(s.getAttribute('data-step'));
        s.classList.remove('active', 'completed');
        if (stepNum === step) s.classList.add('active');
        else if (stepNum < step) s.classList.add('completed');
    });

    if (step === 2) {
        setTimeout(function() { renderFilterPreviews(); }, 150);
    } else if (step === 3) {
        renderPagesQueue();
    }
}

// =============================================================================
// STEP 1: OVERLAY & CORNER DETECTION
// =============================================================================

function setupOverlay() {
    var wrapper = document.getElementById('scannerImageWrapper');
    var img = document.getElementById('cropperImage');
    var overlay = document.getElementById('scannerOverlay');

    if (!wrapper || !img || !overlay) return;

    var oW = img.offsetWidth;
    var oH = img.offsetHeight;

    if (oW < 5 || oH < 5) return;

    // Make wrapper match image size exactly
    wrapper.style.width = oW + 'px';
    wrapper.style.height = oH + 'px';

    // Size overlay to match image
    overlay.width = oW;
    overlay.height = oH;
    overlay.style.width = oW + 'px';
    overlay.style.height = oH + 'px';
    overlay.style.left = '0px';
    overlay.style.top = '0px';

    _overlayScale = img.naturalWidth / oW;
    _overlayReady = true;

    // Event listeners
    overlay.onmousedown = onOverlayMouseDown;
    overlay.onmousemove = onOverlayMouseMove;
    overlay.onmouseup = onOverlayMouseUp;
    overlay.onmouseleave = onOverlayMouseUp;
    overlay.ontouchstart = onOverlayTouchStart;
    overlay.ontouchmove = onOverlayTouchMove;
    overlay.ontouchend = onOverlayMouseUp;

    drawCorners();
}

function resetCorners() {
    if (!_scannerImage) return;
    var w = _scannerImage.naturalWidth;
    var h = _scannerImage.naturalHeight;
    var m = Math.min(w, h) * 0.02;
    _scannerCorners = [
        { x: m, y: m },
        { x: w - m, y: m },
        { x: w - m, y: h - m },
        { x: m, y: h - m }
    ];
    if (_overlayReady) drawCorners();
}

function autoDetectEdges() {
    if (!_scanicAvailable || !_scanicModule || !_scannerImage) {
        showToast('Detecção automática indisponível. Arraste os cantos manualmente.', 'warning');
        resetCorners();
        return;
    }

    showToast('Detectando bordas...', 'info');

    // Create a canvas from the scanner image for Scanic
    var tmpCanvas = document.createElement('canvas');
    var maxDim = 800;
    var scale = Math.min(1, maxDim / Math.max(_scannerImage.naturalWidth, _scannerImage.naturalHeight));
    tmpCanvas.width = Math.round(_scannerImage.naturalWidth * scale);
    tmpCanvas.height = Math.round(_scannerImage.naturalHeight * scale);
    tmpCanvas.getContext('2d').drawImage(_scannerImage, 0, 0, tmpCanvas.width, tmpCanvas.height);

    var scanFn = _scanicModule.scanDocument || _scanicModule.default;
    if (!scanFn) {
        showToast('Função de detecção não encontrada. Arraste os cantos.', 'warning');
        resetCorners();
        return;
    }

    scanFn(tmpCanvas).then(function(result) {
        if (result && result.success && result.corners) {
            var c = result.corners;
            if (c.topLeft && c.topRight && c.bottomRight && c.bottomLeft) {
                // Scale corners back to original image dimensions
                var invScale = 1 / scale;
                _scannerCorners = [
                    { x: c.topLeft.x * invScale, y: c.topLeft.y * invScale },
                    { x: c.topRight.x * invScale, y: c.topRight.y * invScale },
                    { x: c.bottomRight.x * invScale, y: c.bottomRight.y * invScale },
                    { x: c.bottomLeft.x * invScale, y: c.bottomLeft.y * invScale }
                ];
                drawCorners();
                showToast('Bordas detectadas! Ajuste se necessário.', 'success');
            } else {
                showToast('Bordas parciais detectadas. Ajuste manualmente.', 'warning');
                resetCorners();
            }
        } else {
            showToast('Bordas não detectadas. Arraste os cantos manualmente.', 'warning');
            resetCorners();
        }
    }).catch(function(e) {
        console.warn('[Scanner] Auto-detect failed:', e);
        showToast('Erro na detecção. Arraste os cantos manualmente.', 'warning');
        resetCorners();
    });
}

function drawCorners() {
    var overlay = document.getElementById('scannerOverlay');
    if (!overlay || !_scannerCorners) return;

    var ctx = overlay.getContext('2d');
    var scale = 1 / _overlayScale;

    ctx.clearRect(0, 0, overlay.width, overlay.height);

    // Dark mask outside selection
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.fillRect(0, 0, overlay.width, overlay.height);

    // Clear inside polygon
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.moveTo(_scannerCorners[0].x * scale, _scannerCorners[0].y * scale);
    for (var i = 1; i < 4; i++) {
        ctx.lineTo(_scannerCorners[i].x * scale, _scannerCorners[i].y * scale);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Draw polygon border with glow
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = 'rgba(59, 130, 246, 0.5)';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.moveTo(_scannerCorners[0].x * scale, _scannerCorners[0].y * scale);
    for (var i = 1; i < 4; i++) {
        ctx.lineTo(_scannerCorners[i].x * scale, _scannerCorners[i].y * scale);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Draw edge midpoint lines (dashed)
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    for (var i = 0; i < 4; i++) {
        var a = _scannerCorners[i];
        var b = _scannerCorners[(i + 1) % 4];
        var mx = ((a.x + b.x) / 2) * scale;
        var my = ((a.y + b.y) / 2) * scale;
    }
    ctx.setLineDash([]);

    // Draw corner handles
    var cornerRadius = Math.min(12, Math.max(8, overlay.width * 0.02));
    _scannerCorners.forEach(function(corner) {
        var cx = corner.x * scale;
        var cy = corner.y * scale;

        // Outer glow
        ctx.beginPath();
        ctx.arc(cx, cy, cornerRadius + 4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(59, 130, 246, 0.25)';
        ctx.fill();

        // Main circle
        ctx.beginPath();
        ctx.arc(cx, cy, cornerRadius, 0, Math.PI * 2);
        ctx.fillStyle = '#3b82f6';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Inner dot
        ctx.beginPath();
        ctx.arc(cx, cy, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
    });
}

// --- Drag Corner Points ---

function getOverlayPos(e, overlay) {
    var rect = overlay.getBoundingClientRect();
    return {
        x: (e.clientX - rect.left) * _overlayScale,
        y: (e.clientY - rect.top) * _overlayScale
    };
}

function findNearestCorner(pos) {
    if (!_scannerCorners) return -1;
    var minDist = 35 * _overlayScale;
    var nearest = -1;
    _scannerCorners.forEach(function(c, i) {
        var dx = c.x - pos.x;
        var dy = c.y - pos.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minDist) {
            minDist = dist;
            nearest = i;
        }
    });
    return nearest;
}

function onOverlayMouseDown(e) {
    e.preventDefault();
    var pos = getOverlayPos(e, e.target);
    _isDraggingCorner = findNearestCorner(pos);
    if (_isDraggingCorner >= 0) {
        e.target.style.cursor = 'grabbing';
    }
}

function onOverlayMouseMove(e) {
    e.preventDefault();
    var overlay = e.target;
    var pos = getOverlayPos(e, overlay);

    if (_isDraggingCorner >= 0) {
        var w = _scannerImage.naturalWidth;
        var h = _scannerImage.naturalHeight;
        _scannerCorners[_isDraggingCorner].x = Math.max(0, Math.min(w, pos.x));
        _scannerCorners[_isDraggingCorner].y = Math.max(0, Math.min(h, pos.y));
        drawCorners();
    } else {
        var near = findNearestCorner(pos);
        overlay.style.cursor = near >= 0 ? 'grab' : 'crosshair';
    }
}

function onOverlayMouseUp(e) {
    _isDraggingCorner = -1;
    if (e && e.target) e.target.style.cursor = 'crosshair';
}

function onOverlayTouchStart(e) {
    e.preventDefault();
    if (e.touches.length === 1) {
        var touch = e.touches[0];
        var overlay = e.target;
        var rect = overlay.getBoundingClientRect();
        var pos = {
            x: (touch.clientX - rect.left) * _overlayScale,
            y: (touch.clientY - rect.top) * _overlayScale
        };
        _isDraggingCorner = findNearestCorner(pos);
    }
}

function onOverlayTouchMove(e) {
    e.preventDefault();
    if (_isDraggingCorner >= 0 && e.touches.length === 1) {
        var touch = e.touches[0];
        var overlay = e.target;
        var rect = overlay.getBoundingClientRect();
        var pos = {
            x: (touch.clientX - rect.left) * _overlayScale,
            y: (touch.clientY - rect.top) * _overlayScale
        };
        var w = _scannerImage.naturalWidth;
        var h = _scannerImage.naturalHeight;
        _scannerCorners[_isDraggingCorner].x = Math.max(0, Math.min(w, pos.x));
        _scannerCorners[_isDraggingCorner].y = Math.max(0, Math.min(h, pos.y));
        drawCorners();
    }
}

// =============================================================================
// STEP 1 -> STEP 2: Perspective correction
// =============================================================================

function applyDetectionAndGoStep2() {
    if (!_scannerImage || !_scannerCorners) return;
    showToast('Processando recorte...', 'info');

    // Try Scanic extractDocument first for better perspective correction
    if (_scanicAvailable && _scanicModule) {
        var extractFn = _scanicModule.extractDocument || (_scanicModule.default && _scanicModule.default.extractDocument);
        if (extractFn) {
            var tmpCanvas = document.createElement('canvas');
            tmpCanvas.width = _scannerImage.naturalWidth;
            tmpCanvas.height = _scannerImage.naturalHeight;
            tmpCanvas.getContext('2d').drawImage(_scannerImage, 0, 0);

            var scanicCorners = {
                topLeft: { x: _scannerCorners[0].x, y: _scannerCorners[0].y },
                topRight: { x: _scannerCorners[1].x, y: _scannerCorners[1].y },
                bottomRight: { x: _scannerCorners[2].x, y: _scannerCorners[2].y },
                bottomLeft: { x: _scannerCorners[3].x, y: _scannerCorners[3].y }
            };

            extractFn(tmpCanvas, scanicCorners)
                .then(function(result) {
                    if (result && result.success && result.output instanceof HTMLCanvasElement) {
                        console.log('[Scanner] Scanic perspective correction applied');
                        transitionToStep2(result.output);
                    } else {
                        console.log('[Scanner] Scanic extract returned non-canvas, using fallback');
                        fallbackPerspectiveCrop();
                    }
                })
                .catch(function(e) {
                    console.warn('[Scanner] Scanic extract failed, using fallback:', e.message);
                    fallbackPerspectiveCrop();
                });
            return;
        }
    }

    // Fallback to manual bilinear warp
    setTimeout(function() { fallbackPerspectiveCrop(); }, 50);
}

function fallbackPerspectiveCrop() {
    var result = manualPerspectiveCrop();
    if (result) {
        transitionToStep2(result);
    } else {
        showToast('Erro ao processar. Tente novamente.', 'error');
    }
}

function skipToStep2NoCrop() {
    if (!_scannerImage) return;
    var canvas = document.createElement('canvas');
    canvas.width = _scannerImage.naturalWidth;
    canvas.height = _scannerImage.naturalHeight;
    var ctx = canvas.getContext('2d');
    ctx.drawImage(_scannerImage, 0, 0);
    transitionToStep2(canvas);
}

function manualPerspectiveCrop() {
    if (!_scannerCorners || !_scannerImage) return null;

    var corners = _scannerCorners;
    var tl = corners[0], tr = corners[1], br = corners[2], bl = corners[3];

    // Calculate output dimensions from edge lengths
    var topW = Math.sqrt(Math.pow(tr.x - tl.x, 2) + Math.pow(tr.y - tl.y, 2));
    var botW = Math.sqrt(Math.pow(br.x - bl.x, 2) + Math.pow(br.y - bl.y, 2));
    var leftH = Math.sqrt(Math.pow(bl.x - tl.x, 2) + Math.pow(bl.y - tl.y, 2));
    var rightH = Math.sqrt(Math.pow(br.x - tr.x, 2) + Math.pow(br.y - tr.y, 2));

    var outW = Math.round(Math.max(topW, botW));
    var outH = Math.round(Math.max(leftH, rightH));
    if (outW < 10 || outH < 10) return null;
    outW = Math.min(outW, 2400);
    outH = Math.min(outH, 2400);

    // Check if nearly rectangular -> simple crop
    var threshold = Math.min(outW, outH) * 0.03;
    var topDiff = Math.abs(tl.y - tr.y);
    var botDiff = Math.abs(bl.y - br.y);
    var leftDiff = Math.abs(tl.x - bl.x);
    var rightDiff = Math.abs(tr.x - br.x);

    if (topDiff < threshold && botDiff < threshold && leftDiff < threshold && rightDiff < threshold) {
        var minX = Math.min(tl.x, bl.x);
        var minY = Math.min(tl.y, tr.y);
        var maxX = Math.max(tr.x, br.x);
        var maxY = Math.max(bl.y, br.y);
        var w = Math.round(maxX - minX);
        var h = Math.round(maxY - minY);
        if (w < 10 || h < 10) return null;
        var canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(_scannerImage, minX, minY, w, h, 0, 0, w, h);
        return canvas;
    }

    // Bilinear warp for perspective correction
    var srcCanvas = document.createElement('canvas');
    srcCanvas.width = _scannerImage.naturalWidth;
    srcCanvas.height = _scannerImage.naturalHeight;
    var srcCtx = srcCanvas.getContext('2d');
    srcCtx.drawImage(_scannerImage, 0, 0);
    var srcData = srcCtx.getImageData(0, 0, srcCanvas.width, srcCanvas.height);

    var dstCanvas = document.createElement('canvas');
    dstCanvas.width = outW;
    dstCanvas.height = outH;
    var dstCtx = dstCanvas.getContext('2d');
    var dstData = dstCtx.createImageData(outW, outH);

    var srcW = srcCanvas.width;
    for (var dy = 0; dy < outH; dy++) {
        for (var dx = 0; dx < outW; dx++) {
            var u = dx / outW;
            var v = dy / outH;

            var sx = (1 - u) * (1 - v) * tl.x + u * (1 - v) * tr.x + u * v * br.x + (1 - u) * v * bl.x;
            var sy = (1 - u) * (1 - v) * tl.y + u * (1 - v) * tr.y + u * v * br.y + (1 - u) * v * bl.y;

            var px = Math.max(0, Math.min(srcW - 1, Math.round(sx)));
            var py = Math.max(0, Math.min(srcCanvas.height - 1, Math.round(sy)));

            var srcIdx = (py * srcW + px) * 4;
            var dstIdx = (dy * outW + dx) * 4;
            dstData.data[dstIdx] = srcData.data[srcIdx];
            dstData.data[dstIdx + 1] = srcData.data[srcIdx + 1];
            dstData.data[dstIdx + 2] = srcData.data[srcIdx + 2];
            dstData.data[dstIdx + 3] = srcData.data[srcIdx + 3];
        }
    }

    dstCtx.putImageData(dstData, 0, 0);
    return dstCanvas;
}

function transitionToStep2(canvas) {
    if (!canvas) {
        showToast('Erro ao processar imagem', 'error');
        return;
    }

    // Limit dimensions
    var maxDim = 1600;
    if (canvas.width > maxDim || canvas.height > maxDim) {
        var ratio = Math.min(maxDim / canvas.width, maxDim / canvas.height);
        var newW = Math.round(canvas.width * ratio);
        var newH = Math.round(canvas.height * ratio);
        var resized = document.createElement('canvas');
        resized.width = newW;
        resized.height = newH;
        resized.getContext('2d').drawImage(canvas, 0, 0, newW, newH);
        canvas = resized;
    }

    var ctx = canvas.getContext('2d');
    _step2ImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    _step2Canvas = document.getElementById('filterCanvas');
    _step2Canvas.width = canvas.width;
    _step2Canvas.height = canvas.height;
    _step2Canvas.getContext('2d').putImageData(_step2ImageData, 0, 0);

    _currentFilter = 'original';
    resetAdjustments();

    var filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(function(b) {
        b.classList.toggle('active', b.getAttribute('data-filter') === 'original');
    });

    goToScanStep(2);
}

// =============================================================================
// STEP 2: FILTERS
// =============================================================================

function renderFilterPreviews() {
    if (!_step2ImageData) return;

    var filterIds = ['original', 'document', 'bw', 'grayscale'];
    filterIds.forEach(function(fid) {
        var canvasId = 'filterPreview' + fid.charAt(0).toUpperCase() + fid.slice(1);
        var previewCanvas = document.getElementById(canvasId);
        if (!previewCanvas) return;

        var pw = previewCanvas.width;
        var ph = previewCanvas.height;

        var tmp = document.createElement('canvas');
        tmp.width = _step2ImageData.width;
        tmp.height = _step2ImageData.height;
        tmp.getContext('2d').putImageData(_step2ImageData, 0, 0);

        applyFilterToCanvas(tmp, fid);

        var pctx = previewCanvas.getContext('2d');
        pctx.clearRect(0, 0, pw, ph);
        var scale = Math.min(pw / tmp.width, ph / tmp.height);
        var dw = tmp.width * scale;
        var dh = tmp.height * scale;
        pctx.drawImage(tmp, (pw - dw) / 2, (ph - dh) / 2, dw, dh);
    });
}

function applyDocFilter(filterType) {
    _currentFilter = filterType;
    var filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(function(b) {
        b.classList.toggle('active', b.getAttribute('data-filter') === filterType);
    });
    redrawStep2Canvas();
}

function redrawStep2Canvas() {
    if (!_step2ImageData || !_step2Canvas) return;
    var ctx = _step2Canvas.getContext('2d');
    ctx.putImageData(_step2ImageData, 0, 0);
    applyFilterToCanvas(_step2Canvas, _currentFilter);

    if (_adjustments.brightness !== 100 || _adjustments.contrast !== 100 ||
        _adjustments.saturation !== 100 || _adjustments.sharpness > 0) {
        applyCanvasAdjustmentsInPlace(_step2Canvas, _adjustments);
    }
}

function applyFilterToCanvas(canvas, filterType) {
    if (filterType === 'original') return;
    var ctx = canvas.getContext('2d');
    var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    var data = imageData.data;

    switch (filterType) {
        case 'bw':
            for (var i = 0; i < data.length; i += 4) {
                var gray = data[i] * 0.299 + data[i+1] * 0.587 + data[i+2] * 0.114;
                var val = gray > 140 ? 255 : 0;
                data[i] = data[i+1] = data[i+2] = val;
            }
            break;
        case 'grayscale':
            for (var i = 0; i < data.length; i += 4) {
                var gray = data[i] * 0.299 + data[i+1] * 0.587 + data[i+2] * 0.114;
                data[i] = data[i+1] = data[i+2] = gray;
            }
            break;
        case 'document':
            for (var i = 0; i < data.length; i += 4) {
                var gray = data[i] * 0.299 + data[i+1] * 0.587 + data[i+2] * 0.114;
                var r = data[i] * 0.3 + gray * 0.7;
                var g = data[i+1] * 0.3 + gray * 0.7;
                var b = data[i+2] * 0.3 + gray * 0.7;
                var factor = 1.5;
                r = factor * (r - 128) + 128 + 15;
                g = factor * (g - 128) + 128 + 15;
                b = factor * (b - 128) + 128 + 15;
                data[i] = Math.max(0, Math.min(255, r));
                data[i+1] = Math.max(0, Math.min(255, g));
                data[i+2] = Math.max(0, Math.min(255, b));
            }
            break;
    }
    ctx.putImageData(imageData, 0, 0);
}

function applyCanvasAdjustmentsInPlace(canvas, adj) {
    var ctx = canvas.getContext('2d');
    var b = adj.brightness / 100;
    var c = adj.contrast / 100;
    var s = adj.saturation / 100;

    if (typeof ctx.filter !== 'undefined') {
        var tmp = document.createElement('canvas');
        tmp.width = canvas.width;
        tmp.height = canvas.height;
        tmp.getContext('2d').drawImage(canvas, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.filter = 'brightness(' + b + ') contrast(' + c + ') saturate(' + s + ')';
        ctx.drawImage(tmp, 0, 0);
        ctx.filter = 'none';
    }

    if (adj.sharpness > 0) {
        applyUnsharpMask(ctx, canvas.width, canvas.height, adj.sharpness / 100);
    }
}

// =============================================================================
// STEP 2: ADJUSTMENTS
// =============================================================================

function applyImageAdjustments() {
    var b = document.getElementById('adjustBrightness');
    var c = document.getElementById('adjustContrast');
    var s = document.getElementById('adjustSaturation');
    var sh = document.getElementById('adjustSharpness');
    if (!b || !c || !s || !sh) return;

    _adjustments.brightness = parseInt(b.value);
    _adjustments.contrast = parseInt(c.value);
    _adjustments.saturation = parseInt(s.value);
    _adjustments.sharpness = parseInt(sh.value);

    var vb = document.getElementById('valBrightness');
    var vc = document.getElementById('valContrast');
    var vs = document.getElementById('valSaturation');
    var vsh = document.getElementById('valSharpness');
    if (vb) vb.textContent = _adjustments.brightness + '%';
    if (vc) vc.textContent = _adjustments.contrast + '%';
    if (vs) vs.textContent = _adjustments.saturation + '%';
    if (vsh) vsh.textContent = _adjustments.sharpness + '%';

    if (_scannerStep === 2) redrawStep2Canvas();
}

function resetAdjustments() {
    _adjustments = { brightness: 100, contrast: 100, saturation: 100, sharpness: 0 };
    var ids = ['adjustBrightness', 'adjustContrast', 'adjustSaturation'];
    var vals = ['valBrightness', 'valContrast', 'valSaturation'];
    ids.forEach(function(id, i) {
        var el = document.getElementById(id);
        if (el) el.value = 100;
        var v = document.getElementById(vals[i]);
        if (v) v.textContent = '100%';
    });
    var sh = document.getElementById('adjustSharpness');
    if (sh) sh.value = 0;
    var vsh = document.getElementById('valSharpness');
    if (vsh) vsh.textContent = '0%';

    if (_scannerStep === 2) redrawStep2Canvas();
}

function autoEnhanceImage() {
    _adjustments = { brightness: 115, contrast: 130, saturation: 80, sharpness: 30 };
    var b = document.getElementById('adjustBrightness');
    var c = document.getElementById('adjustContrast');
    var s = document.getElementById('adjustSaturation');
    var sh = document.getElementById('adjustSharpness');
    if (b) b.value = 115;
    if (c) c.value = 130;
    if (s) s.value = 80;
    if (sh) sh.value = 30;
    applyImageAdjustments();
    showToast('Ajuste automático aplicado!', 'success');
}

function toggleAdjustments() {
    var panel = document.getElementById('adjustmentsPanel');
    var icon = document.getElementById('adjustmentsToggleIcon');
    if (!panel) return;
    var isHidden = panel.style.display === 'none';
    panel.style.display = isHidden ? 'flex' : 'none';
    if (icon) {
        icon.classList.toggle('fa-chevron-down', !isHidden);
        icon.classList.toggle('fa-chevron-up', isHidden);
    }
}

// =============================================================================
// STEP 2 -> STEP 3: Add page
// =============================================================================

function addPageAndContinue() {
    if (!_step2Canvas) return;
    var dataUrl = _step2Canvas.toDataURL('image/jpeg', 0.90);

    var thumbCanvas = document.createElement('canvas');
    thumbCanvas.width = 120;
    thumbCanvas.height = 160;
    var tctx = thumbCanvas.getContext('2d');
    var scale = Math.min(120 / _step2Canvas.width, 160 / _step2Canvas.height);
    var tw = _step2Canvas.width * scale;
    var th = _step2Canvas.height * scale;
    tctx.fillStyle = '#f0f0f0';
    tctx.fillRect(0, 0, 120, 160);
    tctx.drawImage(_step2Canvas, (120 - tw) / 2, (160 - th) / 2, tw, th);
    var thumbUrl = thumbCanvas.toDataURL('image/jpeg', 0.6);

    _scannedPages.push({ dataUrl: dataUrl, thumbUrl: thumbUrl });
    showToast('Página ' + _scannedPages.length + ' adicionada!', 'success');

    if (cropperQueue.length > 0) {
        closeCropperModalSilent();
        processNextInCropperQueue();
    } else if (_addMoreMode) {
        _addMoreMode = false;
        goToScanStep(3);
    } else {
        goToScanStep(3);
    }
}

// =============================================================================
// STEP 3: PAGE QUEUE
// =============================================================================

function renderPagesQueue() {
    var container = document.getElementById('pagesQueue');
    var countEl = document.getElementById('pagesCount');
    if (!container) return;
    container.innerHTML = '';

    if (countEl) {
        countEl.textContent = _scannedPages.length + ' página' + (_scannedPages.length !== 1 ? 's' : '');
    }

    _scannedPages.forEach(function(page, index) {
        var item = document.createElement('div');
        item.className = 'page-thumb';
        item.setAttribute('draggable', 'true');
        item.setAttribute('data-index', index);

        item.ondragstart = function(e) {
            e.dataTransfer.setData('text/plain', index);
            item.classList.add('dragging');
        };
        item.ondragend = function() { item.classList.remove('dragging'); };
        item.ondragover = function(e) { e.preventDefault(); item.classList.add('drag-over'); };
        item.ondragleave = function() { item.classList.remove('drag-over'); };
        item.ondrop = function(e) {
            e.preventDefault();
            item.classList.remove('drag-over');
            var fromIdx = parseInt(e.dataTransfer.getData('text/plain'));
            if (fromIdx !== index) reorderPages(fromIdx, index);
        };

        var badge = document.createElement('span');
        badge.className = 'page-number';
        badge.textContent = (index + 1);
        item.appendChild(badge);

        var img = document.createElement('img');
        img.src = page.thumbUrl;
        img.alt = 'Página ' + (index + 1);
        item.appendChild(img);

        var removeBtn = document.createElement('button');
        removeBtn.className = 'page-remove';
        removeBtn.innerHTML = '<i class="fas fa-times"></i>';
        removeBtn.title = 'Remover página';
        removeBtn.onclick = function(e) { e.stopPropagation(); removePageFromQueue(index); };
        item.appendChild(removeBtn);

        container.appendChild(item);
    });

    var combineOpts = document.getElementById('combineOptions');
    if (combineOpts) {
        combineOpts.style.display = _scannedPages.length > 1 ? 'flex' : 'none';
    }
}

function removePageFromQueue(index) {
    _scannedPages.splice(index, 1);
    renderPagesQueue();
    showToast('Página removida', 'success');
    if (_scannedPages.length === 0) {
        goToScanStep(1);
    }
}

function reorderPages(fromIdx, toIdx) {
    var page = _scannedPages.splice(fromIdx, 1)[0];
    _scannedPages.splice(toIdx, 0, page);
    renderPagesQueue();
}

function addMorePages() {
    _addMoreMode = true;
    var input = document.getElementById('expenseReceipt');
    if (input) input.click();
}

// =============================================================================
// STEP 3: FINALIZE
// =============================================================================

function finalizePages() {
    if (_scannedPages.length === 0) {
        showToast('Adicione pelo menos uma página', 'warning');
        return;
    }

    var combineMode = 'pdf';
    var radioEl = document.querySelector('input[name="combineMode"]:checked');
    if (radioEl) combineMode = radioEl.value;

    if (_scannedPages.length === 1) {
        // Single page - just add as image
        finalizePagesAsImages();
    } else if (combineMode === 'pdf') {
        finalizePagesAsPDF();
    } else {
        finalizePagesAsImages();
    }
}

function finalizePagesAsPDF() {
    showToast('Gerando PDF...', 'info');
    var promises = _scannedPages.map(function(page, i) {
        return dataUrlToFile(page.dataUrl, 'pagina_' + (i + 1) + '.jpg', 'image/jpeg');
    });

    Promise.all(promises).then(function(files) {
        if (isEditingExistingReceipt) {
            currentReceiptFiles[currentCropperFileIndex] = files[0];
        } else {
            files.forEach(function(f) { currentReceiptFiles.push(f); });
        }
        displayReceiptPreview();
        closeCropperModalFinal();
        showToast(_scannedPages.length + ' página(s) adicionada(s)!', 'success');
    }).catch(function(e) {
        console.error('[Scanner] Finalize error:', e);
        showToast('Erro ao finalizar', 'error');
    });
}

function finalizePagesAsImages() {
    var promises = _scannedPages.map(function(page, i) {
        return dataUrlToFile(page.dataUrl, 'nota_' + (i + 1) + '.jpg', 'image/jpeg');
    });

    Promise.all(promises).then(function(files) {
        if (isEditingExistingReceipt) {
            currentReceiptFiles[currentCropperFileIndex] = files[0];
        } else {
            files.forEach(function(f) { currentReceiptFiles.push(f); });
        }
        displayReceiptPreview();
        closeCropperModalFinal();
        showToast(files.length + ' imagem(ns) adicionada(s)!', 'success');
    });
}

function dataUrlToFile(dataUrl, filename, mimeType) {
    return fetch(dataUrl)
        .then(function(res) { return res.blob(); })
        .then(function(blob) {
            return new File([blob], filename, { type: mimeType });
        });
}

// =============================================================================
// ROTATION / FLIP / ZOOM (Step 1)
// =============================================================================

function cropperRotateLeft() {
    if (!_scannerImage) return;
    _scannerRotation = (_scannerRotation - 90 + 360) % 360;
    applyTransformToImage();
}

function cropperRotateRight() {
    if (!_scannerImage) return;
    _scannerRotation = (_scannerRotation + 90) % 360;
    applyTransformToImage();
}

function cropperFlipH() {
    _scannerFlipH *= -1;
    _flipH = _scannerFlipH;
    applyTransformToImage();
}

function cropperFlipV() {
    _scannerFlipV *= -1;
    _flipV = _scannerFlipV;
    applyTransformToImage();
}

function cropperZoomIn() {
    var img = document.getElementById('cropperImage');
    if (!img) return;
    var match = img.style.transform.match(/scale\(([^)]+)\)/);
    var current = match ? parseFloat(match[1]) : 1;
    img.style.transform = buildTransformString(current + 0.15);
}

function cropperZoomOut() {
    var img = document.getElementById('cropperImage');
    if (!img) return;
    var match = img.style.transform.match(/scale\(([^)]+)\)/);
    var current = match ? parseFloat(match[1]) : 1;
    img.style.transform = buildTransformString(Math.max(0.3, current - 0.15));
}

function cropperReset() {
    _scannerRotation = 0;
    _scannerFlipH = 1;
    _scannerFlipV = 1;
    _flipH = 1;
    _flipV = 1;
    applyTransformToImage();
    resetCorners();
}

function buildTransformString(scale) {
    scale = scale || 1;
    var parts = [];
    if (_scannerRotation !== 0) parts.push('rotate(' + _scannerRotation + 'deg)');
    if (_scannerFlipH === -1) parts.push('scaleX(-1)');
    if (_scannerFlipV === -1) parts.push('scaleY(-1)');
    if (scale !== 1) parts.push('scale(' + scale + ')');
    return parts.join(' ') || 'none';
}

function applyTransformToImage() {
    var img = document.getElementById('cropperImage');
    if (!img) return;
    img.style.transform = buildTransformString();
    setTimeout(function() {
        rebuildScannerImage();
        setupOverlay();
    }, 150);
}

function rebuildScannerImage() {
    var canvas = document.createElement('canvas');
    var origW = _scannerImage.naturalWidth;
    var origH = _scannerImage.naturalHeight;
    var isRotated = (_scannerRotation === 90 || _scannerRotation === 270);

    canvas.width = isRotated ? origH : origW;
    canvas.height = isRotated ? origW : origH;
    var ctx = canvas.getContext('2d');
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(_scannerRotation * Math.PI / 180);
    ctx.scale(_scannerFlipH, _scannerFlipV);
    ctx.drawImage(_scannerImage, -origW / 2, -origH / 2);
    ctx.restore();

    var newImg = new Image();
    newImg.onload = function() {
        _scannerImage = newImg;
        resetCorners();
    };
    newImg.src = canvas.toDataURL('image/jpeg', 0.95);
}

// =============================================================================
// CLOSE / CLEANUP
// =============================================================================

function closeCropperModal() {
    var modal = document.getElementById('cropperModal');
    if (modal) modal.style.display = 'none';
    if (typeof cropperInstance !== 'undefined' && cropperInstance) {
        cropperInstance.destroy();
        cropperInstance = null;
    }
    _scannerImage = null;
    _scannerCorners = null;
    _scannerImageFile = null;
    _step2ImageData = null;
    _step2Canvas = null;
    _scannedPages = [];
    _scannerStep = 1;
    _currentFilter = 'original';
    _addMoreMode = false;
    _overlayReady = false;
    currentCropperFileIndex = null;
    isEditingExistingReceipt = false;
    processNextInCropperQueue();
}

function closeCropperModalSilent() {
    var modal = document.getElementById('cropperModal');
    if (modal) modal.style.display = 'none';
    _scannerImage = null;
    _scannerCorners = null;
    _step2ImageData = null;
    _step2Canvas = null;
    _scannerStep = 1;
    _currentFilter = 'original';
    _overlayReady = false;
}

function closeCropperModalFinal() {
    var modal = document.getElementById('cropperModal');
    if (modal) modal.style.display = 'none';
    _scannerImage = null;
    _scannerCorners = null;
    _scannerImageFile = null;
    _step2ImageData = null;
    _step2Canvas = null;
    _scannedPages = [];
    _scannerStep = 1;
    _currentFilter = 'original';
    _addMoreMode = false;
    _overlayReady = false;
    currentCropperFileIndex = null;
    isEditingExistingReceipt = false;
    cropperQueue = [];
}

// =============================================================================
// BACKWARD COMPAT ALIASES
// =============================================================================

function skipCrop() {
    if (_scannerStep === 1) skipToStep2NoCrop();
}

function applyCrop() {
    if (_scannerStep === 1) applyDetectionAndGoStep2();
    else if (_scannerStep === 2) addPageAndContinue();
}

function editReceiptImage(index) {
    var file = currentReceiptFiles[index];
    if (file && file.type.startsWith('image/')) {
        initDocumentScanner(file, index);
    }
}

function setCropperAspectRatio(value) { /* no-op compat */ }

// =============================================================================
// DISPLAY RECEIPT PREVIEW
// =============================================================================

function displayReceiptPreview() {
    var preview = document.getElementById('receiptPreview');
    if (!preview) return;
    preview.innerHTML = '';

    currentReceiptFiles.forEach(function(file, index) {
        var item = document.createElement('div');
        item.className = 'receipt-preview-item';

        if (file.type.startsWith('image/')) {
            var img = document.createElement('img');
            img.src = URL.createObjectURL(file);
            item.appendChild(img);

            var editBtn = document.createElement('button');
            editBtn.className = 'edit-receipt';
            editBtn.innerHTML = '<i class="fas fa-crop-alt"></i>';
            editBtn.title = 'Editar imagem';
            editBtn.onclick = function(e) { e.stopPropagation(); editReceiptImage(index); };
            item.appendChild(editBtn);
        } else {
            var pdfIcon = document.createElement('div');
            pdfIcon.className = 'pdf-icon';
            pdfIcon.innerHTML = '<i class="fas fa-file-pdf"></i>';
            item.appendChild(pdfIcon);
        }

        var removeBtn = document.createElement('button');
        removeBtn.className = 'remove-receipt';
        removeBtn.innerHTML = '\u00d7';
        removeBtn.onclick = function() { removeReceipt(index); };
        item.appendChild(removeBtn);

        preview.appendChild(item);
    });

    if (currentReceiptFiles.length > 1) {
        var countBadge = document.createElement('div');
        countBadge.className = 'receipt-count-badge';
        countBadge.textContent = currentReceiptFiles.length + ' arquivos';
        preview.appendChild(countBadge);
    }
}

// =============================================================================
// CANVAS UTILS
// =============================================================================

function applyCanvasAdjustments(sourceCanvas, adj) {
    var canvas = document.createElement('canvas');
    canvas.width = sourceCanvas.width;
    canvas.height = sourceCanvas.height;
    var ctx = canvas.getContext('2d');
    var b = adj.brightness / 100;
    var c = adj.contrast / 100;
    var s = adj.saturation / 100;

    if (typeof ctx.filter !== 'undefined') {
        ctx.filter = 'brightness(' + b + ') contrast(' + c + ') saturate(' + s + ')';
        ctx.drawImage(sourceCanvas, 0, 0);
        ctx.filter = 'none';
    } else {
        ctx.drawImage(sourceCanvas, 0, 0);
    }

    if (adj.sharpness > 0) {
        applyUnsharpMask(ctx, canvas.width, canvas.height, adj.sharpness / 100);
    }
    return canvas;
}

function applyUnsharpMask(ctx, w, h, amount) {
    if (amount <= 0) return;
    var imageData = ctx.getImageData(0, 0, w, h);
    var data = imageData.data;
    var copy = new Uint8ClampedArray(data);
    var strength = amount * 2;
    for (var y = 1; y < h - 1; y++) {
        for (var x = 1; x < w - 1; x++) {
            for (var ch = 0; ch < 3; ch++) {
                var idx = (y * w + x) * 4 + ch;
                var center = copy[idx] * (1 + 4 * strength);
                var neighbors = (
                    copy[((y-1)*w+x)*4+ch] + copy[((y+1)*w+x)*4+ch] +
                    copy[(y*w+x-1)*4+ch] + copy[(y*w+x+1)*4+ch]
                ) * strength;
                data[idx] = Math.min(255, Math.max(0, center - neighbors));
            }
        }
    }
    ctx.putImageData(imageData, 0, 0);
}

console.log('[Scanner v2] Document scanner module loaded');
