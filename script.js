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

// Initialize Application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    try {
        loadFromLocalStorage();
        setupEventListeners();
        populateSelects();
        renderCurrentMonth();
        initializeCharts();
        console.log('App initialized successfully');
    } catch (error) {
        console.error('Error initializing app:', error);
    }
}

// Event Listeners
function setupEventListeners() {
    // Add Expense Button
    const addExpenseBtn = document.getElementById('addExpenseBtn');
    if (addExpenseBtn) {
        addExpenseBtn.addEventListener('click', () => {
            console.log('Add expense button clicked');
            openExpenseModal();
        });
        console.log('Add expense button listener attached');
    } else {
        console.error('Add expense button not found');
    }

    // Add Income Button
    document.getElementById('addIncomeBtn').addEventListener('click', () => openIncomeModal());

    // Export Button
    document.getElementById('exportBtn').addEventListener('click', exportData);

    // Save Notes Button
    document.getElementById('saveNotesBtn').addEventListener('click', saveNotes);

    // Expense Form
    document.getElementById('expenseForm').addEventListener('submit', handleExpenseSubmit);

    // Income Form
    document.getElementById('incomeForm').addEventListener('submit', handleIncomeSubmit);

    // Modal Close Buttons
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', closeModals);
    });

    document.getElementById('cancelExpense').addEventListener('click', closeModals);
    document.getElementById('cancelIncome').addEventListener('click', closeModals);

    // Click outside modal to close
    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            closeModals();
        }
    });

    // Filters
    document.getElementById('searchExpense').addEventListener('input', filterExpenses);
    document.getElementById('filterCategory').addEventListener('change', filterExpenses);
    document.getElementById('filterSupplier').addEventListener('change', filterExpenses);

    // Month and Year filters (if they exist)
    const filterMonth = document.getElementById('filterMonth');
    const filterYear = document.getElementById('filterYear');
    if (filterMonth) filterMonth.addEventListener('change', filterExpenses);
    if (filterYear) filterYear.addEventListener('change', filterExpenses);

    // Receipt Upload
    document.getElementById('expenseReceipt').addEventListener('change', handleReceiptUpload);
    document.getElementById('captureReceiptBtn').addEventListener('click', captureReceipt);
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

// Export Data
function exportData() {
    const dataStr = JSON.stringify(financialData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `controle-financeiro-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    showToast('Dados exportados com sucesso!', 'success');
}

// Local Storage
function saveToLocalStorage() {
    try {
        const dataToSave = JSON.stringify(financialData);
        const sizeInMB = (dataToSave.length / (1024 * 1024)).toFixed(2);
        console.log(`Tamanho dos dados: ${sizeInMB} MB`);

        localStorage.setItem('financialData', dataToSave);
        console.log('Dados salvos com sucesso no localStorage');
    } catch (e) {
        if (e.name === 'QuotaExceededError') {
            console.error('ERRO: LocalStorage cheio!');

            // Tentar remover PDFs das despesas para economizar espaço
            const dataCopy = JSON.parse(JSON.stringify(financialData));
            let removedPDFs = 0;

            Object.keys(dataCopy.expenses).forEach(monthIndex => {
                const expenses = dataCopy.expenses[monthIndex] || [];
                expenses.forEach(expense => {
                    if (expense.receiptPDF) {
                        delete expense.receiptPDF;
                        removedPDFs++;
                    }
                });
            });

            if (removedPDFs > 0) {
                console.log(`Removendo ${removedPDFs} PDFs para liberar espaço...`);

                try {
                    localStorage.setItem('financialData', JSON.stringify(dataCopy));
                    Object.assign(financialData, dataCopy);

                    showToast('Aviso: PDFs foram removidos para liberar espaço. Os dados foram salvos sem os anexos.', 'warning');
                    console.log('Dados salvos sem PDFs');
                } catch (e2) {
                    console.error('Erro mesmo após remover PDFs:', e2);
                    showToast('ERRO: Não foi possível salvar os dados. LocalStorage cheio. Limpe o navegador.', 'error');
                }
            } else {
                showToast('ERRO: LocalStorage cheio. Não foi possível salvar os dados.', 'error');
            }
        } else {
            console.error('Erro ao salvar dados:', e);
            showToast('Erro ao salvar dados: ' + e.message, 'error');
        }
    }
}

function loadFromLocalStorage() {
    const stored = localStorage.getItem('financialData');
    if (stored) {
        const loaded = JSON.parse(stored);
        Object.assign(financialData, loaded);

        // Ensure all month arrays exist
        for (let i = 0; i < 12; i++) {
            if (!financialData.expenses[i]) {
                financialData.expenses[i] = [];
            }
            if (!financialData.income[i]) {
                financialData.income[i] = [];
            }
            if (!financialData.notes[i]) {
                financialData.notes[i] = '';
            }
        }
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
        if (file.type.startsWith('image/') || file.type === 'application/pdf') {
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
    input.multiple = true;

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

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();
    let firstPage = true;

    for (const file of currentReceiptFiles) {
        if (file.type === 'application/pdf') {
            // If it's already a PDF, we'll handle it separately
            const arrayBuffer = await file.arrayBuffer();
            const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
            return `data:application/pdf;base64,${base64}`;
        } else {
            // Convert image to PDF
            const imageData = await readFileAsDataURL(file);
            const img = await loadImage(imageData);

            if (!firstPage) {
                pdf.addPage();
            }
            firstPage = false;

            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = img.width;
            const imgHeight = img.height;
            const ratio = Math.min(pageWidth / imgWidth, pageHeight / imgHeight);
            const width = imgWidth * ratio;
            const height = imgHeight * ratio;
            const x = (pageWidth - width) / 2;
            const y = (pageHeight - height) / 2;

            pdf.addImage(imageData, 'JPEG', x, y, width, height);
        }
    }

    return pdf.output('dataurlstring');
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

    // Open PDF in new window
    const win = window.open();
    win.document.write(`
        <html>
            <head>
                <title>Nota Fiscal - ${expense.description}</title>
                <style>
                    body { margin: 0; padding: 0; }
                    iframe { border: none; width: 100%; height: 100vh; }
                </style>
            </head>
            <body>
                <iframe src="${expense.receiptPDF}"></iframe>
            </body>
        </html>
    `);
}
