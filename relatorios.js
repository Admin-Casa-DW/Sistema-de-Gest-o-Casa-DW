// Relatórios - JavaScript
let financialData = null;
let filteredExpenses = [];
let categoryChart = null;
let monthlyChart = null;

// Carregar dados do localStorage
function loadData() {
    const savedData = localStorage.getItem('financialData');
    if (savedData) {
        financialData = JSON.parse(savedData);
    } else {
        // Estrutura padrão se não houver dados
        financialData = {
            months: [
                'JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL',
                'MAIO', 'JUNHO', 'JULHO', 'AGOSTO',
                'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'
            ],
            expenses: {},
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
            ]
        };

        // Inicializar arrays de despesas para cada mês
        for (let i = 0; i < 12; i++) {
            financialData.expenses[i] = [];
        }
    }
}

// Preencher selects com opções
function populateFilters() {
    // Categorias
    const categorySelect = document.getElementById('filterCategory');
    financialData.categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categorySelect.appendChild(option);
    });

    // Fornecedores
    const supplierSelect = document.getElementById('filterSupplier');
    financialData.suppliers.forEach(supplier => {
        const option = document.createElement('option');
        option.value = supplier;
        option.textContent = supplier;
        supplierSelect.appendChild(option);
    });

    // Métodos de Pagamento
    const paymentSelect = document.getElementById('filterPaymentMethod');
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
    const category = document.getElementById('filterCategory').value;
    const supplier = document.getElementById('filterSupplier').value;
    const paymentMethod = document.getElementById('filterPaymentMethod').value;
    const dateFrom = document.getElementById('filterDateFrom').value;
    const dateTo = document.getElementById('filterDateTo').value;

    // Resetar array de despesas filtradas
    filteredExpenses = [];

    // Determinar quais meses processar
    const monthsToProcess = month === '' ? Object.keys(financialData.expenses) : [month];

    // Filtrar despesas
    monthsToProcess.forEach(monthIndex => {
        const monthExpenses = financialData.expenses[monthIndex] || [];

        monthExpenses.forEach(expense => {
            let include = true;

            // Filtro por categoria
            if (category && expense.category !== category) {
                include = false;
            }

            // Filtro por fornecedor
            if (supplier && expense.supplier !== supplier) {
                include = false;
            }

            // Filtro por método de pagamento
            if (paymentMethod && expense.paymentMethod !== paymentMethod) {
                include = false;
            }

            // Filtro por data
            if (dateFrom && expense.date < dateFrom) {
                include = false;
            }
            if (dateTo && expense.date > dateTo) {
                include = false;
            }

            if (include) {
                filteredExpenses.push({
                    ...expense,
                    monthIndex: monthIndex,
                    monthName: financialData.months[monthIndex]
                });
            }
        });
    });

    // Ordenar por data (mais antigo primeiro - crescente)
    filteredExpenses.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateA - dateB;
    });

    // Atualizar interface
    updateSummary();
    updateTable();
    updateCharts();
}

// Atualizar resumo
function updateSummary() {
    const total = filteredExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount || 0), 0);
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
                        ${expense.category}
                    </span>
                </td>
                <td>${expense.supplier}</td>
                <td>${expense.description || '-'}</td>
                <td>${expense.paymentMethod}</td>
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
        if (!categoryData[expense.category]) {
            categoryData[expense.category] = 0;
        }
        categoryData[expense.category] += parseFloat(expense.amount || 0);
    });

    const labels = Object.keys(categoryData);
    const data = Object.values(categoryData);
    const backgroundColors = labels.map(label => getCategoryColor(label));

    const ctx = document.getElementById('categoryChart').getContext('2d');

    if (categoryChart) {
        categoryChart.destroy();
    }

    if (labels.length === 0) {
        ctx.font = '16px Arial';
        ctx.fillStyle = '#999';
        ctx.textAlign = 'center';
        ctx.fillText('Nenhum dado disponível', ctx.canvas.width / 2, ctx.canvas.height / 2);
        return;
    }

    categoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: backgroundColors,
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'right',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = formatCurrency(context.parsed);
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((context.parsed / total) * 100).toFixed(1);
                            return `${label}: ${value} (${percentage}%)`;
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

    // Inicializar todos os meses com 0
    financialData.months.forEach((month, index) => {
        monthlyData[index] = 0;
    });

    // Somar despesas por mês
    filteredExpenses.forEach(expense => {
        monthlyData[expense.monthIndex] += parseFloat(expense.amount || 0);
    });

    const labels = financialData.months.map(m => m.replace(/\s*\d{4}$/, ''));
    const data = Object.values(monthlyData);

    const ctx = document.getElementById('monthlyChart').getContext('2d');

    if (monthlyChart) {
        monthlyChart.destroy();
    }

    if (filteredExpenses.length === 0) {
        ctx.font = '16px Arial';
        ctx.fillStyle = '#999';
        ctx.textAlign = 'center';
        ctx.fillText('Nenhum dado disponível', ctx.canvas.width / 2, ctx.canvas.height / 2);
        return;
    }

    monthlyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Despesas Mensais',
                data: data,
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
                    ticks: {
                        callback: function(value) {
                            return 'R$ ' + value.toLocaleString('pt-BR');
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return formatCurrency(context.parsed.y);
                        }
                    }
                }
            }
        }
    });
}

// Limpar filtros
function clearFilters() {
    document.getElementById('filterMonth').value = '';
    document.getElementById('filterCategory').value = '';
    document.getElementById('filterSupplier').value = '';
    document.getElementById('filterPaymentMethod').value = '';
    document.getElementById('filterDateFrom').value = '';
    document.getElementById('filterDateTo').value = '';

    filteredExpenses = [];
    updateSummary();

    const tbody = document.getElementById('reportTableBody');
    tbody.innerHTML = `
        <tr>
            <td colspan="7" class="no-data">
                <i class="fas fa-inbox" style="font-size: 48px; margin-bottom: 10px;"></i>
                <p>Nenhuma despesa encontrada. Aplique os filtros para visualizar os dados.</p>
            </td>
        </tr>
    `;

    document.getElementById('resultsInfo').textContent = '';

    // Limpar gráficos
    if (categoryChart) categoryChart.destroy();
    if (monthlyChart) monthlyChart.destroy();
}

// Exportar relatório para Excel
function exportReport() {
    if (filteredExpenses.length === 0) {
        alert('Não há dados para exportar. Aplique os filtros primeiro.');
        return;
    }

    let csv = 'Data,Mês,Categoria,Fornecedor,Descrição,Método de Pagamento,Valor\n';

    filteredExpenses.forEach(expense => {
        csv += `${formatDate(expense.date)},`;
        csv += `${(expense.monthName || '').replace(/\s*\d{4}$/, '')},`;
        csv += `${expense.category},`;
        csv += `${expense.supplier},`;
        csv += `"${expense.description || ''}",`;
        csv += `${expense.paymentMethod},`;
        csv += `${expense.amount}\n`;
    });

    // Adicionar linha de total
    const total = filteredExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount || 0), 0);
    csv += `,,,,,,TOTAL: R$ ${total.toFixed(2)}\n`;

    // Download do arquivo
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    const now = new Date();
    const filename = `relatorio_despesas_${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2,'0')}${now.getDate().toString().padStart(2,'0')}.csv`;

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Funções auxiliares
function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value || 0);
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
}

function getCategoryColor(category) {
    const colors = {
        'Alimentação': '#FF6384',
        'Carro': '#36A2EB',
        'Transporte': '#FFCE56',
        'Manutenção': '#4BC0C0',
        'Farmácia': '#9966FF',
        'Outros': '#FF9F40',
        'Pets': '#FF6384',
        'Hotel': '#C9CBCF',
        'Escritório': '#4BC0C0',
        'Fornecedor': '#36A2EB'
    };
    return colors[category] || '#999999';
}

// Inicializar ao carregar a página
document.addEventListener('DOMContentLoaded', function() {
    loadData();
    populateFilters();

    // Aplicar filtro do mês atual por padrão
    const currentMonth = new Date().getMonth();
    document.getElementById('filterMonth').value = currentMonth;

    console.log('Relatórios carregados com sucesso');
});
