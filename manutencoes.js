// ==============================
// Manutenções Residenciais - DW Administradora
// ==============================

const API_URL_MANUT = window.APP_CONFIG?.API_URL || null;

let maintenances = [];
let maintenanceTypes = []; // lista gerenciada de tipos
let maintenanceAreas = []; // lista gerenciada de áreas
let calendarDate = new Date();
let editingId = null;
let viewingId = null;
let pendingFiles = [];

// Defaults se não houver nenhum salvo
const DEFAULT_TYPES = ['Pintura', 'Hidráulica', 'Elétrica', 'Ar-condicionado', 'Dedetização', 'Limpeza', 'Reforma', 'Manutenção preventiva', 'Instalação', 'Reparo'];
const DEFAULT_AREAS = ['Sala', 'Cozinha', 'Banheiro', 'Quarto', 'Garagem', 'Área externa', 'Piscina', 'Jardim', 'Lavanderia', 'Escritório', 'Geral'];

// ===== INIT =====
document.addEventListener('DOMContentLoaded', async function() {
    await loadData();
    updateDashboard();
    renderAlerts();
    renderCalendar();
    renderTable();
    populateFilterOptions();
    setDefaultDate();
    renderTypesList();
    renderAreasList();
    console.log('✅ Manutenções carregadas');
});

function setDefaultDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('manutDate').value = today;
}

// ===== DATA LOAD/SAVE =====
async function loadData() {
    try {
        const userId = sessionStorage.getItem('user-id');
        if (!userId || !API_URL_MANUT) {
            console.warn('⚠️ Sem userId ou API_URL — usando dados locais');
            maintenances = JSON.parse(sessionStorage.getItem('manut_local') || '[]');
            maintenanceTypes = JSON.parse(sessionStorage.getItem('manut_types') || 'null') || [...DEFAULT_TYPES];
            maintenanceAreas = JSON.parse(sessionStorage.getItem('manut_areas') || 'null') || [...DEFAULT_AREAS];
            return;
        }

        const response = await fetch(`${API_URL_MANUT}/api/sync/${userId}`);
        if (!response.ok) throw new Error('Erro na API');

        const data = await response.json();
        maintenances = data.maintenance || [];
        maintenanceTypes = (data.maintenanceTypes && data.maintenanceTypes.length > 0)
            ? data.maintenanceTypes
            : [...DEFAULT_TYPES];
        maintenanceAreas = (data.maintenanceAreas && data.maintenanceAreas.length > 0)
            ? data.maintenanceAreas
            : [...DEFAULT_AREAS];

        console.log(`✅ ${maintenances.length} manutenções, ${maintenanceTypes.length} tipos, ${maintenanceAreas.length} áreas carregados`);
    } catch (error) {
        console.error('❌ Erro ao carregar:', error);
        maintenances = [];
        maintenanceTypes = [...DEFAULT_TYPES];
        maintenanceAreas = [...DEFAULT_AREAS];
    }
}

async function saveMaintenances() {
    return saveToAPI({ maintenance: maintenances });
}

async function saveTypes() {
    return saveToAPI({ maintenanceTypes });
}

async function saveAreas() {
    return saveToAPI({ maintenanceAreas });
}

async function saveToAPI(payload) {
    try {
        const userId = sessionStorage.getItem('user-id');
        if (!userId || !API_URL_MANUT) {
            if (payload.maintenance !== undefined) sessionStorage.setItem('manut_local', JSON.stringify(maintenances));
            if (payload.maintenanceTypes !== undefined) sessionStorage.setItem('manut_types', JSON.stringify(maintenanceTypes));
            if (payload.maintenanceAreas !== undefined) sessionStorage.setItem('manut_areas', JSON.stringify(maintenanceAreas));
            return true;
        }

        const response = await fetch(`${API_URL_MANUT}/api/sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, ...payload })
        });

        if (response.ok) return true;
        console.error('❌ Erro ao salvar:', response.status);
        return false;
    } catch (error) {
        console.error('❌ Erro ao salvar:', error);
        return false;
    }
}

// ===== STATUS LOGIC =====
function getEffectiveStatus(m) {
    if (m.status === 'concluida') return 'concluida';
    if (m.status === 'em_andamento') return 'em_andamento';
    if (m.nextDate) {
        const next = new Date(m.nextDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (next < today) return 'vencida';
    }
    return m.status || 'pendente';
}

function statusLabel(s) {
    return { pendente: 'Pendente', em_andamento: 'Em Andamento', concluida: 'Concluída', vencida: 'Vencida' }[s] || s;
}

// ===== DASHBOARD =====
function updateDashboard() {
    const currentYear = new Date().getFullYear();
    let total = maintenances.length;
    let pending = 0, done = 0, overdue = 0, cost = 0;

    maintenances.forEach(m => {
        const s = getEffectiveStatus(m);
        if (s === 'concluida') done++;
        else if (s === 'vencida') overdue++;
        else pending++;

        const execYear = m.date ? parseInt(m.date.substring(0, 4)) : null;
        if (execYear === currentYear && m.cost) {
            cost += parseFloat(m.cost || 0);
        }
    });

    document.getElementById('cardTotal').textContent = total;
    document.getElementById('cardPending').textContent = pending;
    document.getElementById('cardOverdue').textContent = overdue;
    document.getElementById('cardDone').textContent = done;
    document.getElementById('cardCost').textContent = 'R$ ' + cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
}

// ===== ALERTS =====
function renderAlerts() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const in30 = new Date(today);
    in30.setDate(in30.getDate() + 30);

    const overdue = [];
    const soon = [];

    maintenances.forEach(m => {
        if (m.status === 'concluida') return;
        if (!m.nextDate) return;
        const next = new Date(m.nextDate);
        if (next < today) overdue.push(m);
        else if (next <= in30) soon.push(m);
    });

    const section = document.getElementById('alertsSection');
    const list = document.getElementById('alertsList');

    if (overdue.length === 0 && soon.length === 0) {
        section.style.display = 'none';
        return;
    }

    section.style.display = 'block';
    let html = '';

    overdue.forEach(m => {
        html += `
            <div class="alert-item">
                <div class="alert-icon overdue"><i class="fas fa-exclamation-triangle"></i></div>
                <div class="alert-info">
                    <strong>${m.type} — ${m.area}</strong>
                    <small>Próxima manutenção vencida em ${formatDate(m.nextDate)} · ${m.supplier || 'Sem fornecedor'}</small>
                </div>
                <button class="btn btn-secondary" style="margin-left:auto;font-size:12px;" onclick="openEditModal('${m.id}')">Editar</button>
            </div>`;
    });

    soon.forEach(m => {
        const days = Math.ceil((new Date(m.nextDate) - today) / 86400000);
        html += `
            <div class="alert-item">
                <div class="alert-icon soon"><i class="fas fa-clock"></i></div>
                <div class="alert-info">
                    <strong>${m.type} — ${m.area}</strong>
                    <small>Próxima previsão em ${days} dia(s) — ${formatDate(m.nextDate)} · ${m.supplier || 'Sem fornecedor'}</small>
                </div>
            </div>`;
    });

    list.innerHTML = html;
}

// ===== CALENDAR — somente data de execução =====
function renderCalendar() {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();

    const MONTH_NAMES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                         'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

    document.getElementById('calendarTitle').textContent = `${MONTH_NAMES[month]} ${year}`;

    const grid = document.getElementById('calendarGrid');
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    let html = days.map(d => `<div class="calendar-header">${d}</div>`).join('');

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrev = new Date(year, month, 0).getDate();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Indexar eventos pela data de EXECUÇÃO apenas
    const eventsMap = {};
    maintenances.forEach(m => {
        if (!m.date) return;
        // Usar new Date com timezone local para evitar off-by-one
        const parts = m.date.split('-');
        const execYear = parseInt(parts[0]);
        const execMonth = parseInt(parts[1]) - 1;
        const execDay = parseInt(parts[2]);

        if (execYear === year && execMonth === month) {
            if (!eventsMap[execDay]) eventsMap[execDay] = [];
            eventsMap[execDay].push(m);
        }
    });

    // Dias do mês anterior
    for (let i = firstDay - 1; i >= 0; i--) {
        html += `<div class="calendar-day other-month"><div class="calendar-day-num">${daysInPrev - i}</div></div>`;
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const isToday = date.getTime() === today.getTime();
        let eventsHtml = '';

        if (eventsMap[day]) {
            eventsMap[day].slice(0, 3).forEach(m => {
                const s = getEffectiveStatus(m);
                eventsHtml += `<div class="calendar-event status-${s}" title="${m.type} — ${m.area}" onclick="openViewModal('${m.id}')">
                    <i class="fas fa-tools" style="font-size:9px;"></i> ${m.type}
                </div>`;
            });
            if (eventsMap[day].length > 3) {
                eventsHtml += `<div style="font-size:10px;color:#999;padding:1px 4px;">+${eventsMap[day].length - 3} mais</div>`;
            }
        }

        html += `<div class="calendar-day${isToday ? ' today' : ''}">
            <div class="calendar-day-num">${day}</div>
            ${eventsHtml}
        </div>`;
    }

    // Dias do próximo mês
    const totalCells = firstDay + daysInMonth;
    const remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
    for (let i = 1; i <= remaining; i++) {
        html += `<div class="calendar-day other-month"><div class="calendar-day-num">${i}</div></div>`;
    }

    grid.innerHTML = html;
}

function changeMonth(dir) {
    calendarDate.setMonth(calendarDate.getMonth() + dir);
    renderCalendar();
}

// ===== TABLE =====
function renderTable() {
    const statusF = document.getElementById('filterStatus').value;
    const areaF = document.getElementById('filterArea').value;
    const typeF = document.getElementById('filterType').value;
    const searchF = document.getElementById('filterSearch').value.toLowerCase();

    let filtered = maintenances.filter(m => {
        const s = getEffectiveStatus(m);
        if (statusF && s !== statusF) return false;
        if (areaF && m.area !== areaF) return false;
        if (typeF && m.type !== typeF) return false;
        if (searchF) {
            const text = `${m.type} ${m.area} ${m.supplier} ${m.desc}`.toLowerCase();
            if (!text.includes(searchF)) return false;
        }
        return true;
    });

    filtered.sort((a, b) => {
        const na = a.date || '';
        const nb = b.date || '';
        return nb.localeCompare(na); // mais recente primeiro
    });

    const tbody = document.getElementById('manutTableBody');

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="no-data">
            <i class="fas fa-tools" style="font-size:40px;margin-bottom:10px;display:block;"></i>
            <p>Nenhuma manutenção encontrada.</p>
        </td></tr>`;
        return;
    }

    tbody.innerHTML = filtered.map(m => {
        const s = getEffectiveStatus(m);
        const cost = m.cost ? 'R$ ' + parseFloat(m.cost).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '-';
        return `<tr>
            <td><strong>${m.type}</strong>${m.recurring === 'sim' ? ' <span title="Recorrente" style="color:#3498db;font-size:11px;">↻</span>' : ''}</td>
            <td>${m.area}</td>
            <td>${m.supplier || '-'}</td>
            <td>${formatDate(m.date)}</td>
            <td>${formatDate(m.nextDate)}</td>
            <td>${cost}</td>
            <td><span class="status-badge ${s}">${statusLabel(s)}</span></td>
            <td>
                <button class="action-btn view" onclick="openViewModal('${m.id}')"><i class="fas fa-eye"></i></button>
                <button class="action-btn edit" onclick="openEditModal('${m.id}')"><i class="fas fa-edit"></i></button>
                <button class="action-btn delete" onclick="deleteManut('${m.id}')"><i class="fas fa-trash"></i></button>
            </td>
        </tr>`;
    }).join('');
}

function populateFilterOptions() {
    // Reset e repopula filtros
    const areaSelect = document.getElementById('filterArea');
    areaSelect.innerHTML = '<option value="">Todas as Áreas</option>';
    maintenanceAreas.sort().forEach(a => {
        const opt = document.createElement('option');
        opt.value = a; opt.textContent = a;
        areaSelect.appendChild(opt);
    });

    const typeSelect = document.getElementById('filterType');
    typeSelect.innerHTML = '<option value="">Todos os Tipos</option>';
    maintenanceTypes.sort().forEach(t => {
        const opt = document.createElement('option');
        opt.value = t; opt.textContent = t;
        typeSelect.appendChild(opt);
    });

    // Datalists para o formulário
    document.getElementById('areasList').innerHTML = maintenanceAreas.sort().map(a => `<option value="${a}">`).join('');
    document.getElementById('typesList').innerHTML = maintenanceTypes.sort().map(t => `<option value="${t}">`).join('');
}

// ===== TABS =====
function switchTab(tab, btn) {
    document.querySelectorAll('.manut-tab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.manut-panel').forEach(p => p.classList.remove('active'));
    const tabMap = { agenda: 'tabAgenda', lista: 'tabLista', tipos: 'tabTipos', areas: 'tabAreas' };
    document.getElementById(tabMap[tab]).classList.add('active');
    btn.classList.add('active');
}

// ===== MODAL: NOVA/EDITAR MANUTENÇÃO =====
function openManutModal() {
    editingId = null;
    pendingFiles = [];
    document.getElementById('modalTitle').textContent = 'Nova Manutenção';
    document.getElementById('manutForm').reset();
    document.getElementById('manutId').value = '';
    document.getElementById('uploadPreview').innerHTML = '';
    document.getElementById('recurrenceFields').classList.remove('visible');
    setDefaultDate();
    document.getElementById('manutModal').classList.add('active');
}

function openEditModal(id) {
    const m = maintenances.find(x => x.id === id);
    if (!m) return;

    editingId = id;
    pendingFiles = [];
    document.getElementById('modalTitle').textContent = 'Editar Manutenção';
    document.getElementById('manutId').value = m.id;
    document.getElementById('manutType').value = m.type || '';
    document.getElementById('manutArea').value = m.area || '';
    document.getElementById('manutSupplier').value = m.supplier || '';
    document.getElementById('manutDate').value = m.date || '';
    document.getElementById('manutNextDate').value = m.nextDate || '';
    document.getElementById('manutCost').value = m.cost || '';
    document.getElementById('manutStatus').value = m.status || 'pendente';
    document.getElementById('manutRecurring').value = m.recurring || 'nao';
    document.getElementById('manutPeriod').value = m.period || '365';
    document.getElementById('manutDesc').value = m.desc || '';
    document.getElementById('manutLaunchExpense').value = m.launchExpense || 'nao';

    renderExistingFiles(m.files || []);

    const recFields = document.getElementById('recurrenceFields');
    if (m.recurring === 'sim') recFields.classList.add('visible');
    else recFields.classList.remove('visible');

    document.getElementById('manutModal').classList.add('active');
}

function renderExistingFiles(files) {
    const preview = document.getElementById('uploadPreview');
    preview.innerHTML = files.map((f, i) => {
        const isImage = f.url && /\.(jpg|jpeg|png|gif|webp)/i.test(f.url);
        if (isImage) {
            return `<div class="upload-preview-item">
                <img src="${f.url}" alt="${f.name}" onclick="window.open('${f.url}','_blank')">
                <button class="remove-file" onclick="removeExistingFile(${i})" title="Remover">×</button>
                <div class="file-name">${f.name}</div>
            </div>`;
        } else {
            return `<div class="upload-preview-item">
                <a href="${f.url}" target="_blank"><i class="fas fa-file-pdf"></i> ${f.name}</a>
                <button class="remove-file" onclick="removeExistingFile(${i})" title="Remover" style="top:-3px;right:-3px;">×</button>
            </div>`;
        }
    }).join('');
}

function removeExistingFile(index) {
    if (!editingId) return;
    const m = maintenances.find(x => x.id === editingId);
    if (m && m.files) {
        m.files.splice(index, 1);
        renderExistingFiles(m.files);
    }
}

function closeManutModal() {
    document.getElementById('manutModal').classList.remove('active');
    pendingFiles = [];
    editingId = null;
}

function toggleRecurrence() {
    const val = document.getElementById('manutRecurring').value;
    const fields = document.getElementById('recurrenceFields');
    if (val === 'sim') {
        fields.classList.add('visible');
        autoCalcNextDate();
    } else {
        fields.classList.remove('visible');
    }
}

function autoCalcNextDate() {
    const dateVal = document.getElementById('manutDate').value;
    const period = parseInt(document.getElementById('manutPeriod').value || '365');
    if (!dateVal) return;
    const d = new Date(dateVal);
    d.setDate(d.getDate() + period);
    document.getElementById('manutNextDate').value = d.toISOString().split('T')[0];
}

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('manutDate')?.addEventListener('change', function() {
        if (document.getElementById('manutRecurring').value === 'sim') autoCalcNextDate();
    });
    document.getElementById('manutPeriod')?.addEventListener('change', autoCalcNextDate);
});

// ===== FILE UPLOAD =====
function handleFileSelect(event) {
    Array.from(event.target.files).forEach(file => pendingFiles.push(file));
    renderPendingFiles();
    event.target.value = '';
}

function renderPendingFiles() {
    const preview = document.getElementById('uploadPreview');
    preview.querySelectorAll('[data-pending]').forEach(el => el.remove());

    const html = pendingFiles.map((f, i) => {
        const isImage = f.type.startsWith('image/');
        if (isImage) {
            const url = URL.createObjectURL(f);
            return `<div class="upload-preview-item" data-pending="${i}">
                <img src="${url}" alt="${f.name}">
                <button class="remove-file" onclick="removePendingFile(${i})">×</button>
                <div class="file-name">${f.name}</div>
            </div>`;
        } else {
            return `<div class="upload-preview-item" data-pending="${i}">
                <div style="padding:8px;background:#f5f5f5;border-radius:5px;font-size:12px;max-width:70px;word-break:break-all;">
                    <i class="fas fa-file-pdf" style="color:#e74c3c;"></i><br>${f.name}
                </div>
                <button class="remove-file" onclick="removePendingFile(${i})">×</button>
            </div>`;
        }
    });

    preview.insertAdjacentHTML('beforeend', html.join(''));
}

function removePendingFile(index) {
    pendingFiles.splice(index, 1);
    renderPendingFiles();
}

async function uploadPendingFiles(userId) {
    const uploaded = [];
    for (const file of pendingFiles) {
        try {
            const base64 = await fileToBase64(file);
            const response = await fetch(`${API_URL_MANUT}/api/upload`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ file: base64, filename: file.name, userId })
            });
            const result = await response.json();
            if (result.success) uploaded.push({ name: file.name, url: result.url, publicId: result.publicId });
        } catch (err) {
            console.error('Erro ao enviar arquivo:', err);
        }
    }
    return uploaded;
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// ===== SAVE MANUTENÇÃO =====
async function saveManut(event) {
    event.preventDefault();

    const saveBtn = document.getElementById('saveBtn');
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';

    try {
        const userId = sessionStorage.getItem('user-id') || 'admin';

        let newFiles = [];
        if (pendingFiles.length > 0 && API_URL_MANUT) {
            showToast('Enviando arquivos...', 'warning');
            newFiles = await uploadPendingFiles(userId);
        }

        const id = editingId || generateId();
        const type = document.getElementById('manutType').value.trim();
        const area = document.getElementById('manutArea').value.trim();
        const supplier = document.getElementById('manutSupplier').value.trim();
        const date = document.getElementById('manutDate').value;
        const nextDate = document.getElementById('manutNextDate').value;
        const cost = document.getElementById('manutCost').value;
        const status = document.getElementById('manutStatus').value;
        const recurring = document.getElementById('manutRecurring').value;
        const period = document.getElementById('manutPeriod').value;
        const desc = document.getElementById('manutDesc').value.trim();
        const launchExpense = document.getElementById('manutLaunchExpense').value;

        let existingFiles = [];
        if (editingId) {
            const existing = maintenances.find(x => x.id === editingId);
            existingFiles = existing?.files || [];
        }

        const record = {
            id,
            type,
            area,
            supplier,
            date,
            nextDate,
            cost: cost ? parseFloat(cost) : null,
            status,
            recurring,
            period: recurring === 'sim' ? period : null,
            desc,
            launchExpense,
            files: [...existingFiles, ...newFiles],
            updatedAt: new Date().toISOString()
        };

        if (editingId) {
            const idx = maintenances.findIndex(x => x.id === editingId);
            record.createdAt = maintenances[idx].createdAt;
            maintenances[idx] = record;
        } else {
            record.createdAt = new Date().toISOString();
            maintenances.push(record);
        }

        if (launchExpense === 'sim' && cost && parseFloat(cost) > 0) {
            await launchAsExpense(record, userId);
        }

        const saved = await saveMaintenances();

        if (saved) {
            showToast(editingId ? 'Manutenção atualizada!' : 'Manutenção cadastrada!', 'success');
            closeManutModal();
            updateDashboard();
            renderAlerts();
            renderCalendar();
            renderTable();
            populateFilterOptions();
        } else {
            showToast('Erro ao salvar. Tente novamente.', 'error');
        }
    } catch (err) {
        console.error('Erro ao salvar manutenção:', err);
        showToast('Erro ao salvar.', 'error');
    } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="fas fa-save"></i> Salvar';
        pendingFiles = [];
    }
}

async function launchAsExpense(record, userId) {
    try {
        const resp = await fetch(`${API_URL_MANUT}/api/sync/${userId}`);
        const data = await resp.json();

        const monthIndex = record.date ? parseInt(record.date.substring(5, 7)) - 1 : new Date().getMonth();
        const expensesByMonth = {};
        for (let i = 0; i < 12; i++) expensesByMonth[i] = [];

        if (data.expenses && Array.isArray(data.expenses)) {
            data.expenses.forEach(exp => {
                (exp.items || []).forEach(item => {
                    expensesByMonth[exp.month] = expensesByMonth[exp.month] || [];
                    expensesByMonth[exp.month].push({
                        ...item,
                        year: item.date ? parseInt(item.date.substring(0, 4)) : exp.year
                    });
                });
            });
        }

        expensesByMonth[monthIndex].push({
            id: generateId(),
            date: record.date,
            category: 'Manutenção',
            supplier: record.supplier || record.type,
            description: `Manutenção: ${record.type} — ${record.area}`,
            paymentMethod: 'Conta Corrente',
            amount: record.cost,
            year: record.date ? parseInt(record.date.substring(0, 4)) : new Date().getFullYear()
        });

        const expensesAPI = [];
        for (let i = 0; i < 12; i++) {
            if (expensesByMonth[i] && expensesByMonth[i].length > 0) {
                const byYear = {};
                expensesByMonth[i].forEach(item => {
                    const y = item.year || new Date().getFullYear();
                    if (!byYear[y]) byYear[y] = [];
                    byYear[y].push(item);
                });
                Object.entries(byYear).forEach(([year, items]) => {
                    expensesAPI.push({ month: i, year: parseInt(year), items });
                });
            }
        }

        await fetch(`${API_URL_MANUT}/api/sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, expenses: expensesAPI })
        });

        showToast('Despesa lançada automaticamente!', 'success');
    } catch (err) {
        console.error('Erro ao lançar despesa:', err);
    }
}

// ===== DELETE MANUTENÇÃO =====
async function deleteManut(id) {
    if (!confirm('Deseja excluir esta manutenção?')) return;
    maintenances = maintenances.filter(m => m.id !== id);
    await saveMaintenances();
    updateDashboard();
    renderAlerts();
    renderCalendar();
    renderTable();
    populateFilterOptions();
    showToast('Manutenção excluída.', 'success');
}

// ===== VIEW MODAL =====
function openViewModal(id) {
    const m = maintenances.find(x => x.id === id);
    if (!m) return;
    viewingId = id;

    const s = getEffectiveStatus(m);

    let filesHtml = '';
    if (m.files && m.files.length > 0) {
        filesHtml = '<div class="photo-list">' + m.files.map(f => {
            const isImage = /\.(jpg|jpeg|png|gif|webp)/i.test(f.url);
            if (isImage) {
                return `<div class="photo-item"><img src="${f.url}" alt="${f.name}" onclick="window.open('${f.url}','_blank')" title="${f.name}"></div>`;
            } else {
                return `<div class="photo-item"><a href="${f.url}" target="_blank"><i class="fas fa-file-pdf"></i> ${f.name}</a></div>`;
            }
        }).join('') + '</div>';
    } else {
        filesHtml = '<span style="color:#999;font-size:13px;">Nenhum arquivo</span>';
    }

    document.getElementById('viewContent').innerHTML = `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px 20px;">
            <div><strong style="color:#7f8c8d;font-size:12px;">TIPO</strong><br>${m.type}</div>
            <div><strong style="color:#7f8c8d;font-size:12px;">ÁREA/CÔMODO</strong><br>${m.area}</div>
            <div><strong style="color:#7f8c8d;font-size:12px;">FORNECEDOR</strong><br>${m.supplier || '-'}</div>
            <div><strong style="color:#7f8c8d;font-size:12px;">STATUS</strong><br><span class="status-badge ${s}">${statusLabel(s)}</span></div>
            <div><strong style="color:#7f8c8d;font-size:12px;">DATA DE EXECUÇÃO</strong><br>${formatDate(m.date)}</div>
            <div><strong style="color:#7f8c8d;font-size:12px;">PRÓXIMA PREVISÃO</strong><br>${formatDate(m.nextDate) || '-'}</div>
            <div><strong style="color:#7f8c8d;font-size:12px;">CUSTO</strong><br>${m.cost ? 'R$ ' + parseFloat(m.cost).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '-'}</div>
            <div><strong style="color:#7f8c8d;font-size:12px;">RECORRENTE</strong><br>${m.recurring === 'sim' ? 'Sim (' + periodLabel(m.period) + ')' : 'Não'}</div>
            ${m.desc ? `<div style="grid-column:1/-1;"><strong style="color:#7f8c8d;font-size:12px;">DESCRIÇÃO</strong><br>${m.desc}</div>` : ''}
            <div style="grid-column:1/-1;"><strong style="color:#7f8c8d;font-size:12px;">FOTOS / DOCUMENTOS</strong><br>${filesHtml}</div>
        </div>
    `;
    document.getElementById('viewModal').classList.add('active');
}

function closeViewModal() {
    document.getElementById('viewModal').classList.remove('active');
    viewingId = null;
}

function editFromView() {
    const id = viewingId;
    closeViewModal();
    if (id) openEditModal(id);
}

// ===== TIPOS DE MANUTENÇÃO — CRUD =====
function renderTypesList() {
    const tbody = document.getElementById('typesTableBody');
    if (!tbody) return;

    const sorted = [...maintenanceTypes].sort((a, b) => a.localeCompare(b));

    if (sorted.length === 0) {
        tbody.innerHTML = `<tr><td colspan="2" class="no-data" style="padding:20px;text-align:center;color:#999;">Nenhum tipo cadastrado.</td></tr>`;
        return;
    }

    tbody.innerHTML = sorted.map(t => `
        <tr>
            <td>${t}</td>
            <td style="white-space:nowrap;">
                <button class="action-btn edit" onclick="editType('${escapeAttr(t)}')" title="Renomear"><i class="fas fa-edit"></i></button>
                <button class="action-btn delete" onclick="deleteType('${escapeAttr(t)}')" title="Excluir"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');

    // Atualiza datalist do formulário
    document.getElementById('typesList').innerHTML = sorted.map(t => `<option value="${t}">`).join('');
}

function addType() {
    const input = document.getElementById('newTypeName');
    const name = input.value.trim();
    if (!name) { showToast('Digite o nome do tipo.', 'warning'); return; }

    if (maintenanceTypes.map(t => t.toLowerCase()).includes(name.toLowerCase())) {
        showToast('Este tipo já existe.', 'warning');
        return;
    }

    maintenanceTypes.push(name);
    input.value = '';
    saveTypes().then(ok => {
        if (ok) {
            showToast('Tipo adicionado!', 'success');
            renderTypesList();
            populateFilterOptions();
        } else {
            showToast('Erro ao salvar.', 'error');
        }
    });
}

function editType(oldName) {
    const newName = prompt('Renomear tipo:', oldName);
    if (!newName || newName.trim() === oldName) return;
    const trimmed = newName.trim();

    if (maintenanceTypes.map(t => t.toLowerCase()).includes(trimmed.toLowerCase())) {
        showToast('Este tipo já existe.', 'warning');
        return;
    }

    // Renomear em todas as manutenções
    maintenances.forEach(m => { if (m.type === oldName) m.type = trimmed; });
    const idx = maintenanceTypes.indexOf(oldName);
    if (idx !== -1) maintenanceTypes[idx] = trimmed;

    Promise.all([saveTypes(), saveMaintenances()]).then(() => {
        showToast('Tipo renomeado!', 'success');
        renderTypesList();
        renderTable();
        populateFilterOptions();
    });
}

function deleteType(name) {
    const inUse = maintenances.some(m => m.type === name);
    const msg = inUse
        ? `O tipo "${name}" está em uso em ${maintenances.filter(m => m.type === name).length} manutenção(ões). Deseja excluir mesmo assim?`
        : `Excluir o tipo "${name}"?`;

    if (!confirm(msg)) return;

    maintenanceTypes = maintenanceTypes.filter(t => t !== name);
    saveTypes().then(ok => {
        if (ok) {
            showToast('Tipo excluído.', 'success');
            renderTypesList();
            populateFilterOptions();
        } else {
            showToast('Erro ao salvar.', 'error');
        }
    });
}

function escapeAttr(str) {
    return str.replace(/'/g, "\\'");
}

// ===== ÁREAS/CÔMODOS — CRUD =====
function renderAreasList() {
    const tbody = document.getElementById('areasTableBody');
    if (!tbody) return;

    const sorted = [...maintenanceAreas].sort((a, b) => a.localeCompare(b));

    if (sorted.length === 0) {
        tbody.innerHTML = `<tr><td colspan="2" class="no-data" style="padding:20px;text-align:center;color:#999;">Nenhuma área cadastrada.</td></tr>`;
        return;
    }

    tbody.innerHTML = sorted.map(a => `
        <tr>
            <td>${a}</td>
            <td style="white-space:nowrap;">
                <button class="action-btn edit" onclick="editArea('${escapeAttr(a)}')" title="Renomear"><i class="fas fa-edit"></i></button>
                <button class="action-btn delete" onclick="deleteArea('${escapeAttr(a)}')" title="Excluir"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');

    // Atualiza datalist do formulário
    document.getElementById('areasList').innerHTML = sorted.map(a => `<option value="${a}">`).join('');
}

function addArea() {
    const input = document.getElementById('newAreaName');
    const name = input.value.trim();
    if (!name) { showToast('Digite o nome da área.', 'warning'); return; }

    if (maintenanceAreas.map(a => a.toLowerCase()).includes(name.toLowerCase())) {
        showToast('Esta área já existe.', 'warning');
        return;
    }

    maintenanceAreas.push(name);
    input.value = '';
    saveAreas().then(ok => {
        if (ok) {
            showToast('Área adicionada!', 'success');
            renderAreasList();
            populateFilterOptions();
        } else {
            showToast('Erro ao salvar.', 'error');
        }
    });
}

function editArea(oldName) {
    const newName = prompt('Renomear área:', oldName);
    if (!newName || newName.trim() === oldName) return;
    const trimmed = newName.trim();

    if (maintenanceAreas.map(a => a.toLowerCase()).includes(trimmed.toLowerCase())) {
        showToast('Esta área já existe.', 'warning');
        return;
    }

    // Renomear em todas as manutenções
    maintenances.forEach(m => { if (m.area === oldName) m.area = trimmed; });
    const idx = maintenanceAreas.indexOf(oldName);
    if (idx !== -1) maintenanceAreas[idx] = trimmed;

    Promise.all([saveAreas(), saveMaintenances()]).then(() => {
        showToast('Área renomeada!', 'success');
        renderAreasList();
        renderTable();
        populateFilterOptions();
    });
}

function deleteArea(name) {
    const inUse = maintenances.some(m => m.area === name);
    const msg = inUse
        ? `A área "${name}" está em uso em ${maintenances.filter(m => m.area === name).length} manutenção(ões). Deseja excluir mesmo assim?`
        : `Excluir a área "${name}"?`;

    if (!confirm(msg)) return;

    maintenanceAreas = maintenanceAreas.filter(a => a !== name);
    saveAreas().then(ok => {
        if (ok) {
            showToast('Área excluída.', 'success');
            renderAreasList();
            populateFilterOptions();
        } else {
            showToast('Erro ao salvar.', 'error');
        }
    });
}

// ===== HELPERS =====
function generateId() {
    return 'manut_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
}

function periodLabel(p) {
    const map = { '30': 'Mensal', '60': 'Bimestral', '90': 'Trimestral', '180': 'Semestral', '365': 'Anual' };
    return map[p] || p + ' dias';
}

function showToast(msg, type = 'success') {
    const el = document.getElementById('toastEl');
    el.textContent = msg;
    el.className = `toast show ${type}`;
    setTimeout(() => { el.className = 'toast'; }, 3500);
}
