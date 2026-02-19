// Financial Control System - Main JavaScript

// Data Structure
const financialData = {
    months: [
        'JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL',
        'MAIO', 'JUNHO', 'JULHO', 'AGOSTO',
        'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'
    ],
    currentMonth: 0,
    expenses: {},
    income: {},
    notes: {},
    categories: [
        'Alimentação', 'Carro', 'Transporte', 'Manutenção',
        'Farmácia', 'Outros', 'Pets', 'Hotel', 'Escritório', 'Fornecedor'
    ],
    suppliers: [
        'Amoedo', 'Carrefour', 'Detail Wash', 'Droga Raia', 'Hortfruti',
        'Kalunga', 'Lave Bem', 'Outros', 'Pacheco', 'PetChic', 'Posto hum',
        'Prezunic', 'RM água', 'Venancio', 'Zona Sul'
    ],
    paymentMethods: [
        'Cartão de Crédito', 'Reembolso', 'Conta Corrente', 'Outros'
    ],
    years: [2024, 2025, 2026],
    users: [
        {
            username: 'admin',
            password: 'admin', // Em produção, use hash
            name: 'Administrador',
            role: 'admin' // admin ou normal
        }
    ],
    currentUser: null
};

// Initialize data structure for each month
financialData.months.forEach((_, index) => {
    financialData.expenses[index] = [];
    financialData.income[index] = [];
    financialData.notes[index] = '';
});

// Charts
let categoryChart = null;
let monthlyChart = null;

// Receipt files storage
let currentReceiptFiles = [];
let cropperInstance = null;
let currentCropperFileIndex = null;
let isEditingExistingReceipt = false;

// Initialize Application (ASYNC para carregar da nuvem)
document.addEventListener('DOMContentLoaded', function() {
    // Apenas setup de event listeners
    // Dados serão carregados no login
    setupEventListeners();
    console.log('✅ Event listeners configurados');
});

async function initializeApp() {
    try {
        console.log('🚀 Inicializando aplicação...');

        // Aguardar carregamento dos dados da nuvem
        await loadFromLocalStorage();

        // Atualizar UI de permissões após carregar dados
        if (typeof updateUIForUserRole === 'function') {
            updateUIForUserRole();
            console.log('✅ Permissões de usuário atualizadas');
        }

        setupEventListeners();
        populateSelects();
        renderCurrentMonth();
        initializeCharts();

        console.log('✅ App inicializado com sucesso!');
    } catch (error) {
        console.error('❌ Erro ao inicializar:', error);
        showToast('Erro ao carregar dados', 'error');
    }
}

// Event Listeners
function setupEventListeners() {
    // Helper para anexar listener com segurança (evita crash se elemento não existe)
    function on(id, event, fn) {
        const el = document.getElementById(id);
        if (el) el.addEventListener(event, fn);
    }

    // Add Expense Button
    on('addExpenseBtn', 'click', () => { console.log('Add expense button clicked'); openExpenseModal(); });

    // Add Income Button
    on('addIncomeBtn', 'click', () => openIncomeModal());

    // Save Notes Button
    on('saveNotesBtn', 'click', saveNotes);

    // Expense Form
    on('expenseForm', 'submit', handleExpenseSubmit);

    // Income Form
    on('incomeForm', 'submit', handleIncomeSubmit);

    // Modal Close Buttons
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', closeModals);
    });

    on('cancelExpense', 'click', closeModals);
    on('cancelIncome', 'click', closeModals);

    // Click outside modal to close
    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            closeModals();
        }
    });

    // Filters
    on('searchExpense', 'input', filterExpenses);
    on('filterCategory', 'change', filterExpenses);
    on('filterSupplier', 'change', filterExpenses);

    // Month and Year filters
    on('filterMonth', 'change', filterExpenses);
    on('filterYear', 'change', filterExpenses);

    // Receipt Upload
    on('expenseReceipt', 'change', handleReceiptUpload);
    on('captureReceiptBtn', 'click', captureReceipt);
}

// Populate Select Dropdowns
function populateSelects() {
    // Categories
    const categorySelects = ['expenseCategory', 'filterCategory'];
    categorySelects.forEach(selectId => {
        const select = document.getElementById(selectId);
        const currentValue = select.value;

        // Clear existing options except first (placeholder)
        while (select.options.length > 1) {
            select.remove(1);
        }

        financialData.categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            select.appendChild(option);
        });

        // Restore value if still exists
        if (currentValue && financialData.categories.includes(currentValue)) {
            select.value = currentValue;
        }
    });

    // Suppliers
    const supplierSelects = ['expenseSupplier', 'filterSupplier'];
    supplierSelects.forEach(selectId => {
        const select = document.getElementById(selectId);
        const currentValue = select.value;

        // Clear existing options except first (placeholder)
        while (select.options.length > 1) {
            select.remove(1);
        }

        financialData.suppliers.forEach(supplier => {
            const option = document.createElement('option');
            option.value = supplier;
            option.textContent = supplier;
            select.appendChild(option);
        });

        // Restore value if still exists
        if (currentValue && financialData.suppliers.includes(currentValue)) {
            select.value = currentValue;
        }
    });

    // Years filter
    const yearFilter = document.getElementById('filterYear');
    if (yearFilter && financialData.years) {
        const currentValue = yearFilter.value;

        // Clear existing options except first (placeholder)
        while (yearFilter.options.length > 1) {
            yearFilter.remove(1);
        }

        // Sort years and add as options
        financialData.years.sort((a, b) => a - b).forEach(year => {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            yearFilter.appendChild(option);
        });

        // Restore value if still exists
        if (currentValue && financialData.years.includes(parseInt(currentValue))) {
            yearFilter.value = currentValue;
        }
    }
}

// Render Current Month Data
function renderCurrentMonth() {
    // Render expenses
    renderExpenses();

    // Render income
    renderIncome();

    // Update summary
    updateSummary();

    // Update category summary
    updateCategorySummary();

    // Update charts
    updateCharts();
}

// Render Expenses Table
function renderExpenses() {
    console.log('=== RENDERIZANDO DESPESAS ===');
    console.log('financialData.expenses:', financialData.expenses);

    // Collect all expenses from all months
    let allExpenses = [];
    Object.keys(financialData.expenses).forEach(monthIndex => {
        const monthExpenses = financialData.expenses[monthIndex] || [];
        console.log(`Mês ${monthIndex}:`, monthExpenses.length, 'despesas');
        monthExpenses.forEach(expense => {
            allExpenses.push({
                ...expense,
                monthIndex: monthIndex,
                monthName: financialData.months[monthIndex]
            });
        });
    });

    console.log('Total de despesas encontradas:', allExpenses.length);

    const tbody = document.getElementById('expensesBody');

    if (allExpenses.length === 0) {
        console.log('Nenhuma despesa para exibir');
        tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 40px; color: #64748b;">Nenhuma despesa cadastrada</td></tr>';
        return;
    }

    // Sort expenses by date in descending order (most recent first)
    allExpenses = [...allExpenses].sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateB - dateA;
    });

    tbody.innerHTML = allExpenses.map((expense) => {
        const originalIndex = financialData.expenses[expense.monthIndex].indexOf(financialData.expenses[expense.monthIndex].find(e =>
            e.date === expense.date &&
            e.description === expense.description &&
            e.amount === expense.amount
        ));
        return `
        <tr>
            <td>${formatDate(expense.date)}</td>
            <td>${expense.description}</td>
            <td><span style="padding: 4px 12px; background: #e0e7ff; color: #4338ca; border-radius: 12px; font-size: 12px; font-weight: 600;">${expense.category}</span></td>
            <td>${expense.supplier}</td>
            <td>R$ ${parseFloat(expense.amount).toFixed(2)}</td>
            <td><span style="padding: 4px 10px; background: #fef3c7; color: #92400e; border-radius: 8px; font-size: 11px; font-weight: 600;">${expense.paymentMethod || 'N/A'}</span></td>
            <td>${expense.dueDate ? formatDate(expense.dueDate) : '-'}</td>
            <td style="text-align: center;">
                ${expense.receiptPDF ? `<i class="fas fa-file-pdf attachment-icon" onclick="viewReceipt(${expense.monthIndex}, ${originalIndex})" title="Ver nota fiscal"></i>` : '<i class="fas fa-minus no-attachment"></i>'}
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn-edit" onclick="editExpense(${expense.monthIndex}, ${originalIndex})"><i class="fas fa-edit"></i></button>
                    <button class="btn-delete" onclick="deleteExpense(${expense.monthIndex}, ${originalIndex})"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        </tr>
        `;
    }).join('');
}

// Render Income Table
function renderIncome() {
    // Collect all income from all months
    let allIncome = [];
    Object.keys(financialData.income).forEach(monthIndex => {
        const monthIncome = financialData.income[monthIndex] || [];
        monthIncome.forEach((item, index) => {
            allIncome.push({
                ...item,
                monthIndex: monthIndex,
                monthName: financialData.months[monthIndex],
                originalIndex: index
            });
        });
    });

    const tbody = document.getElementById('incomeBody');

    if (allIncome.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 40px; color: #64748b;">Nenhuma entrada cadastrada</td></tr>';
        return;
    }

    // Sort by date descending
    allIncome.sort((a, b) => new Date(b.date) - new Date(a.date));

    tbody.innerHTML = allIncome.map((item) => `
        <tr>
            <td>${formatDate(item.date)}</td>
            <td>${item.description}</td>
            <td style="color: #10b981; font-weight: 700;">R$ ${parseFloat(item.amount).toFixed(2)}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-edit" onclick="editIncome(${item.monthIndex}, ${item.originalIndex})"><i class="fas fa-edit"></i></button>
                    <button class="btn-delete" onclick="deleteIncome(${item.monthIndex}, ${item.originalIndex})"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Update Summary Cards
function updateSummary() {
    // Calculate totals for all months
    let totalExpense = 0;
    let totalIncome = 0;

    Object.keys(financialData.expenses).forEach(monthIndex => {
        const expenses = financialData.expenses[monthIndex] || [];
        totalExpense += expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
    });

    Object.keys(financialData.income).forEach(monthIndex => {
        const income = financialData.income[monthIndex] || [];
        totalIncome += income.reduce((sum, inc) => sum + parseFloat(inc.amount), 0);
    });

    const balance = totalIncome - totalExpense;

    document.getElementById('totalExpense').textContent = `R$ ${totalExpense.toFixed(2)}`;
    document.getElementById('totalIncome').textContent = `R$ ${totalIncome.toFixed(2)}`;
    document.getElementById('balance').textContent = `R$ ${balance.toFixed(2)}`;

    // Color balance based on positive/negative
    const balanceElement = document.getElementById('balance');
    balanceElement.style.color = balance >= 0 ? '#10b981' : '#ef4444';
}

// Update Category Summary
function updateCategorySummary() {
    // Collect all expenses from all months
    let allExpenses = [];
    Object.keys(financialData.expenses).forEach(monthIndex => {
        const monthExpenses = financialData.expenses[monthIndex] || [];
        allExpenses = allExpenses.concat(monthExpenses);
    });

    const container = document.getElementById('categorySummary');

    // Calculate totals by category
    const categoryTotals = {};
    allExpenses.forEach(expense => {
        const category = expense.category;
        if (!categoryTotals[category]) {
            categoryTotals[category] = 0;
        }
        categoryTotals[category] += parseFloat(expense.amount);
    });

    // Sort by amount descending
    const sortedCategories = Object.entries(categoryTotals)
        .sort((a, b) => b[1] - a[1]);

    if (sortedCategories.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #64748b; padding: 20px;">Nenhuma despesa por categoria</p>';
        return;
    }

    container.innerHTML = sortedCategories.map(([category, total]) => `
        <div class="category-item">
            <span><i class="fas fa-tag" style="margin-right: 8px; color: #4f46e5;"></i>${category}</span>
            <span>R$ ${total.toFixed(2)}</span>
        </div>
    `).join('');
}

// Filter Expenses
function filterExpenses() {
    const searchTerm = document.getElementById('searchExpense').value.toLowerCase();
    const categoryFilter = document.getElementById('filterCategory').value;
    const supplierFilter = document.getElementById('filterSupplier').value;
    const monthFilter = document.getElementById('filterMonth')?.value || '';
    const yearFilter = document.getElementById('filterYear')?.value || '';

    const month = financialData.currentMonth;
    const expenses = financialData.expenses[month] || [];

    let filtered = expenses.filter(expense => {
        const matchesSearch = expense.description.toLowerCase().includes(searchTerm);
        const matchesCategory = !categoryFilter || expense.category === categoryFilter;
        const matchesSupplier = !supplierFilter || expense.supplier === supplierFilter;

        // Month and Year filters
        let matchesMonth = true;
        let matchesYear = true;

        if (monthFilter || yearFilter) {
            const expenseDate = new Date(expense.date);
            if (monthFilter) {
                matchesMonth = (expenseDate.getMonth() + 1) === parseInt(monthFilter);
            }
            if (yearFilter) {
                matchesYear = expenseDate.getFullYear() === parseInt(yearFilter);
            }
        }

        return matchesSearch && matchesCategory && matchesSupplier && matchesMonth && matchesYear;
    });

    // Sort by date ascending
    filtered = filtered.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateA - dateB;
    });

    // Render filtered results
    const tbody = document.getElementById('expensesBody');
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 40px; color: #64748b;">Nenhuma despesa encontrada com os filtros aplicados</td></tr>';
        updateChartsWithFilteredData([]);
        updateCategorySummaryWithFilteredData([]);
        return;
    }

    tbody.innerHTML = filtered.map((expense) => {
        const originalIndex = expenses.indexOf(expense);
        return `
            <tr>
                <td>${formatDate(expense.date)}</td>
                <td>${expense.description}</td>
                <td><span style="padding: 4px 12px; background: #e0e7ff; color: #4338ca; border-radius: 12px; font-size: 12px; font-weight: 600;">${expense.category}</span></td>
                <td>${expense.supplier}</td>
                <td>R$ ${parseFloat(expense.amount).toFixed(2)}</td>
                <td><span style="padding: 4px 10px; background: #fef3c7; color: #92400e; border-radius: 8px; font-size: 11px; font-weight: 600;">${expense.paymentMethod || 'N/A'}</span></td>
                <td>${expense.dueDate ? formatDate(expense.dueDate) : '-'}</td>
                <td style="text-align: center;">
                    ${expense.receiptPDF ? `<i class="fas fa-file-pdf attachment-icon" onclick="viewReceipt(${originalIndex})" title="Ver nota fiscal"></i>` : '<i class="fas fa-minus no-attachment"></i>'}
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-edit" onclick="editExpense(${originalIndex})"><i class="fas fa-edit"></i></button>
                        <button class="btn-delete" onclick="deleteExpense(${originalIndex})"><i class="fas fa-trash"></i></button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    // Update charts and summary with filtered data
    updateChartsWithFilteredData(filtered);
    updateCategorySummaryWithFilteredData(filtered);
}

// Modal Functions
function openExpenseModal(expense = null, monthIndex = null, index = null) {
    if (!checkAdminPermission()) return;

    console.log('openExpenseModal called', {expense, monthIndex, index});
    const modal = document.getElementById('expenseModal');
    const form = document.getElementById('expenseForm');
    const title = document.getElementById('expenseModalTitle');

    if (!modal) {
        console.error('Modal not found');
        return;
    }

    form.reset();
    currentReceiptFiles = [];
    document.getElementById('receiptPreview').innerHTML = '';

    if (expense) {
        title.innerHTML = '<i class="fas fa-edit"></i> Editar Despesa';
        document.getElementById('expenseDate').value = expense.date;
        document.getElementById('expenseDescription').value = expense.description;
        document.getElementById('expenseCategory').value = expense.category;
        document.getElementById('expenseSupplier').value = expense.supplier;
        document.getElementById('expenseAmount').value = expense.amount;
        document.getElementById('expensePaymentMethod').value = expense.paymentMethod || '';
        document.getElementById('expenseDueDate').value = expense.dueDate || '';
        form.dataset.editIndex = index;
        form.dataset.editMonthIndex = monthIndex;

        // Show existing receipt if available
        if (expense.receiptPDF) {
            const preview = document.getElementById('receiptPreview');
            preview.innerHTML = `
                <div class="receipt-preview-item">
                    <div class="pdf-icon"><i class="fas fa-file-pdf"></i></div>
                    <button type="button" class="remove-receipt" onclick="removeExistingReceipt()">×</button>
                </div>
            `;
        }
    } else {
        title.innerHTML = '<i class="fas fa-receipt"></i> Nova Despesa';
        delete form.dataset.editIndex;
        // Set today's date as default
        document.getElementById('expenseDate').value = new Date().toISOString().split('T')[0];
    }

    modal.style.display = 'block';
}

function removeExistingReceipt() {
    currentReceiptFiles = [];
    document.getElementById('receiptPreview').innerHTML = '';
    // Mark for removal
    document.getElementById('expenseForm').dataset.removeReceipt = 'true';
}

function openIncomeModal(income = null, monthIndex = null, index = null) {
    if (!checkAdminPermission()) return;

    const modal = document.getElementById('incomeModal');
    const form = document.getElementById('incomeForm');
    const title = document.getElementById('incomeModalTitle');

    form.reset();

    if (income) {
        title.innerHTML = '<i class="fas fa-edit"></i> Editar Entrada';
        document.getElementById('incomeDate').value = income.date;
        document.getElementById('incomeDescription').value = income.description;
        document.getElementById('incomeAmount').value = income.amount;
        form.dataset.editIndex = index;
        form.dataset.editMonthIndex = monthIndex;
    } else {
        title.innerHTML = '<i class="fas fa-hand-holding-usd"></i> Nova Entrada';
        delete form.dataset.editIndex;
        // Set today's date as default
        document.getElementById('incomeDate').value = new Date().toISOString().split('T')[0];
    }

    modal.style.display = 'block';
}

function closeModals() {
    document.getElementById('expenseModal').style.display = 'none';
    document.getElementById('incomeModal').style.display = 'none';
}

// Handle Form Submissions
async function handleExpenseSubmit(e) {
    e.preventDefault();

    const form = e.target;
    const isEditing = form.dataset.editIndex !== undefined;

    // Convert receipt files to PDF
    let receiptPDF = null;
    if (currentReceiptFiles.length > 0) {
        showToast('Processando nota fiscal...', 'success');
        receiptPDF = await convertFilesToPDF();
    }

    const expense = {
        date: document.getElementById('expenseDate').value,
        description: document.getElementById('expenseDescription').value,
        category: document.getElementById('expenseCategory').value,
        supplier: document.getElementById('expenseSupplier').value,
        amount: document.getElementById('expenseAmount').value,
        paymentMethod: document.getElementById('expensePaymentMethod').value,
        dueDate: document.getElementById('expenseDueDate').value
    };

    // Determine month from expense date
    const expenseDate = new Date(expense.date);
    const month = expenseDate.getMonth();

    console.log('=== SALVANDO DESPESA ===');
    console.log('Data:', expense.date);
    console.log('Mês calculado:', month);
    console.log('Descrição:', expense.description);
    console.log('Valor:', expense.amount);

    // Ensure month array exists
    if (!financialData.expenses[month]) {
        console.log('Criando array para mês', month);
        financialData.expenses[month] = [];
    }

    console.log('Despesas no mês antes:', financialData.expenses[month].length);

    // Add or preserve receipt PDF
    if (isEditing) {
        const index = parseInt(form.dataset.editIndex);
        const editMonthIndex = parseInt(form.dataset.editMonthIndex);
        const existingExpense = financialData.expenses[editMonthIndex][index];

        // Handle receipt
        if (form.dataset.removeReceipt === 'true') {
            expense.receiptPDF = null;
        } else if (receiptPDF) {
            expense.receiptPDF = receiptPDF;
        } else if (existingExpense.receiptPDF) {
            expense.receiptPDF = existingExpense.receiptPDF;
        }

        // If month changed, move expense to new month
        if (editMonthIndex != month) {
            financialData.expenses[editMonthIndex].splice(index, 1);
            financialData.expenses[month].push(expense);
        } else {
            financialData.expenses[month][index] = expense;
        }

        showToast('Despesa atualizada com sucesso!', 'success');
        delete form.dataset.editIndex;
        delete form.dataset.editMonthIndex;
    } else {
        if (receiptPDF) {
            expense.receiptPDF = receiptPDF;
        }
        financialData.expenses[month].push(expense);
        console.log('Despesa adicionada! Total no mês agora:', financialData.expenses[month].length);
        console.log('Todas as despesas do sistema:', financialData.expenses);
        showToast('Despesa adicionada com sucesso!', 'success');
    }

    // Clean up
    delete form.dataset.removeReceipt;
    currentReceiptFiles = [];

    console.log('Salvando no localStorage...');
    saveToLocalStorage();

    console.log('Renderizando tela...');
    renderCurrentMonth();
    console.log('=== FIM SALVAMENTO ===');

    // If editing, close modal. If adding new, reset form for next entry
    if (isEditing) {
        console.log('Editing mode: closing modal');
        closeModals();
    } else {
        console.log('New expense mode: keeping modal open and resetting form');
        // Reset form for next expense
        form.reset();
        document.getElementById('receiptPreview').innerHTML = '';
        currentReceiptFiles = [];
        // Set today's date as default
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('expenseDate').value = today;
        console.log('Form reset, date set to:', today);
        // Focus on description field for quick entry
        setTimeout(() => {
            const descField = document.getElementById('expenseDescription');
            if (descField) {
                descField.focus();
                console.log('Description field focused');
            }
        }, 100);
    }
}

function handleIncomeSubmit(e) {
    e.preventDefault();

    const form = e.target;

    const income = {
        date: document.getElementById('incomeDate').value,
        description: document.getElementById('incomeDescription').value,
        amount: document.getElementById('incomeAmount').value
    };

    // Determine month from income date
    const incomeDate = new Date(income.date);
    const month = incomeDate.getMonth();

    // Ensure month array exists
    if (!financialData.income[month]) {
        financialData.income[month] = [];
    }

    if (form.dataset.editIndex !== undefined) {
        // Edit existing income
        const index = parseInt(form.dataset.editIndex);
        const editMonthIndex = parseInt(form.dataset.editMonthIndex);

        // If month changed, move income to new month
        if (editMonthIndex != month) {
            financialData.income[editMonthIndex].splice(index, 1);
            financialData.income[month].push(income);
        } else {
            financialData.income[month][index] = income;
        }

        showToast('Entrada atualizada com sucesso!', 'success');
        delete form.dataset.editIndex;
        delete form.dataset.editMonthIndex;
    } else {
        // Add new income
        financialData.income[month].push(income);
        showToast('Entrada adicionada com sucesso!', 'success');
    }

    saveToLocalStorage();
    renderCurrentMonth();
    closeModals();
}

// Edit Functions
function editExpense(monthIndex, index) {
    if (!checkAdminPermission()) return;
    const expense = financialData.expenses[monthIndex][index];
    openExpenseModal(expense, monthIndex, index);
}

function editIncome(monthIndex, index) {
    if (!checkAdminPermission()) return;
    const income = financialData.income[monthIndex][index];
    openIncomeModal(income, monthIndex, index);
}

// Delete Functions
function deleteExpense(monthIndex, index) {
    if (!checkAdminPermission()) return;
    if (confirm('Tem certeza que deseja excluir esta despesa?')) {
        financialData.expenses[monthIndex].splice(index, 1);
        saveToLocalStorage();
        renderCurrentMonth();
        showToast('Despesa excluída com sucesso!', 'success');
    }
}

function deleteIncome(monthIndex, index) {
    if (!checkAdminPermission()) return;
    if (confirm('Tem certeza que deseja excluir esta entrada?')) {
        financialData.income[monthIndex].splice(index, 1);
        saveToLocalStorage();
        renderCurrentMonth();
        showToast('Entrada excluída com sucesso!', 'success');
    }
}

// Save Notes
function saveNotes() {
    if (!checkAdminPermission()) return;
    const month = financialData.currentMonth;
    const notes = document.getElementById('monthNotes').value;
    financialData.notes[month] = notes;
    saveToLocalStorage();
    showToast('Notas salvas com sucesso!', 'success');
}

// Charts
function initializeCharts() {
    // Category Chart
    const categoryCtx = document.getElementById('categoryChart').getContext('2d');
    categoryChart = new Chart(categoryCtx, {
        type: 'doughnut',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: [
                    '#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ef4444',
                    '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });

    // Monthly Chart
    const monthlyCtx = document.getElementById('monthlyChart').getContext('2d');
    monthlyChart = new Chart(monthlyCtx, {
        type: 'bar',
        data: {
            labels: financialData.months,
            datasets: [
                {
                    label: 'Entradas',
                    data: [],
                    backgroundColor: '#10b981'
                },
                {
                    label: 'Despesas',
                    data: [],
                    backgroundColor: '#ef4444'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    updateCharts();
}

function updateCharts() {
    updateCategoryChart();
    updateMonthlyChart();
}

function updateCategoryChart() {
    if (!categoryChart) return;

    // Collect all expenses from all months
    let allExpenses = [];
    Object.keys(financialData.expenses).forEach(monthIndex => {
        const monthExpenses = financialData.expenses[monthIndex] || [];
        allExpenses = allExpenses.concat(monthExpenses);
    });

    const categoryTotals = {};
    allExpenses.forEach(expense => {
        const category = expense.category;
        if (!categoryTotals[category]) {
            categoryTotals[category] = 0;
        }
        categoryTotals[category] += parseFloat(expense.amount);
    });

    categoryChart.data.labels = Object.keys(categoryTotals);
    categoryChart.data.datasets[0].data = Object.values(categoryTotals);
    categoryChart.update();
}

function updateMonthlyChart() {
    if (!monthlyChart) return;

    const incomeData = [];
    const expenseData = [];

    financialData.months.forEach((_, index) => {
        const monthIncome = financialData.income[index] || [];
        const monthExpenses = financialData.expenses[index] || [];

        const totalIncome = monthIncome.reduce((sum, inc) => sum + parseFloat(inc.amount), 0);
        const totalExpense = monthExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);

        incomeData.push(totalIncome);
        expenseData.push(totalExpense);
    });

    monthlyChart.data.datasets[0].data = incomeData;
    monthlyChart.data.datasets[1].data = expenseData;
    monthlyChart.update();
}

// Update charts with filtered data
function updateChartsWithFilteredData(filteredExpenses) {
    if (!categoryChart) return;

    const categoryTotals = {};
    filteredExpenses.forEach(expense => {
        const category = expense.category;
        if (!categoryTotals[category]) {
            categoryTotals[category] = 0;
        }
        categoryTotals[category] += parseFloat(expense.amount);
    });

    categoryChart.data.labels = Object.keys(categoryTotals);
    categoryChart.data.datasets[0].data = Object.values(categoryTotals);
    categoryChart.update();
}

// Update category summary with filtered data
function updateCategorySummaryWithFilteredData(filteredExpenses) {
    const container = document.getElementById('categorySummary');

    const categoryTotals = {};
    filteredExpenses.forEach(expense => {
        const category = expense.category;
        if (!categoryTotals[category]) {
            categoryTotals[category] = 0;
        }
        categoryTotals[category] += parseFloat(expense.amount);
    });

    const sortedCategories = Object.entries(categoryTotals)
        .sort((a, b) => b[1] - a[1]);

    if (sortedCategories.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #64748b; padding: 20px;">Nenhuma despesa por categoria</p>';
        return;
    }

    container.innerHTML = sortedCategories.map(([category, total]) => `
        <div class="category-item">
            <span><i class="fas fa-tag" style="margin-right: 8px; color: #4f46e5;"></i>${category}</span>
            <span>R$ ${total.toFixed(2)}</span>
        </div>
    `).join('');
}

// Local Storage
// NOVO: Salvar direto na nuvem (sem localStorage)
async function saveToLocalStorage() {
    try {
        console.log('☁️ Salvando dados na nuvem...');

        if (window.CloudStorage) {
            const success = await window.CloudStorage.saveAll(financialData);
            if (success) {
                console.log('✅ Dados salvos na nuvem!');
                showToast('Dados salvos!', 'success');
            } else {
                console.error('❌ Erro ao salvar na nuvem');
                showToast('Erro ao salvar dados', 'error');
            }
        } else {
            console.error('❌ CloudStorage não disponível');
            showToast('Sistema de nuvem não configurado', 'error');
        }
    } catch (e) {
        console.error('❌ Erro ao salvar:', e);
        showToast('Erro ao salvar: ' + e.message, 'error');
    }
}

// NOVO: Carregar direto da nuvem (sem localStorage)
async function loadFromLocalStorage() {
    try {
        console.log('☁️ Carregando dados da nuvem...');

        if (window.CloudStorage) {
            // Preservar currentUser antes de carregar
            const currentUser = financialData.currentUser;

            const loaded = await window.CloudStorage.loadAll();
            if (loaded) {
                // Limpar base64 legado muito grande (novo sistema usa URL do Cloudinary)
                if (loaded.expenses && Array.isArray(loaded.expenses)) {
                    loaded.expenses.forEach(monthExpenses => {
                        if (Array.isArray(monthExpenses)) {
                            monthExpenses.forEach(expense => {
                                if (expense.receiptPDF && typeof expense.receiptPDF === 'string' && expense.receiptPDF.length > 2000000) {
                                    console.warn('⚠️ Base64 legado muito grande removido:', expense.description);
                                    expense.receiptPDF = null;
                                }
                            });
                        }
                    });
                }

                Object.assign(financialData, loaded);

                // Restaurar currentUser após carregar dados
                if (currentUser) {
                    financialData.currentUser = currentUser;
                    console.log('✅ Usuário atual preservado:', currentUser.username);
                }

                console.log('✅ Dados carregados da nuvem!');
            } else {
                console.log('ℹ️ Nenhum dado na nuvem (primeira vez)');

                // Ainda preservar currentUser
                if (currentUser) {
                    financialData.currentUser = currentUser;
                }
            }
        } else {
            console.error('❌ CloudStorage não disponível');
        }
    } catch (e) {
        console.error('❌ Erro ao carregar:', e);
        showToast('Erro ao carregar dados. Tente recarregar a página.', 'error');
    }
}

// Utility Functions
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('pt-BR');
}

// Diagnóstico do LocalStorage (executar no console)
function checkLocalStorageSize() {
    let total = 0;
    for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
            const size = localStorage[key].length;
            total += size;
            console.log(`${key}: ${(size / 1024).toFixed(2)} KB`);
        }
    }
    console.log(`Total: ${(total / 1024).toFixed(2)} KB / ${(total / (1024 * 1024)).toFixed(2)} MB`);
    console.log(`Limite aproximado: 5-10 MB dependendo do navegador`);
    return total;
}

// Limpar localStorage (executar no console se necessário)
function clearFinancialData() {
    if (confirm('ATENÇÃO: Isso vai apagar TODOS os dados financeiros. Deseja continuar?')) {
        localStorage.removeItem('financialData');
        console.log('Dados financeiros removidos. Recarregue a página.');
        showToast('Dados removidos. Recarregue a página.', 'success');
    }
}

// Disponibilizar no console
window.checkLocalStorageSize = checkLocalStorageSize;
window.clearFinancialData = clearFinancialData;

// Expor funções de sync para uso por auth.js e settings.js
window.loadFromLocalStorage = loadFromLocalStorage;
window.saveToLocalStorage = saveToLocalStorage;

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Receipt Upload Functions
function handleReceiptUpload(event) {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    files.forEach(file => {
        if (file.type.startsWith('image/')) {
            // Open cropper for images
            openImageCropper(file);
        } else if (file.type === 'application/pdf') {
            // PDF files go directly without editing
            currentReceiptFiles.push(file);
        }
    });

    displayReceiptPreview();
}

function captureReceipt() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.multiple = false; // Single image for editing

    input.onchange = (e) => {
        handleReceiptUpload(e);
    };

    input.click();
}

function displayReceiptPreview() {
    const preview = document.getElementById('receiptPreview');
    preview.innerHTML = '';

    currentReceiptFiles.forEach((file, index) => {
        const item = document.createElement('div');
        item.className = 'receipt-preview-item';

        if (file.type.startsWith('image/')) {
            const img = document.createElement('img');
            img.src = URL.createObjectURL(file);
            item.appendChild(img);

            // Add edit button for images
            const editBtn = document.createElement('button');
            editBtn.className = 'edit-receipt';
            editBtn.innerHTML = '<i class="fas fa-crop"></i>';
            editBtn.title = 'Editar imagem';
            editBtn.onclick = (e) => {
                e.stopPropagation();
                editReceiptImage(index);
            };
            item.appendChild(editBtn);
        } else {
            const pdfIcon = document.createElement('div');
            pdfIcon.className = 'pdf-icon';
            pdfIcon.innerHTML = '<i class="fas fa-file-pdf"></i>';
            item.appendChild(pdfIcon);
        }

        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-receipt';
        removeBtn.innerHTML = '×';
        removeBtn.onclick = () => removeReceipt(index);
        item.appendChild(removeBtn);

        preview.appendChild(item);
    });
}

function removeReceipt(index) {
    currentReceiptFiles.splice(index, 1);
    displayReceiptPreview();
}

async function convertFilesToPDF() {
    if (currentReceiptFiles.length === 0) return null;

    try {
        const apiUrl = window.APP_CONFIG?.API_URL;
        const userId = window.getUserId ? window.getUserId() : 'geral';
        const file = currentReceiptFiles[0];

        showToast('Enviando anexo...', 'success');

        // Read file as base64
        const base64 = await readFileAsDataURL(file);

        // Upload to Cloudinary via backend
        const response = await fetch(`${apiUrl}/api/upload`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                file: base64,
                filename: file.name,
                userId: userId
            })
        });

        const result = await response.json();

        if (!result.success) {
            showToast('Erro ao enviar anexo: ' + result.error, 'error');
            return null;
        }

        // Return object with URL and publicId for future deletion
        return { url: result.url, publicId: result.publicId };

    } catch (error) {
        console.error('❌ Erro ao enviar anexo:', error);
        showToast('Erro ao enviar anexo. Tente novamente.', 'error');
        return null;
    }
}

function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

function viewReceipt(monthIndex, index) {
    const expense = financialData.expenses[monthIndex][index];

    if (!expense.receiptPDF) return;

    // receiptPDF can be a Cloudinary URL object {url, publicId} or legacy base64 string
    const src = (typeof expense.receiptPDF === 'object' && expense.receiptPDF.url)
        ? expense.receiptPDF.url
        : expense.receiptPDF;

    window.open(src, '_blank');
}

// Image Cropper Functions
function openImageCropper(file, editIndex = null) {
    const modal = document.getElementById('cropperModal');
    const image = document.getElementById('cropperImage');

    // Store the file temporarily
    currentCropperFileIndex = editIndex !== null ? editIndex : file;
    isEditingExistingReceipt = editIndex !== null;

    // Read file and display in cropper
    const reader = new FileReader();
    reader.onload = function(e) {
        image.src = e.target.result;
        modal.style.display = 'block';

        // Destroy previous cropper instance if exists
        if (cropperInstance) {
            cropperInstance.destroy();
        }

        // Initialize Cropper.js
        cropperInstance = new Cropper(image, {
            viewMode: 1,
            dragMode: 'move',
            aspectRatio: NaN, // Free aspect ratio
            autoCropArea: 1,
            restore: false,
            guides: true,
            center: true,
            highlight: true,
            cropBoxMovable: true,
            cropBoxResizable: true,
            toggleDragModeOnDblclick: false,
            responsive: true,
            checkOrientation: true,
            minContainerWidth: 200,
            minContainerHeight: 200,
        });
    };
    reader.readAsDataURL(file);
}

function editReceiptImage(index) {
    const file = currentReceiptFiles[index];
    if (file && file.type.startsWith('image/')) {
        openImageCropper(file, index);
    }
}

function closeCropperModal() {
    const modal = document.getElementById('cropperModal');
    modal.style.display = 'none';

    if (cropperInstance) {
        cropperInstance.destroy();
        cropperInstance = null;
    }

    currentCropperFileIndex = null;
    isEditingExistingReceipt = false;

    // Clear the file input only if not editing
    if (!isEditingExistingReceipt) {
        document.getElementById('expenseReceipt').value = '';
    }
}

function cropperRotateLeft() {
    if (cropperInstance) {
        cropperInstance.rotate(-90);
    }
}

function cropperRotateRight() {
    if (cropperInstance) {
        cropperInstance.rotate(90);
    }
}

function cropperZoomIn() {
    if (cropperInstance) {
        cropperInstance.zoom(0.1);
    }
}

function cropperZoomOut() {
    if (cropperInstance) {
        cropperInstance.zoom(-0.1);
    }
}

function cropperReset() {
    if (cropperInstance) {
        cropperInstance.reset();
    }
}

async function applyCrop() {
    if (!cropperInstance) return;

    try {
        // Get cropped canvas
        const canvas = cropperInstance.getCroppedCanvas({
            maxWidth: 1600,
            maxHeight: 1600,
            fillColor: '#fff',
            imageSmoothingEnabled: true,
            imageSmoothingQuality: 'high',
        });

        // Convert canvas to blob
        canvas.toBlob(async (blob) => {
            if (!blob) {
                showToast('Erro ao processar imagem', 'error');
                return;
            }

            // Create a new file from the cropped image
            let fileName;
            if (isEditingExistingReceipt) {
                // Keep original file name when editing
                const originalFile = currentReceiptFiles[currentCropperFileIndex];
                fileName = originalFile.name;
            } else {
                // Add suffix when adding new
                fileName = currentCropperFileIndex.name.replace(/\.[^.]+$/, '_cropped.jpg');
            }

            const croppedFile = new File([blob], fileName, { type: 'image/jpeg' });

            // Add or replace in receipt files
            if (isEditingExistingReceipt) {
                currentReceiptFiles[currentCropperFileIndex] = croppedFile;
            } else {
                currentReceiptFiles.push(croppedFile);
            }

            // Close modal
            closeCropperModal();

            // Update preview
            displayReceiptPreview();

            showToast('Imagem editada com sucesso!', 'success');
        }, 'image/jpeg', 0.85); // 85% quality
    } catch (error) {
        console.error('❌ Erro ao aplicar recorte:', error);
        showToast('Erro ao processar imagem', 'error');
    }
}
