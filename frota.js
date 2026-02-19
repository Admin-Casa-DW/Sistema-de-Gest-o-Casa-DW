// ==============================
// Gerenciamento de Frota - DW Administradora
// ==============================

const FLEET_STORAGE_KEY = 'fleetData';

// Initial data from spreadsheet
const initialFleetData = {
    updateDate: '10/01/2026',
    vehicles: [
        {
            marca: 'TOYOTA',
            modelo: 'COROLLA XEI 2.0',
            ano: '2018/2019',
            placa: 'BZA1B19',
            chassi: '9BRBD3HE9K0398237',
            renavam: '1163141116',
            proxRevisao: '2026-03-26',
            proxRevisaoKm: '86.500',
            oficina: 'RIOZEN BARRA (21) 96499-7752 EDMILSON',
            blindagem: 'SIM',
            revBlindagem: '2025-01-18',
            seguradora: 'YELUM',
            kmAtual: '82.322',
            observacoes: '',
            kmHistory: []
        },
        {
            marca: 'TOYOTA',
            modelo: 'HILUX SW4',
            ano: '2016/2016',
            placa: 'QEU9B00',
            chassi: '8AJBU3FS5G0020177',
            renavam: '1095333574',
            proxRevisao: '2025-10-01',
            proxRevisaoKm: '98.920',
            oficina: '',
            blindagem: 'SIM',
            revBlindagem: '2024-12-26',
            seguradora: 'YELUM',
            kmAtual: '97.352',
            observacoes: 'EMPRESTADO KDW EM 08/12/2025',
            kmHistory: []
        },
        {
            marca: 'MERCEDES',
            modelo: 'EQC400 4M (100% ELÉTRICO)',
            ano: '2020/2020',
            placa: 'AKD5A19',
            chassi: 'W1K8P9AW2LF012258',
            renavam: '1249166591',
            proxRevisao: '2026-07-30',
            proxRevisaoKm: '51.119',
            oficina: 'AB INTERCAR (21) 96445-6627 ALEXANDRE',
            blindagem: 'SIM',
            revBlindagem: '2025-05-09',
            seguradora: 'YELUM',
            kmAtual: '42.282',
            observacoes: 'OFICINA MERCEDES 26/11/2025',
            kmHistory: []
        },
        {
            marca: 'MERCEDES',
            modelo: 'GLB200 PROGRESSIVE 1.3',
            ano: '2020/2021',
            placa: 'FPD4C08',
            chassi: 'W1N4M8HW3MW106970',
            renavam: '1256798352',
            proxRevisao: '2027-01-05',
            proxRevisaoKm: '39.411',
            oficina: '',
            blindagem: 'SIM',
            revBlindagem: '2025-04-18',
            seguradora: 'PORTO SEGURO',
            kmAtual: '29.445',
            observacoes: '',
            kmHistory: []
        },
        {
            marca: 'HYUNDAI',
            modelo: 'PALISADE 38GDI SIG',
            ano: '2024/2025',
            placa: 'SSB9G10',
            chassi: 'KMHR381EDSU828694',
            renavam: '1407401340',
            proxRevisao: '2026-10-30',
            proxRevisaoKm: '20.000',
            oficina: 'CAOA (21) 99863-6432 MARLI',
            blindagem: 'SIM',
            revBlindagem: '2025-10-29',
            seguradora: 'PORTO SEGURO',
            kmAtual: '12.672',
            observacoes: '',
            kmHistory: []
        },
        {
            marca: 'CHERY',
            modelo: 'TIGGO 8 PRO (HÍBRIDO)',
            ano: '2024/2025',
            placa: 'TJY7G62',
            chassi: 'LNNBBDAT5SD021172',
            renavam: '1418998394',
            proxRevisao: '2026-12-26',
            proxRevisaoKm: '20.000',
            oficina: 'CHERY (21) 96903-3405 Melissa',
            blindagem: 'SIM',
            revBlindagem: '2024-12-28',
            seguradora: 'TOKIO MARINE',
            kmAtual: '9.122',
            observacoes: '',
            kmHistory: []
        }
    ]
};

let fleetData = null;
let currentHistoryIndex = -1;

// ---- Initialization ----
document.addEventListener('DOMContentLoaded', async function() {
    console.log('DOM loaded, initializing frota...');

    // Mostrar loading enquanto carrega
    showFrotaLoading();

    await loadFleetData();
    populateFilters();
    renderVehicles();
    updateStatusCards();
    setupEventListeners();

    hideFrotaLoading();

    console.log('Frota initialized successfully');
});

function showFrotaLoading() {
    const container = document.querySelector('.frota-container');
    if (container && !document.getElementById('frotaLoadingOverlay')) {
        const overlay = document.createElement('div');
        overlay.id = 'frotaLoadingOverlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            backdrop-filter: blur(4px);
        `;
        overlay.innerHTML = `
            <div style="text-align: center; color: white;">
                <i class="fas fa-spinner fa-spin fa-3x" style="margin-bottom: 20px;"></i>
                <p style="font-size: 18px; font-weight: 500;">Carregando frota...</p>
            </div>
        `;
        document.body.appendChild(overlay);
    }
}

function hideFrotaLoading() {
    const overlay = document.getElementById('frotaLoadingOverlay');
    if (overlay) {
        overlay.remove();
    }
}

function setupEventListeners() {
    console.log('Setting up event listeners...');

    // Header buttons
    const btnNovoVeiculo = document.getElementById('btnNovoVeiculo');
    const btnExportar = document.getElementById('btnExportar');
    const btnImprimir = document.getElementById('btnImprimir');
    const btnVoltar = document.getElementById('btnVoltar');

    console.log('Header buttons found:', {
        btnNovoVeiculo: !!btnNovoVeiculo,
        btnExportar: !!btnExportar,
        btnImprimir: !!btnImprimir,
        btnVoltar: !!btnVoltar
    });

    if (btnNovoVeiculo) {
        btnNovoVeiculo.addEventListener('click', function(e) {
            console.log('Novo Veículo clicked!');
            e.preventDefault();
            openVehicleModal();
        });
    }
    if (btnExportar) {
        btnExportar.addEventListener('click', function(e) {
            console.log('Exportar clicked!');
            e.preventDefault();
            exportFleet();
        });
    }
    if (btnImprimir) {
        btnImprimir.addEventListener('click', function(e) {
            console.log('Imprimir clicked!');
            window.print();
        });
    }
    if (btnVoltar) {
        btnVoltar.addEventListener('click', function(e) {
            console.log('Voltar clicked!');
            window.location.href = 'index.html';
        });
    }

    // Modal buttons
    const btnCloseVehicleModal = document.querySelectorAll('#btnCloseVehicleModal');
    const btnSaveVehicle = document.getElementById('btnSaveVehicle');
    const btnCloseDetailModal = document.querySelectorAll('#btnCloseDetailModal');
    const btnCloseHistoryModal = document.querySelectorAll('#btnCloseHistoryModal');
    const btnAddKmHistory = document.getElementById('btnAddKmHistory');

    // File upload listeners
    const vDocumento = document.getElementById('vDocumento');
    const vNotasFiscais = document.getElementById('vNotasFiscais');

    if (vDocumento) {
        vDocumento.addEventListener('change', function(e) {
            handleFileUpload(e, 'documentoFileName');
        });
    }
    if (vNotasFiscais) {
        vNotasFiscais.addEventListener('change', function(e) {
            handleFileUpload(e, 'notasFileName');
        });
    }

    console.log('Modal buttons found:', {
        btnCloseVehicleModal: btnCloseVehicleModal.length,
        btnSaveVehicle: !!btnSaveVehicle,
        btnCloseDetailModal: btnCloseDetailModal.length,
        btnCloseHistoryModal: btnCloseHistoryModal.length,
        btnAddKmHistory: !!btnAddKmHistory
    });

    // Handle multiple close buttons with same ID
    btnCloseVehicleModal.forEach(btn => {
        btn.addEventListener('click', function(e) {
            console.log('Close Vehicle Modal clicked!');
            e.preventDefault();
            closeVehicleModal();
        });
    });

    if (btnSaveVehicle) {
        btnSaveVehicle.addEventListener('click', function(e) {
            console.log('Save Vehicle clicked!');
            e.preventDefault();
            saveVehicle();
        });
    }

    btnCloseDetailModal.forEach(btn => {
        btn.addEventListener('click', function(e) {
            console.log('Close Detail Modal clicked!');
            e.preventDefault();
            closeDetailModal();
        });
    });

    btnCloseHistoryModal.forEach(btn => {
        btn.addEventListener('click', function(e) {
            console.log('Close History Modal clicked!');
            e.preventDefault();
            closeHistoryModal();
        });
    });

    if (btnAddKmHistory) {
        btnAddKmHistory.addEventListener('click', function(e) {
            console.log('Add KM History clicked!');
            e.preventDefault();
            addKmHistory();
        });
    }

    // Filter inputs
    const searchFilter = document.getElementById('searchFilter');
    if (searchFilter) searchFilter.addEventListener('input', applyFilters);

    // Filter selects
    const filterSelects = document.querySelectorAll('.filter-select');
    filterSelects.forEach(select => {
        select.addEventListener('change', applyFilters);
    });

    console.log('Event listeners setup complete');
}

async function loadFleetData() {
    try {
        console.log('☁️ Carregando dados da frota da nuvem...');

        if (window.CloudStorage) {
            const cloudData = await window.CloudStorage.loadAll();

            if (cloudData && cloudData.fleet && cloudData.fleet.vehicles && cloudData.fleet.vehicles.length > 0) {
                fleetData = cloudData.fleet;
                // Ensure all vehicles have kmHistory
                fleetData.vehicles.forEach(v => {
                    if (!v.kmHistory) v.kmHistory = [];
                });
                console.log('✅ Dados da frota carregados da nuvem!');
            } else {
                console.log('ℹ️ Nenhum dado de frota na nuvem, restaurando dados iniciais');
                fleetData = JSON.parse(JSON.stringify(initialFleetData));

                // Salvar dados iniciais na nuvem automaticamente
                console.log('💾 Salvando dados iniciais da frota na nuvem...');
                await saveFleetDataSilent();
                console.log('✅ Dados iniciais da frota restaurados na nuvem!');
            }
        } else {
            console.warn('⚠️ CloudStorage não disponível, usando dados iniciais');
            fleetData = JSON.parse(JSON.stringify(initialFleetData));
        }
    } catch (e) {
        console.error('❌ Erro ao carregar frota:', e);
        fleetData = JSON.parse(JSON.stringify(initialFleetData));
    }

    document.getElementById('updateDate').textContent = 'ATUALIZADO: ' + fleetData.updateDate;
}

async function saveFleetData() {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    fleetData.updateDate = `${day}/${month}/${year}`;
    document.getElementById('updateDate').textContent = 'ATUALIZADO: ' + fleetData.updateDate;

    await saveFleetDataToCloud();
}

// Salvar silenciosamente (sem atualizar data) - usado para restaurar dados iniciais
async function saveFleetDataSilent() {
    await saveFleetDataToCloud();
}

// Função interna para salvar na nuvem (apenas frota, sem recarregar tudo)
async function saveFleetDataToCloud() {
    try {
        console.log('☁️ Salvando dados da frota na nuvem...');

        const userId = window.getUserId ? window.getUserId() : null;
        const apiUrl = window.APP_CONFIG?.API_URL;

        if (!userId || !apiUrl) {
            console.error('❌ USER_ID ou API_URL não definido');
            alert('Erro: usuário não identificado. Faça login novamente.');
            return;
        }

        // Salvar diretamente apenas a frota, sem recarregar tudo
        const response = await fetch(`${apiUrl}/api/sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: userId,
                expenses: [],
                income: [],
                notes: [],
                systemUsers: [],
                fleet: fleetData
            })
        });

        if (response.ok) {
            console.log('✅ Dados da frota salvos na nuvem!');
        } else {
            console.error('❌ Erro ao salvar dados da frota:', response.status);
            alert('Erro ao salvar dados da frota na nuvem.');
        }
    } catch (e) {
        console.error('❌ Erro ao salvar frota:', e);
        alert('Erro ao salvar dados da frota.');
    }
}

// ---- Filters ----
function populateFilters() {
    const marcas = [...new Set(fleetData.vehicles.map(v => v.marca))].sort();
    const seguradoras = [...new Set(fleetData.vehicles.map(v => v.seguradora).filter(s => s))].sort();

    const marcaSelect = document.getElementById('marcaFilter');
    marcaSelect.innerHTML = '<option value="">Todas</option>';
    marcas.forEach(m => {
        marcaSelect.innerHTML += `<option value="${m}">${m}</option>`;
    });

    const segSelect = document.getElementById('seguradoraFilter');
    segSelect.innerHTML = '<option value="">Todas</option>';
    seguradoras.forEach(s => {
        segSelect.innerHTML += `<option value="${s}">${s}</option>`;
    });
}

function applyFilters() {
    renderVehicles();
}

function getFilteredVehicles() {
    const search = document.getElementById('searchFilter').value.toLowerCase();
    const marca = document.getElementById('marcaFilter').value;
    const blindagem = document.getElementById('blindagemFilter').value;
    const seguradora = document.getElementById('seguradoraFilter').value;
    const revisao = document.getElementById('revisaoFilter').value;
    const today = new Date();
    const in30days = new Date();
    in30days.setDate(in30days.getDate() + 30);

    return fleetData.vehicles.filter((v, idx) => {
        // Search filter
        if (search) {
            const searchStr = `${v.marca} ${v.modelo} ${v.placa} ${v.chassi} ${v.renavam} ${v.oficina} ${v.seguradora} ${v.observacoes}`.toLowerCase();
            if (!searchStr.includes(search)) return false;
        }

        // Marca filter
        if (marca && v.marca !== marca) return false;

        // Blindagem filter
        if (blindagem && v.blindagem !== blindagem) return false;

        // Seguradora filter
        if (seguradora && v.seguradora !== seguradora) return false;

        // Revisão status filter
        if (revisao) {
            const revDate = v.proxRevisao ? new Date(v.proxRevisao + 'T00:00:00') : null;
            if (revisao === 'vencida' && (!revDate || revDate >= today)) return false;
            if (revisao === 'proxima' && (!revDate || revDate < today || revDate > in30days)) return false;
            if (revisao === 'ok' && (!revDate || revDate <= in30days)) return false;
        }

        return true;
    });
}

// ---- Rendering ----
function renderVehicles() {
    const tbody = document.getElementById('vehiclesTableBody');
    const filtered = getFilteredVehicles();
    const countEl = document.getElementById('vehicleCount');
    countEl.textContent = `${filtered.length} de ${fleetData.vehicles.length} veículo(s)`;

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="14" style="text-align:center; padding:40px; color:#bdc3c7;"><i class="fas fa-car" style="font-size:40px; display:block; margin-bottom:10px;"></i>Nenhum veículo encontrado</td></tr>';
        return;
    }

    const today = new Date();
    const in30days = new Date();
    in30days.setDate(in30days.getDate() + 30);

    tbody.innerHTML = filtered.map(v => {
        const idx = fleetData.vehicles.indexOf(v);
        const revDate = v.proxRevisao ? new Date(v.proxRevisao + 'T00:00:00') : null;
        let revClass = 'revisao-ok';
        let revLabel = '';
        if (revDate) {
            if (revDate < today) {
                revClass = 'revisao-vencida';
                revLabel = ' (VENCIDA)';
            } else if (revDate <= in30days) {
                revClass = 'revisao-proxima';
                revLabel = ' (PRÓXIMA)';
            }
        }

        const kmAtual = parseKm(v.kmAtual);
        const kmRev = parseKm(v.proxRevisaoKm);
        let kmPercent = 0;
        let kmColor = '#27ae60';
        if (kmRev > 0) {
            kmPercent = Math.min(100, (kmAtual / kmRev) * 100);
            if (kmPercent >= 95) kmColor = '#e74c3c';
            else if (kmPercent >= 80) kmColor = '#f39c12';
        }

        return `<tr data-vehicle-index="${idx}">
            <td>
                <div class="marca-modelo">
                    <span class="marca">${v.marca}</span>
                    <span class="modelo">${v.modelo}</span>
                </div>
            </td>
            <td>${v.ano}</td>
            <td><strong>${v.placa}</strong></td>
            <td style="font-size:11px;">${v.chassi || '-'}</td>
            <td style="font-size:11px;">${v.renavam || '-'}</td>
            <td class="${revClass}">${formatDate(v.proxRevisao)}${revLabel}</td>
            <td>${v.proxRevisaoKm || '-'}</td>
            <td>
                <div class="km-bar">
                    <span>${v.kmAtual || '-'}</span>
                    ${kmRev > 0 ? `<div class="km-progress"><div class="km-progress-fill" style="width:${kmPercent}%; background:${kmColor};"></div></div>` : ''}
                </div>
            </td>
            <td style="font-size:12px; max-width:150px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${escapeHtml(v.oficina)}">${v.oficina || '-'}</td>
            <td>${v.blindagem === 'SIM' ? '<span class="badge badge-success">SIM</span>' : '<span class="badge badge-danger">NÃO</span>'}</td>
            <td class="${getBlindagemRevClass(v.revBlindagem)}">${formatDate(v.revBlindagem)}</td>
            <td><span class="badge badge-primary">${v.seguradora || '-'}</span></td>
            <td class="obs-text" title="${escapeHtml(v.observacoes)}">${v.observacoes || '-'}</td>
            <td>
                <div class="action-btns">
                    <button class="btn-icon view" title="Detalhes" data-action="view"><i class="fas fa-eye"></i></button>
                    <button class="btn-icon history" title="Histórico KM" data-action="history"><i class="fas fa-history"></i></button>
                    <button class="btn-icon edit" title="Editar" data-action="edit"><i class="fas fa-edit"></i></button>
                    <button class="btn-icon delete" title="Excluir" data-action="delete"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        </tr>`;
    }).join('');

    // Add event delegation for action buttons
    setupTableActions();
}

function setupTableActions() {
    const tbody = document.getElementById('vehiclesTableBody');
    tbody.removeEventListener('click', handleTableClick);
    tbody.addEventListener('click', handleTableClick);
}

function handleTableClick(e) {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;

    const action = btn.dataset.action;
    const row = btn.closest('tr');
    const index = parseInt(row.dataset.vehicleIndex);

    if (isNaN(index)) return;

    switch(action) {
        case 'view':
            viewVehicle(index);
            break;
        case 'history':
            openHistoryModal(index);
            break;
        case 'edit':
            editVehicle(index);
            break;
        case 'delete':
            deleteVehicle(index);
            break;
    }
}

function getBlindagemRevClass(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    const in30days = new Date();
    in30days.setDate(in30days.getDate() + 30);
    if (d < today) return 'revisao-vencida';
    if (d <= in30days) return 'revisao-proxima';
    return 'revisao-ok';
}

function updateStatusCards() {
    const vehicles = fleetData.vehicles;
    const today = new Date();

    document.getElementById('totalVehicles').textContent = vehicles.length;
    document.getElementById('totalBlindados').textContent = vehicles.filter(v => v.blindagem === 'SIM').length;

    const revisaoVencida = vehicles.filter(v => {
        if (!v.proxRevisao) return false;
        return new Date(v.proxRevisao + 'T00:00:00') < today;
    }).length;
    document.getElementById('totalRevisaoVencida').textContent = revisaoVencida;

    const seguradoras = [...new Set(vehicles.map(v => v.seguradora).filter(s => s))].length;
    document.getElementById('totalSeguradoras').textContent = seguradoras;
}

// ---- Helpers ----
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function parseKm(str) {
    if (!str) return 0;
    return parseInt(String(str).replace(/\./g, '').replace(/,/g, '')) || 0;
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function parseDateBR(str) {
    // dd/mm/yyyy -> yyyy-mm-dd
    if (!str) return '';
    const parts = str.split('/');
    if (parts.length !== 3) return str;
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
}

// ---- File Upload Handler ----
function handleFileUpload(event, displayElementId) {
    const file = event.target.files[0];
    const displayElement = document.getElementById(displayElementId);

    if (file) {
        if (file.type !== 'application/pdf') {
            alert('Por favor, selecione apenas arquivos PDF.');
            event.target.value = '';
            displayElement.textContent = '';
            return;
        }

        // Display file name and size
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
        displayElement.innerHTML = `<i class="fas fa-check-circle" style="color:#28a745;"></i> ${file.name} (${fileSizeMB} MB)`;

        // Convert to base64
        const reader = new FileReader();
        reader.onload = function(e) {
            // Store base64 in the file input's dataset
            event.target.dataset.base64 = e.target.result;
            event.target.dataset.filename = file.name;
        };
        reader.readAsDataURL(file);
    } else {
        displayElement.textContent = '';
    }
}

// ---- Vehicle Modal ----
function openVehicleModal(vehicle, index) {
    console.log('openVehicleModal called with:', { vehicle, index });

    const modal = document.getElementById('vehicleModal');
    console.log('Modal element found:', !!modal);
    console.log('Modal current classes:', modal ? modal.className : 'N/A');

    if (modal) {
        modal.classList.add('active');
        console.log('Added active class to modal');
        console.log('Modal classes after add:', modal.className);
        console.log('Modal display style:', window.getComputedStyle(modal).display);

        // Check the inner modal div
        const innerModal = modal.querySelector('.modal');
        console.log('Inner modal found:', !!innerModal);
        if (innerModal) {
            console.log('Inner modal display:', window.getComputedStyle(innerModal).display);
            console.log('Inner modal visibility:', window.getComputedStyle(innerModal).visibility);
            console.log('Inner modal opacity:', window.getComputedStyle(innerModal).opacity);
        }
    }

    document.getElementById('vehicleForm').reset();
    document.getElementById('vehicleIndex').value = index !== undefined ? index : -1;

    // Clear file displays
    document.getElementById('documentoFileName').textContent = '';
    document.getElementById('notasFileName').textContent = '';

    if (vehicle) {
        document.getElementById('vehicleModalTitle').innerHTML = '<i class="fas fa-edit"></i> Editar Veículo';
        document.getElementById('vMarca').value = vehicle.marca || '';
        document.getElementById('vModelo').value = vehicle.modelo || '';
        document.getElementById('vAno').value = vehicle.ano || '';
        document.getElementById('vPlaca').value = vehicle.placa || '';
        document.getElementById('vChassi').value = vehicle.chassi || '';
        document.getElementById('vRenavam').value = vehicle.renavam || '';
        document.getElementById('vProxRevisao').value = vehicle.proxRevisao || '';
        document.getElementById('vProxRevisaoKm').value = vehicle.proxRevisaoKm || '';
        document.getElementById('vKmAtual').value = vehicle.kmAtual || '';
        document.getElementById('vOficina').value = vehicle.oficina || '';
        document.getElementById('vBlindagem').value = vehicle.blindagem || 'NÃO';
        document.getElementById('vRevBlindagem').value = vehicle.revBlindagem || '';
        document.getElementById('vSeguradora').value = vehicle.seguradora || '';
        document.getElementById('vObservacoes').value = vehicle.observacoes || '';

        // Display existing files
        if (vehicle.documento) {
            const docInput = document.getElementById('vDocumento');
            docInput.dataset.base64 = vehicle.documento;
            docInput.dataset.filename = vehicle.documentoNome || 'documento.pdf';
            document.getElementById('documentoFileName').innerHTML = `<i class="fas fa-check-circle" style="color:#28a745;"></i> ${vehicle.documentoNome || 'documento.pdf'}`;
        }
        if (vehicle.notasFiscais) {
            const notasInput = document.getElementById('vNotasFiscais');
            notasInput.dataset.base64 = vehicle.notasFiscais;
            notasInput.dataset.filename = vehicle.notasFiscaisNome || 'notas.pdf';
            document.getElementById('notasFileName').innerHTML = `<i class="fas fa-check-circle" style="color:#28a745;"></i> ${vehicle.notasFiscaisNome || 'notas.pdf'}`;
        }
    } else {
        document.getElementById('vehicleModalTitle').innerHTML = '<i class="fas fa-car"></i> Novo Veículo';
    }
}

function closeVehicleModal() {
    document.getElementById('vehicleModal').classList.remove('active');
}

function saveVehicle() {
    const form = document.getElementById('vehicleForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const docInput = document.getElementById('vDocumento');
    const notasInput = document.getElementById('vNotasFiscais');

    const vehicle = {
        marca: document.getElementById('vMarca').value.toUpperCase().trim(),
        modelo: document.getElementById('vModelo').value.toUpperCase().trim(),
        ano: document.getElementById('vAno').value.trim(),
        placa: document.getElementById('vPlaca').value.toUpperCase().trim(),
        chassi: document.getElementById('vChassi').value.toUpperCase().trim(),
        renavam: document.getElementById('vRenavam').value.trim(),
        proxRevisao: document.getElementById('vProxRevisao').value,
        proxRevisaoKm: document.getElementById('vProxRevisaoKm').value.trim(),
        oficina: document.getElementById('vOficina').value.trim(),
        blindagem: document.getElementById('vBlindagem').value,
        revBlindagem: document.getElementById('vRevBlindagem').value,
        seguradora: document.getElementById('vSeguradora').value.toUpperCase().trim(),
        kmAtual: document.getElementById('vKmAtual').value.trim(),
        observacoes: document.getElementById('vObservacoes').value.trim(),
        kmHistory: []
    };

    // Add PDF files if uploaded
    if (docInput.dataset.base64) {
        vehicle.documento = docInput.dataset.base64;
        vehicle.documentoNome = docInput.dataset.filename;
    }
    if (notasInput.dataset.base64) {
        vehicle.notasFiscais = notasInput.dataset.base64;
        vehicle.notasFiscaisNome = notasInput.dataset.filename;
    }

    const index = parseInt(document.getElementById('vehicleIndex').value);

    if (index >= 0) {
        // Keep existing history
        vehicle.kmHistory = fleetData.vehicles[index].kmHistory || [];
        fleetData.vehicles[index] = vehicle;
    } else {
        fleetData.vehicles.push(vehicle);
    }

    saveFleetData();
    populateFilters();
    renderVehicles();
    updateStatusCards();
    closeVehicleModal();
}

function editVehicle(index) {
    openVehicleModal(fleetData.vehicles[index], index);
}

function deleteVehicle(index) {
    const v = fleetData.vehicles[index];
    if (confirm(`Deseja excluir o veículo ${v.marca} ${v.modelo} (${v.placa})?`)) {
        fleetData.vehicles.splice(index, 1);
        saveFleetData();
        populateFilters();
        renderVehicles();
        updateStatusCards();
    }
}

// ---- Detail Modal ----
function viewVehicle(index) {
    const v = fleetData.vehicles[index];
    document.getElementById('detailModalTitle').innerHTML = `<i class="fas fa-car"></i> ${v.marca} ${v.modelo}`;

    const today = new Date();
    const revDate = v.proxRevisao ? new Date(v.proxRevisao + 'T00:00:00') : null;
    let revStatus = '<span class="badge badge-info">-</span>';
    if (revDate) {
        if (revDate < today) revStatus = '<span class="badge badge-danger">VENCIDA</span>';
        else {
            const days = Math.ceil((revDate - today) / (1000 * 60 * 60 * 24));
            if (days <= 30) revStatus = `<span class="badge badge-warning">EM ${days} DIAS</span>`;
            else revStatus = `<span class="badge badge-success">EM DIA (${days} dias)</span>`;
        }
    }

    const kmAtual = parseKm(v.kmAtual);
    const kmRev = parseKm(v.proxRevisaoKm);
    let kmStatus = '';
    if (kmRev > 0 && kmAtual > 0) {
        const remaining = kmRev - kmAtual;
        if (remaining <= 0) kmStatus = '<span class="badge badge-danger">KM EXCEDIDO</span>';
        else if (remaining <= 1000) kmStatus = `<span class="badge badge-warning">FALTAM ${remaining.toLocaleString('pt-BR')} KM</span>`;
        else kmStatus = `<span class="badge badge-success">FALTAM ${remaining.toLocaleString('pt-BR')} KM</span>`;
    }

    document.getElementById('detailContent').innerHTML = `
        <div class="detail-item">
            <span class="detail-label">Marca</span>
            <span class="detail-value">${v.marca}</span>
        </div>
        <div class="detail-item">
            <span class="detail-label">Modelo</span>
            <span class="detail-value">${v.modelo}</span>
        </div>
        <div class="detail-item">
            <span class="detail-label">Ano</span>
            <span class="detail-value">${v.ano}</span>
        </div>
        <div class="detail-item">
            <span class="detail-label">Placa</span>
            <span class="detail-value">${v.placa}</span>
        </div>
        <div class="detail-item">
            <span class="detail-label">Chassi</span>
            <span class="detail-value">${v.chassi || '-'}</span>
        </div>
        <div class="detail-item">
            <span class="detail-label">Renavam</span>
            <span class="detail-value">${v.renavam || '-'}</span>
        </div>
        <div class="detail-item">
            <span class="detail-label">Próxima Revisão</span>
            <span class="detail-value">${formatDate(v.proxRevisao)} ${revStatus}</span>
        </div>
        <div class="detail-item">
            <span class="detail-label">Revisão KM</span>
            <span class="detail-value">${v.proxRevisaoKm || '-'} ${kmStatus}</span>
        </div>
        <div class="detail-item">
            <span class="detail-label">KM Atual</span>
            <span class="detail-value">${v.kmAtual || '-'}</span>
        </div>
        <div class="detail-item">
            <span class="detail-label">Oficina</span>
            <span class="detail-value">${v.oficina || '-'}</span>
        </div>
        <div class="detail-item">
            <span class="detail-label">Blindagem</span>
            <span class="detail-value">${v.blindagem === 'SIM' ? '<span class="badge badge-success">SIM</span>' : '<span class="badge badge-danger">NÃO</span>'}</span>
        </div>
        <div class="detail-item">
            <span class="detail-label">Revisão Blindagem</span>
            <span class="detail-value">${formatDate(v.revBlindagem)}</span>
        </div>
        <div class="detail-item">
            <span class="detail-label">Seguradora</span>
            <span class="detail-value">${v.seguradora || '-'}</span>
        </div>
        <div class="detail-item detail-full">
            <span class="detail-label">Observações</span>
            <span class="detail-value">${v.observacoes || '-'}</span>
        </div>
        ${v.documento ? `
        <div class="detail-item">
            <span class="detail-label"><i class="fas fa-file-pdf"></i> Documento do Veículo</span>
            <span class="detail-value">
                <button class="btn btn-sm btn-primary" onclick="downloadPDF('${escapeHtml(v.documento)}', '${escapeHtml(v.documentoNome || 'documento.pdf')}')">
                    <i class="fas fa-download"></i> Baixar
                </button>
                <button class="btn btn-sm btn-secondary" onclick="viewPDF('${escapeHtml(v.documento)}')">
                    <i class="fas fa-eye"></i> Visualizar
                </button>
            </span>
        </div>` : ''}
        ${v.notasFiscais ? `
        <div class="detail-item">
            <span class="detail-label"><i class="fas fa-file-invoice"></i> Notas Fiscais</span>
            <span class="detail-value">
                <button class="btn btn-sm btn-primary" onclick="downloadPDF('${escapeHtml(v.notasFiscais)}', '${escapeHtml(v.notasFiscaisNome || 'notas-fiscais.pdf')}')">
                    <i class="fas fa-download"></i> Baixar
                </button>
                <button class="btn btn-sm btn-secondary" onclick="viewPDF('${escapeHtml(v.notasFiscais)}')">
                    <i class="fas fa-eye"></i> Visualizar
                </button>
            </span>
        </div>` : ''}
    `;

    document.getElementById('detailModal').classList.add('active');
}

function closeDetailModal() {
    document.getElementById('detailModal').classList.remove('active');
}

// ---- KM History Modal ----
function openHistoryModal(index) {
    currentHistoryIndex = index;
    const v = fleetData.vehicles[index];
    document.getElementById('historyModalTitle').innerHTML = `<i class="fas fa-history"></i> Histórico KM - ${v.marca} ${v.modelo} (${v.placa})`;

    // Set today's date as default
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('histDate').value = today;
    document.getElementById('histKm').value = '';
    document.getElementById('histDesc').value = '';

    renderHistory();
    document.getElementById('historyModal').classList.add('active');
}

function closeHistoryModal() {
    document.getElementById('historyModal').classList.remove('active');
    currentHistoryIndex = -1;
}

function addKmHistory() {
    if (currentHistoryIndex < 0) return;

    const date = document.getElementById('histDate').value;
    const km = document.getElementById('histKm').value.trim();
    const desc = document.getElementById('histDesc').value.trim();

    if (!date || !km) {
        alert('Preencha a data e o KM.');
        return;
    }

    const v = fleetData.vehicles[currentHistoryIndex];
    if (!v.kmHistory) v.kmHistory = [];

    v.kmHistory.push({ date, km, desc });
    // Sort descending by date
    v.kmHistory.sort((a, b) => b.date.localeCompare(a.date));

    // Update current KM to the latest entry
    if (v.kmHistory.length > 0) {
        v.kmAtual = v.kmHistory[0].km;
    }

    saveFleetData();
    renderHistory();
    renderVehicles();
    updateStatusCards();

    // Clear inputs
    document.getElementById('histKm').value = '';
    document.getElementById('histDesc').value = '';
}

function deleteKmHistory(histIndex) {
    if (currentHistoryIndex < 0) return;
    const v = fleetData.vehicles[currentHistoryIndex];
    if (confirm('Remover este registro de histórico?')) {
        v.kmHistory.splice(histIndex, 1);
        saveFleetData();
        renderHistory();
    }
}

function renderHistory() {
    const list = document.getElementById('historyList');
    if (currentHistoryIndex < 0) return;

    const v = fleetData.vehicles[currentHistoryIndex];
    const history = v.kmHistory || [];

    if (history.length === 0) {
        list.innerHTML = '<div class="no-history"><i class="fas fa-info-circle"></i> Nenhum registro de histórico</div>';
        return;
    }

    list.innerHTML = history.map((h, i) => `
        <div class="history-item">
            <span class="history-date">${formatDate(h.date)}</span>
            <span class="history-desc">${h.desc || '-'}</span>
            <span class="history-km">${h.km} km</span>
            <button class="btn-icon delete" data-hist-index="${i}" title="Remover" style="margin-left:10px;"><i class="fas fa-times"></i></button>
        </div>
    `).join('');

    // Add event listeners for delete buttons
    list.querySelectorAll('button[data-hist-index]').forEach(btn => {
        btn.addEventListener('click', function() {
            const histIndex = parseInt(this.dataset.histIndex);
            deleteKmHistory(histIndex);
        });
    });
}

// ---- PDF Functions ----
function downloadPDF(base64Data, filename) {
    const link = document.createElement('a');
    link.href = base64Data;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function viewPDF(base64Data) {
    const newWindow = window.open();
    if (newWindow) {
        newWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Visualizar PDF</title>
                <style>
                    body { margin: 0; padding: 0; overflow: hidden; }
                    iframe { border: none; width: 100%; height: 100vh; }
                </style>
            </head>
            <body>
                <iframe src="${base64Data}"></iframe>
            </body>
            </html>
        `);
    } else {
        alert('Por favor, permita pop-ups para visualizar o PDF.');
    }
}

// ---- Export ----
function exportFleet() {
    const vehicles = getFilteredVehicles();
    const headers = ['Marca', 'Modelo', 'Ano', 'Placa', 'Chassi', 'Renavam', 'Próxima Revisão', 'Revisão KM', 'KM Atual', 'Oficina', 'Blindagem', 'Rev. Blindagem', 'Seguradora', 'Observações'];

    let csv = '\uFEFF'; // BOM for Excel UTF-8
    csv += headers.join(';') + '\n';

    vehicles.forEach(v => {
        csv += [
            v.marca,
            v.modelo,
            v.ano,
            v.placa,
            v.chassi,
            v.renavam,
            formatDate(v.proxRevisao),
            v.proxRevisaoKm,
            v.kmAtual,
            `"${(v.oficina || '').replace(/"/g, '""')}"`,
            v.blindagem,
            formatDate(v.revBlindagem),
            v.seguradora,
            `"${(v.observacoes || '').replace(/"/g, '""')}"`
        ].join(';') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `frota_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

// ---- Close modals on overlay click ----
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal-overlay')) {
        e.target.classList.remove('active');
    }
});

// ---- Close modals on Escape key ----
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active'));
    }
});

// Export PDF functions to window for onclick handlers
window.downloadPDF = downloadPDF;
window.viewPDF = viewPDF;

console.log('Frota.js loaded successfully');
