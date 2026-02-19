// Relatórios - JavaScript
let financialData = null;
let filteredExpenses = [];
let categoryChart = null;
let monthlyChart = null;
let availableYears = []; // Anos disponíveis nos dados

const MONTHS = [
    'JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL',
    'MAIO', 'JUNHO', 'JULHO', 'AGOSTO',
    'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'
];

// Carregar dados do CloudStorage (MongoDB)
async function loadData() {
    try {
        // Obter userId do sessionStorage (mesma chave usada pelo cloud-storage.js)
        const userId = sessionStorage.getItem('user-id');
        const apiUrl = window.APP_CONFIG?.API_URL;

        if (!userId || !apiUrl) {
            console.warn('⚠️ Usuário não logado ou API não configurada');
            initEmptyData();
            return;
        }

        const response = await fetch(`${apiUrl}/api/sync/${userId}`);
        const data = await response.json();

        // Montar estrutura de financialData compatível com os filtros
        financialData = {
            months: MONTHS,
            expenses: {},
            categories: [
                'Alimentação', 'Carro', 'Transporte', 'Manutenção',
                'Farmácia', 'Outros', 'Pets', 'Hotel', 'Escritório', 'Fornecedor'
            ],
            suppliers: [],
            paymentMethods: [
                'Cartão de Crédito', 'Reembolso', 'Conta Corrente', 'Outros'
            ]
        };

        // Inicializar arrays de despesas para cada mês
        for (let i = 0; i < 12; i++) {
            financialData.expenses[i] = [];
        }

        // Preencher com dados da API
        // A API retorna expenses como array de {month, year, items}
        const yearsSet = new Set();
        if (data.expenses && Array.isArray(data.expenses)) {
            data.expenses.forEach(monthData => {
                const monthIndex = monthData.month;
                const year = monthData.year;
                const items = monthData.items || [];

                if (monthIndex >= 0 && monthIndex < 12) {
                    // Adicionar ano a cada item de despesa
                    const itemsWithYear = items.map(item => ({
                        ...item,
                        year: year
                    }));

                    // Concatenar aos itens existentes (permite múltiplos anos no mesmo mês)
                    financialData.expenses[monthIndex] = [
                        ...(financialData.expenses[monthIndex] || []),
                        ...itemsWithYear
                    ];

                    if (year) yearsSet.add(year);
                }
            });
        }

        // Armazenar anos disponíveis ordenados
        availableYears = Array.from(yearsSet).sort((a, b) => b - a); // Decrescente

        // Coletar fornecedores únicos das despesas
        const suppliersSet = new Set();
        Object.values(financialData.expenses).forEach(monthExpenses => {
            monthExpenses.forEach(expense => {
                if (expense.supplier) suppliersSet.add(expense.supplier);
            });
        });
        financialData.suppliers = Array.from(suppliersSet).sort();

        console.log('✅ Dados carregados do MongoDB para relatórios');

    } catch (error) {
        console.error('❌ Erro ao carregar dados:', error);
        initEmptyData();
    }
}

function initEmptyData() {
    financialData = {
        months: MONTHS,
        expenses: {},
        categories: [
            'Alimentação', 'Carro', 'Transporte', 'Manutenção',
            'Farmácia', 'Outros', 'Pets', 'Hotel', 'Escritório', 'Fornecedor'
        ],
        suppliers: [],
        paymentMethods: ['Cartão de Crédito', 'Reembolso', 'Conta Corrente', 'Outros']
    };
    for (let i = 0; i < 12; i++) {
        financialData.expenses[i] = [];
    }
}

// Preencher selects com opções
function populateFilters() {
    // Anos
    const yearSelect = document.getElementById('filterYear');
    yearSelect.innerHTML = '<option value="">Todos os Anos</option>';
    availableYears.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearSelect.appendChild(option);
    });

    // Se só há um ano, selecionar automaticamente
    if (availableYears.length === 1) {
        yearSelect.value = availableYears[0];
    } else if (availableYears.includes(new Date().getFullYear())) {
        // Selecionar o ano atual por padrão se disponível
        yearSelect.value = new Date().getFullYear();
    }

    // Categorias
    const categorySelect = document.getElementById('filterCategory');
    categorySelect.innerHTML = '<option value="">Todas as Categorias</option>';
    financialData.categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categorySelect.appendChild(option);
    });

    // Fornecedores
    const supplierSelect = document.getElementById('filterSupplier');
    supplierSelect.innerHTML = '<option value="">Todos os Fornecedores</option>';
    financialData.suppliers.forEach(supplier => {
        const option = document.createElement('option');
        option.value = supplier;
        option.textContent = supplier;
        supplierSelect.appendChild(option);
    });

    // Métodos de Pagamento
    const paymentSelect = document.getElementById('filterPaymentMethod');
    paymentSelect.innerHTML = '<option value="">Todos os Métodos</option>';
    financialData.paymentMethods.forEach(method => {
        const option = document.createElement('option');
        option.value = method;
        option.textContent = method;
        paymentSelect.appendChild(option);
    });
}

// Aplicar filtros
function applyFilters() {
    const month = document.getElementById('filterMonth').value;
    const year = document.getElementById('filterYear').value;
    const category = document.getElementById('filterCategory').value;
    const supplier = document.getElementById('filterSupplier').value;
    const paymentMethod = document.getElementById('filterPaymentMethod').value;
    const dateFrom = document.getElementById('filterDateFrom').value;
    const dateTo = document.getElementById('filterDateTo').value;

    filteredExpenses = [];

    const monthsToProcess = month === '' ? Object.keys(financialData.expenses) : [month];

    monthsToProcess.forEach(monthIndex => {
        const monthExpenses = financialData.expenses[monthIndex] || [];

        monthExpenses.forEach(expense => {
            let include = true;

            // Filtro de ano
            if (year && expense.year && expense.year.toString() !== year) include = false;

            if (category && expense.category !== category) include = false;
            if (supplier && expense.supplier !== supplier) include = false;
            if (paymentMethod && expense.paymentMethod !== paymentMethod) include = false;
            if (dateFrom && expense.date < dateFrom) include = false;
            if (dateTo && expense.date > dateTo) include = false;

            if (include) {
                filteredExpenses.push({
                    ...expense,
                    monthIndex: parseInt(monthIndex),
                    monthName: MONTHS[parseInt(monthIndex)] || ''
                });
            }
        });
    });

    // Ordenar por data (crescente)
    filteredExpenses.sort((a, b) => new Date(a.date) - new Date(b.date));

    updateSummary();
    updateTable();
    updateCharts();
}

// Atualizar resumo
function updateSummary() {
    const total = filteredExpenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
    const count = filteredExpenses.length;
    const average = count > 0 ? total / count : 0;

    document.getElementById('summaryTotal').textContent = formatCurrency(total);
    document.getElementById('summaryCount').textContent = count;
    document.getElementById('summaryAverage').textContent = formatCurrency(average);
}

// Atualizar tabela
function updateTable() {
    const tbody = document.getElementById('reportTableBody');
    const resultsInfo = document.getElementById('resultsInfo');

    if (filteredExpenses.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="no-data">
                    <i class="fas fa-search" style="font-size: 48px; margin-bottom: 10px;"></i>
                    <p>Nenhuma despesa encontrada com os filtros aplicados.</p>
                </td>
            </tr>
        `;
        resultsInfo.textContent = '';
        return;
    }

    resultsInfo.textContent = `Exibindo ${filteredExpenses.length} lançamento(s)`;

    tbody.innerHTML = filteredExpenses.map(expense => {
        const categoryColor = getCategoryColor(expense.category);
        const monthDisplay = (expense.monthName || '').replace(/\s*\d{4}$/, '');
        return `
            <tr>
                <td>${formatDate(expense.date)}</td>
                <td>${monthDisplay}</td>
                <td>
                    <span class="category-badge" style="background: ${categoryColor}20; color: ${categoryColor}; border: 1px solid ${categoryColor}40;">
                        ${expense.category || '-'}
                    </span>
                </td>
                <td>${expense.supplier || '-'}</td>
                <td>${expense.description || '-'}</td>
                <td>${expense.paymentMethod || '-'}</td>
                <td style="text-align: right; font-weight: 600;">${formatCurrency(expense.amount)}</td>
            </tr>
        `;
    }).join('');
}

// Atualizar gráficos
function updateCharts() {
    updateCategoryChart();
    updateMonthlyChart();
}

// Gráfico por categoria
function updateCategoryChart() {
    const categoryData = {};
    filteredExpenses.forEach(expense => {
        if (!categoryData[expense.category]) categoryData[expense.category] = 0;
        categoryData[expense.category] += parseFloat(expense.amount || 0);
    });

    const labels = Object.keys(categoryData);
    const data = Object.values(categoryData);
    const backgroundColors = labels.map(label => getCategoryColor(label));

    const ctx = document.getElementById('categoryChart').getContext('2d');
    if (categoryChart) categoryChart.destroy();

    if (labels.length === 0) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.font = '16px Arial';
        ctx.fillStyle = '#999';
        ctx.textAlign = 'center';
        ctx.fillText('Nenhum dado disponível', ctx.canvas.width / 2, ctx.canvas.height / 2);
        return;
    }

    categoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{ data, backgroundColor: backgroundColors, borderWidth: 2, borderColor: '#fff' }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { position: 'right' },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((context.parsed / total) * 100).toFixed(1);
                            return `${context.label}: ${formatCurrency(context.parsed)} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Gráfico mensal
function updateMonthlyChart() {
    const monthlyData = {};
    MONTHS.forEach((_, index) => { monthlyData[index] = 0; });
    filteredExpenses.forEach(expense => {
        monthlyData[expense.monthIndex] += parseFloat(expense.amount || 0);
    });

    const labels = MONTHS.map(m => m.replace(/\s*\d{4}$/, ''));
    const data = Object.values(monthlyData);

    const ctx = document.getElementById('monthlyChart').getContext('2d');
    if (monthlyChart) monthlyChart.destroy();

    if (filteredExpenses.length === 0) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.font = '16px Arial';
        ctx.fillStyle = '#999';
        ctx.textAlign = 'center';
        ctx.fillText('Nenhum dado disponível', ctx.canvas.width / 2, ctx.canvas.height / 2);
        return;
    }

    monthlyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Despesas Mensais',
                data,
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { callback: value => 'R$ ' + value.toLocaleString('pt-BR') }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: { label: context => formatCurrency(context.parsed.y) }
                }
            }
        }
    });
}

// Limpar filtros
function clearFilters() {
    document.getElementById('filterMonth').value = '';
    document.getElementById('filterYear').value = '';
    document.getElementById('filterCategory').value = '';
    document.getElementById('filterSupplier').value = '';
    document.getElementById('filterPaymentMethod').value = '';
    document.getElementById('filterDateFrom').value = '';
    document.getElementById('filterDateTo').value = '';

    filteredExpenses = [];
    updateSummary();

    document.getElementById('reportTableBody').innerHTML = `
        <tr>
            <td colspan="7" class="no-data">
                <i class="fas fa-inbox" style="font-size: 48px; margin-bottom: 10px;"></i>
                <p>Nenhuma despesa encontrada. Aplique os filtros para visualizar os dados.</p>
            </td>
        </tr>
    `;
    document.getElementById('resultsInfo').textContent = '';

    if (categoryChart) categoryChart.destroy();
    if (monthlyChart) monthlyChart.destroy();
}

// Exportar relatório para CSV
function exportReport() {
    if (filteredExpenses.length === 0) {
        alert('Não há dados para exportar. Aplique os filtros primeiro.');
        return;
    }

    let csv = 'Data,Mês,Categoria,Fornecedor,Descrição,Método de Pagamento,Valor\n';
    filteredExpenses.forEach(expense => {
        csv += `${formatDate(expense.date)},`;
        csv += `${(expense.monthName || '').replace(/\s*\d{4}$/, '')},`;
        csv += `${expense.category || ''},`;
        csv += `${expense.supplier || ''},`;
        csv += `"${expense.description || ''}",`;
        csv += `${expense.paymentMethod || ''},`;
        csv += `${expense.amount}\n`;
    });

    const total = filteredExpenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
    csv += `,,,,,,TOTAL: R$ ${total.toFixed(2)}\n`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    const now = new Date();
    const filename = `relatorio_${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2,'0')}${now.getDate().toString().padStart(2,'0')}.csv`;
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Funções auxiliares
function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
}

function getCategoryColor(category) {
    const colors = {
        'Alimentação': '#FF6384', 'Carro': '#36A2EB', 'Transporte': '#FFCE56',
        'Manutenção': '#4BC0C0', 'Farmácia': '#9966FF', 'Outros': '#FF9F40',
        'Pets': '#FF6384', 'Hotel': '#C9CBCF', 'Escritório': '#4BC0C0', 'Fornecedor': '#36A2EB'
    };
    return colors[category] || '#999999';
}

// Inicializar ao carregar a página
document.addEventListener('DOMContentLoaded', async function() {
    await loadData();
    populateFilters();

    // Aplicar filtro do mês atual por padrão
    const currentMonth = new Date().getMonth();
    document.getElementById('filterMonth').value = currentMonth;
    applyFilters();

    console.log('✅ Relatórios carregados do MongoDB');
});
