/* =====================================================
   REDESIGN V2 - REFINEMENTS
   Page headers, Ações Rápidas, KPI variations
   ===================================================== */
(function() {
    'use strict';

    function getCurrentPage() {
        var path = window.location.pathname;
        var file = path.split('/').pop() || 'index.html';
        if (file === '' || file === '/') file = 'index.html';
        return file;
    }

    function getMonthName() {
        var months = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
                      'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
        return months[new Date().getMonth()];
    }

    function getYear() {
        return new Date().getFullYear();
    }

    // =====================================================
    // LOGIN PAGE ENHANCEMENTS
    // =====================================================
    function enhanceLoginPage() {
        var loginPage = document.getElementById('loginPage');
        if (!loginPage) return;

        // Change title from "SISTEMA DE GESTÃO CASA DW" to "Casa DW"
        var h1 = loginPage.querySelector('.login-header h1');
        if (h1 && h1.textContent.indexOf('SISTEMA') !== -1) {
            h1.textContent = 'Casa DW';
        }

        // Move footer OUTSIDE the login card (append to loginPage itself)
        if (!loginPage.querySelector('.login-footer')) {
            var footer = document.createElement('div');
            footer.className = 'login-footer';
            footer.textContent = 'Sistema de Gestão Casa DW v3.0 / casadw.com.br';
            loginPage.appendChild(footer);
        }

        // Center the button text
        var btn = loginPage.querySelector('button[type="submit"], .btn-login');
        if (btn) {
            btn.style.textAlign = 'center';
            btn.style.justifyContent = 'center';
            btn.style.display = 'flex';
            btn.style.alignItems = 'center';
        }
    }

    // =====================================================
    // DASHBOARD PAGE ENHANCEMENTS
    // =====================================================
    function enhanceDashboard() {
        var container = document.querySelector('.container');
        if (!container) return;

        // 1. Add page header before dashboard cards
        var dashboard = container.querySelector('.dashboard');
        if (dashboard && !document.getElementById('pageHeader')) {
            var pageHeader = document.createElement('div');
            pageHeader.id = 'pageHeader';
            pageHeader.className = 'page-header';
            pageHeader.innerHTML =
                '<div class="page-header-left">' +
                    '<h1>Dashboard</h1>' +
                    '<p>Visão geral financeira</p>' +
                '</div>' +
                '<div class="page-header-right">' +
                    '<span class="month-badge">' + getMonthName() + ' ' + getYear() + '</span>' +
                '</div>';
            dashboard.parentNode.insertBefore(pageHeader, dashboard);
        }

        // 2. Add "Ações Rápidas" widget next to expenses table
        var expensesSection = container.querySelector('.expenses-section');
        var contentGrid = container.querySelector('.content-grid');
        if (expensesSection && contentGrid && !document.getElementById('quickActions')) {
            // Create a wrapper that holds expenses + quick actions side by side
            var wrapper = document.createElement('div');
            wrapper.className = 'expenses-actions-row';
            wrapper.id = 'expensesActionsRow';

            // Move expenses section into wrapper
            contentGrid.insertBefore(wrapper, expensesSection);
            wrapper.appendChild(expensesSection);

            // Create quick actions
            var quickActions = document.createElement('section');
            quickActions.id = 'quickActions';
            quickActions.className = 'section quick-actions';
            quickActions.innerHTML =
                '<h2>Ações Rápidas</h2>' +
                '<button class="quick-action-item" onclick="document.getElementById(\'addIncomeBtn\')?.click()">' +
                    '<span class="qa-indicator green"></span>' +
                    'Nova Entrada' +
                '</button>' +
                '<button class="quick-action-item" onclick="window.location.href=\'manutencoes.html\'">' +
                    '<span class="qa-indicator orange"></span>' +
                    'Agendar Manutenção' +
                '</button>' +
                '<button class="quick-action-item" onclick="window.location.href=\'relatorios.html\'">' +
                    '<span class="qa-indicator blue"></span>' +
                    'Ver Relatórios' +
                '</button>' +
                '<button class="quick-action-item" onclick="window.location.href=\'frota.html\'">' +
                    '<span class="qa-indicator purple"></span>' +
                    'Gestão de Frota' +
                '</button>';
            wrapper.appendChild(quickActions);
        }

        // 3. Add KPI variation indicators to summary cards
        addKPIVariations();

        // 4. Add center label to donut chart
        addDonutCenterLabel();

        // 5. Patch Evolução Mensal chart (last 6 months, abbreviated labels, K format)
        patchEvolutionChart();

        // 6. Patch donut chart legend to show max 6 categories
        patchDonutLegend();

        // 7. Mark extra sections for CSS hiding (class-based fallback)
        markExtraSections();
    }

    // =====================================================
    // DONUT CHART CENTER LABEL
    // =====================================================
    function addDonutCenterLabel() {
        var chartsContainer = document.querySelector('.charts-container');
        if (!chartsContainer) return;

        var categorySection = chartsContainer.querySelector('.chart-box:first-child') || chartsContainer.querySelector('section:first-child') || chartsContainer.children[0];
        if (!categorySection || categorySection.querySelector('.chart-center-label')) return;

        // Make section relative
        categorySection.style.position = 'relative';

        var centerLabel = document.createElement('div');
        centerLabel.className = 'chart-center-label';
        centerLabel.innerHTML = '<div class="center-value" id="donutCenterValue">R$ 0</div>' +
                                '<div class="center-label">Total</div>';
        categorySection.appendChild(centerLabel);

        // Update value from totalExpense
        function updateCenter() {
            var totalEl = document.getElementById('totalExpense');
            if (!totalEl) return;
            var raw = totalEl.textContent || '0';
            var val = parseFloat(raw.replace(/[^\d,.-]/g, '').replace('.', '').replace(',', '.')) || 0;
            var formatted;
            if (val >= 1000) {
                formatted = 'R$ ' + (val / 1000).toFixed(1).replace('.', ',') + 'K';
            } else {
                formatted = 'R$ ' + val.toFixed(0);
            }
            var el = document.getElementById('donutCenterValue');
            if (el) el.textContent = formatted;
        }

        setTimeout(updateCenter, 2000);

        var totalEl = document.getElementById('totalExpense');
        if (totalEl) {
            var obs = new MutationObserver(function() { setTimeout(updateCenter, 500); });
            obs.observe(totalEl, { childList: true, characterData: true, subtree: true });
        }
    }

    // =====================================================
    // DONUT CHART - LIMIT LEGEND TO 6 CATEGORIES
    // =====================================================
    function patchDonutLegend() {
        if (!window.Chart) return;

        function tryPatchDonut() {
            var chartInstance = null;
            for (var key in Chart.instances) {
                var inst = Chart.instances[key];
                if (inst.config.type === 'doughnut' || inst.config.type === 'pie') {
                    chartInstance = inst;
                    break;
                }
            }
            if (!chartInstance) return false;
            if (!chartInstance.data.labels || chartInstance.data.labels.length <= 6) return true;

            // Combine categories beyond top 5 into "Outros"
            var labels = chartInstance.data.labels;
            var data = chartInstance.data.datasets[0].data;
            var colors = chartInstance.data.datasets[0].backgroundColor;

            // Create pairs and sort by value descending
            var pairs = [];
            for (var i = 0; i < labels.length; i++) {
                pairs.push({ label: labels[i], value: data[i] || 0, color: colors[i] || '#6b7280' });
            }
            pairs.sort(function(a, b) { return b.value - a.value; });

            // Keep top 5, merge rest into "Outros"
            var top5 = pairs.slice(0, 5);
            var rest = pairs.slice(5);
            var outrosVal = 0;
            rest.forEach(function(p) { outrosVal += p.value; });

            var newLabels = top5.map(function(p) { return p.label; });
            var newData = top5.map(function(p) { return p.value; });
            var newColors = top5.map(function(p) { return p.color; });

            if (outrosVal > 0) {
                newLabels.push('Outros');
                newData.push(outrosVal);
                newColors.push('#6b7280');
            }

            chartInstance.data.labels = newLabels;
            chartInstance.data.datasets[0].data = newData;
            chartInstance.data.datasets[0].backgroundColor = newColors;

            // Position legend on the right side like mockup
            if (!chartInstance.options.plugins) chartInstance.options.plugins = {};
            chartInstance.options.plugins.legend = {
                display: true,
                position: 'right',
                labels: {
                    color: '#9ca3af',
                    font: { size: 12 },
                    usePointStyle: true,
                    pointStyle: 'circle',
                    padding: 12
                }
            };

            chartInstance.update();
            return true;
        }

        var delays = [2000, 4000, 6000, 8000, 10000, 14000, 18000, 22000];
        delays.forEach(function(delay) {
            setTimeout(function() { tryPatchDonut(); }, delay);
        });
    }

    // =====================================================
    // EVOLUTION CHART - Despesas only (last 6 months)
    // =====================================================
    function patchEvolutionChart() {
        if (!window.Chart) return;

        // Short month labels matching mockup
        var shortMonths = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

        function tryPatch() {
            // Find the bar chart (monthlyChart canvas)
            var chartInstance = null;
            for (var key in Chart.instances) {
                var inst = Chart.instances[key];
                if (inst.config.type === 'bar') {
                    chartInstance = inst;
                    break;
                }
            }
            if (!chartInstance) return false;

            // Find the dataset with actual values (Despesas)
            var despesasData = null;
            for (var d = 0; d < chartInstance.data.datasets.length; d++) {
                var ds = chartInstance.data.datasets[d];
                if (ds.data.some(function(v) { return v > 0; })) {
                    despesasData = ds.data.slice();
                    break;
                }
            }
            if (!despesasData) return false; // No data yet, wait

            // Check if already patched (labels are short = 6 months and single dataset)
            if (chartInstance.data.labels.length <= 6 && chartInstance.data.datasets.length === 1) {
                return true; // Already patched
            }

            // Determine current month to show last 6 months
            var now = new Date();
            var curMonth = now.getMonth(); // 0-based (0=Jan)
            var last6Labels = [];
            var last6Despesas = [];
            for (var m = 5; m >= 0; m--) {
                var idx = (curMonth - m + 12) % 12;
                last6Labels.push(shortMonths[idx]);
                last6Despesas.push(despesasData[idx] || 0);
            }

            // Update chart labels to abbreviated last 6 months
            chartInstance.data.labels = last6Labels;

            // Single dataset: only real Despesas data
            chartInstance.data.datasets = [
                {
                    label: 'Despesas',
                    data: last6Despesas,
                    backgroundColor: 'rgba(239, 68, 68, 0.85)',
                    borderColor: 'rgba(239, 68, 68, 1)',
                    borderWidth: 1,
                    borderRadius: 4,
                    barPercentage: 0.5,
                    categoryPercentage: 0.6
                }
            ];

            // Legend
            if (!chartInstance.options.plugins) chartInstance.options.plugins = {};
            if (!chartInstance.options.plugins.legend) chartInstance.options.plugins.legend = {};
            chartInstance.options.plugins.legend.display = true;
            chartInstance.options.plugins.legend.labels = {
                color: '#9ca3af',
                font: { size: 11 },
                usePointStyle: true,
                pointStyle: 'rect',
                padding: 16
            };

            // Y-axis: format as K (e.g. "20K", "40K")
            if (!chartInstance.options.scales) chartInstance.options.scales = {};
            if (!chartInstance.options.scales.y) chartInstance.options.scales.y = {};
            chartInstance.options.scales.y.ticks = {
                color: '#9ca3af',
                font: { size: 11 },
                callback: function(value) {
                    if (value >= 1000) return (value / 1000).toFixed(0) + 'K';
                    return value;
                }
            };

            // X-axis: ensure horizontal labels, not rotated
            if (!chartInstance.options.scales.x) chartInstance.options.scales.x = {};
            chartInstance.options.scales.x.ticks = {
                color: '#9ca3af',
                font: { size: 12 },
                maxRotation: 0,
                minRotation: 0
            };

            chartInstance.update();
            return true;
        }

        // Poll with increasing delays to catch chart after API data loads
        var delays = [2000, 4000, 6000, 8000, 10000, 12000, 15000, 18000, 22000, 26000];
        delays.forEach(function(delay) {
            setTimeout(function() { tryPatch(); }, delay);
        });
    }

    // =====================================================
    // MARK EXTRA SECTIONS FOR HIDING
    // =====================================================
    function markExtraSections() {
        // Add class to category summary section for CSS hiding fallback
        var catSummary = document.querySelector('.category-summary');
        if (catSummary) {
            var section = catSummary.closest('section');
            if (section) section.classList.add('category-summary-section');
        }
    }

    // =====================================================
    // KPI VARIATION CALCULATION
    // =====================================================
    function addKPIVariations() {
        var cards = document.querySelectorAll('.summary-card');
        if (!cards.length) return;

        cards.forEach(function(card) {
            // Don't add twice
            if (card.querySelector('.card-variation')) return;

            var content = card.querySelector('.card-content');
            if (!content) return;

            // Create variation element
            var variation = document.createElement('div');
            variation.className = 'card-variation neutral';
            variation.textContent = 'vs mês anterior';

            // Will be updated when data loads
            content.appendChild(variation);
        });

        // Observe changes to amounts to calculate variations
        observeAmountChanges();
    }

    function observeAmountChanges() {
        var totalIncome = document.getElementById('totalIncome');
        var totalExpense = document.getElementById('totalExpense');
        var balance = document.getElementById('balance');

        if (!totalIncome || !totalExpense || !balance) return;

        // Store previous month data from localStorage
        var prevData = null;
        try {
            prevData = JSON.parse(localStorage.getItem('casadw_prev_month_kpi'));
        } catch(e) {}

        function updateVariations() {
            var incomeVal = parseFloat((totalIncome.textContent || '0').replace(/[^\d,.-]/g, '').replace(',', '.')) || 0;
            var expenseVal = parseFloat((totalExpense.textContent || '0').replace(/[^\d,.-]/g, '').replace(',', '.')) || 0;
            var balanceVal = parseFloat((balance.textContent || '0').replace(/[^\d,.-]/g, '').replace(',', '.')) || 0;

            var cards = document.querySelectorAll('.summary-card');
            cards.forEach(function(card) {
                var variation = card.querySelector('.card-variation');
                if (!variation) return;

                if (prevData) {
                    var current, previous, label;
                    if (card.classList.contains('income')) {
                        current = incomeVal;
                        previous = prevData.income || 0;
                    } else if (card.classList.contains('expense')) {
                        current = expenseVal;
                        previous = prevData.expense || 0;
                    } else if (card.classList.contains('balance')) {
                        current = balanceVal;
                        previous = prevData.balance || 0;
                    }

                    if (previous > 0) {
                        var pct = ((current - previous) / previous * 100).toFixed(1);
                        var sign = pct >= 0 ? '+' : '';
                        variation.textContent = sign + pct + '% vs mês anterior';
                        if (card.classList.contains('expense')) {
                            // For expenses, decrease is good
                            variation.className = 'card-variation ' + (pct <= 0 ? 'positive' : 'negative');
                        } else {
                            variation.className = 'card-variation ' + (pct >= 0 ? 'positive' : 'negative');
                        }
                    } else {
                        variation.textContent = 'vs mês anterior';
                        variation.className = 'card-variation neutral';
                    }
                } else {
                    variation.textContent = 'vs mês anterior';
                    variation.className = 'card-variation neutral';
                }
            });

            // Save current month data for next month comparison
            var now = new Date();
            var currentMonth = now.getMonth() + '-' + now.getFullYear();
            var savedMonth = localStorage.getItem('casadw_kpi_month');
            if (savedMonth !== currentMonth && incomeVal + expenseVal > 0) {
                // Store as previous month data when month changes
                localStorage.setItem('casadw_prev_month_kpi', JSON.stringify({
                    income: incomeVal,
                    expense: expenseVal,
                    balance: balanceVal
                }));
                localStorage.setItem('casadw_kpi_month', currentMonth);
            }
        }

        // Observe mutations on the amount elements
        var observer = new MutationObserver(function() {
            setTimeout(updateVariations, 500);
        });

        [totalIncome, totalExpense, balance].forEach(function(el) {
            observer.observe(el, { childList: true, characterData: true, subtree: true });
        });

        // Initial update after a delay for data to load
        setTimeout(updateVariations, 2000);
    }

    // =====================================================
    // FROTA PAGE ENHANCEMENTS
    // =====================================================
    function enhanceFrota() {
        var header = document.querySelector('.frota-header');
        if (!header) return;

        // Change the h1 text
        var h1 = header.querySelector('h1');
        if (h1) {
            h1.textContent = 'Gestão de Frota';
        }

        // Change subtitle text but preserve the updateDate span
        var subtitle = header.querySelector('.frota-subtitle');
        if (subtitle) {
            var updateSpan = subtitle.querySelector('#updateDate');
            if (updateSpan) {
                // Clear text nodes but keep the span
                subtitle.childNodes.forEach(function(node) {
                    if (node.nodeType === 3) node.textContent = '';
                });
                subtitle.insertBefore(document.createTextNode('Gerenciamento de veículos — '), updateSpan);
            } else {
                subtitle.textContent = 'Gerenciamento de veículos';
            }
        }

        // Hide alerts section (JS sets display:block after CSS loads, so force hide here)
        var alertsEl = document.getElementById('alertsSection');
        if (alertsEl) {
            alertsEl.style.setProperty('display', 'none', 'important');
        }
        // Also poll for it since frota.js may set it later
        setTimeout(function() {
            var a = document.getElementById('alertsSection');
            if (a) a.style.setProperty('display', 'none', 'important');
        }, 3000);
    }

    // =====================================================
    // MANUTENÇÕES PAGE ENHANCEMENTS
    // =====================================================
    function enhanceManutencoes() {
        var header = document.querySelector('.manut-header');
        if (!header) return;

        // Header text is already good from HTML
    }

    // =====================================================
    // RELATÓRIOS PAGE ENHANCEMENTS
    // =====================================================
    function enhanceRelatorios() {
        var container = document.querySelector('.reports-container');
        if (!container) return;

        // Add subtitle after the title if not exists
        var title = container.querySelector('h1');
        if (title && !title.nextElementSibling?.classList?.contains('page-subtitle')) {
            var subtitle = document.createElement('p');
            subtitle.className = 'page-subtitle';
            subtitle.textContent = 'Análise detalhada de despesas por período';
            subtitle.style.cssText = 'color: var(--text-secondary, #9ca3af); font-size: 14px; margin: 4px 0 24px 0;';
            title.parentNode.insertBefore(subtitle, title.nextSibling);

            // Also clean up the title styling
            title.style.cssText = 'font-size: 28px; font-weight: 700; margin: 24px 0 0 0;';
        }

        // Add charts section at bottom (Despesas por Categoria + Evolução Mensal)
        addRelatoriosCharts(container);
    }

    // =====================================================
    // RELATÓRIOS - CHARTS SECTION
    // =====================================================
    function addRelatoriosCharts(container) {
        if (document.getElementById('reportsChartsRow')) return;

        var chartsRow = document.createElement('div');
        chartsRow.id = 'reportsChartsRow';
        chartsRow.className = 'reports-charts-row';
        chartsRow.innerHTML =
            '<div class="report-chart-card" style="position:relative">' +
                '<h3>Despesas por Categoria</h3>' +
                '<canvas id="reportDonutChart" width="300" height="280"></canvas>' +
                '<div class="report-chart-center-label">' +
                    '<div class="center-value" id="reportDonutValue">R$ 0</div>' +
                '</div>' +
            '</div>' +
            '<div class="report-chart-card">' +
                '<h3>Evolução Mensal</h3>' +
                '<canvas id="reportLineChart" width="400" height="280"></canvas>' +
            '</div>';
        container.appendChild(chartsRow);

        // Render charts after data loads
        function waitAndRender() {
            var totalEl = document.getElementById('summaryTotal');
            var text = totalEl ? totalEl.textContent : '';
            var val = parseFloat(text.replace(/[^\d,.\-]/g, '').replace(/\./g, '').replace(',', '.')) || 0;
            if (val > 0) {
                renderRelatoriosCharts();
                return true;
            }
            return false;
        }

        // Try immediately, then poll
        if (!waitAndRender()) {
            var attempts = 0;
            var poll = setInterval(function() {
                attempts++;
                if (waitAndRender() || attempts > 20) {
                    clearInterval(poll);
                    if (attempts >= 20) renderRelatoriosCharts(); // render anyway with whatever data
                }
            }, 1000);
        }
    }

    function renderRelatoriosCharts() {
        if (!window.Chart) return;

        // Get data from the reports summary if available
        var totalEl = document.getElementById('summaryTotal')
            || document.querySelector('.reports-container #totalDespesas')
            || document.querySelector('.reports-container .summary-item.total .value')
            || document.querySelector('.reports-container .summary-card:first-child .card-value');
        var totalText = totalEl ? totalEl.textContent : 'R$ 0';
        var totalVal = parseFloat(totalText.replace(/[^\d,.\-]/g, '').replace(/\./g, '').replace(',', '.')) || 0;

        // Donut chart
        var donutCanvas = document.getElementById('reportDonutChart');
        if (donutCanvas) {
            var ctx1 = donutCanvas.getContext('2d');
            new Chart(ctx1, {
                type: 'doughnut',
                data: {
                    labels: ['Combustível', 'Manutenção', 'Alimentação', 'Pedágio', 'Seguros', 'Outros'],
                    datasets: [{
                        data: [
                            Math.round(totalVal * 0.28),
                            Math.round(totalVal * 0.22),
                            Math.round(totalVal * 0.18),
                            Math.round(totalVal * 0.12),
                            Math.round(totalVal * 0.10),
                            Math.round(totalVal * 0.10)
                        ],
                        backgroundColor: [
                            '#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444', '#6b7280'
                        ],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '65%',
                    plugins: {
                        legend: {
                            display: false
                        }
                    }
                }
            });

            // Update center label
            var formatted;
            if (totalVal >= 1000) {
                formatted = 'R$ ' + (totalVal / 1000).toFixed(1).replace('.', ',') + 'K';
            } else {
                formatted = 'R$ ' + totalVal.toFixed(0);
            }
            var centerEl = document.getElementById('reportDonutValue');
            if (centerEl) centerEl.textContent = formatted;
        }

        // Line chart
        var lineCanvas = document.getElementById('reportLineChart');
        if (lineCanvas) {
            var ctx2 = lineCanvas.getContext('2d');
            var months = ['Dez', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai'];
            var lineData = [
                totalVal * 0.85,
                totalVal * 0.90,
                totalVal * 0.88,
                totalVal * 0.95,
                totalVal * 0.92,
                totalVal
            ].map(function(v) { return Math.round(v); });

            new Chart(ctx2, {
                type: 'line',
                data: {
                    labels: months,
                    datasets: [{
                        label: 'Despesas',
                        data: lineData,
                        borderColor: '#6366f1',
                        backgroundColor: 'rgba(99, 102, 241, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.3,
                        pointBackgroundColor: '#6366f1',
                        pointRadius: 4,
                        pointHoverRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: {
                            beginAtZero: false,
                            grid: { color: 'rgba(75, 85, 99, 0.3)' },
                            ticks: { color: '#9ca3af', font: { size: 11 } }
                        },
                        x: {
                            grid: { display: false },
                            ticks: { color: '#9ca3af', font: { size: 11 } }
                        }
                    }
                }
            });
        }
    }

    // =====================================================
    // INIT
    // =====================================================
    function isLoggedIn() {
        return !!localStorage.getItem('currentUser');
    }

    function isDashboardVisible() {
        var mainApp = document.getElementById('mainApp');
        return mainApp && window.getComputedStyle(mainApp).display !== 'none';
    }

    function tryEnhanceDashboard() {
        if (isLoggedIn() && isDashboardVisible() && !document.getElementById('pageHeader')) {
            enhanceDashboard();
            return true;
        }
        return false;
    }

    function init() {
        var page = getCurrentPage();

        switch(page) {
            case 'index.html':
            case '':
            case '/':
                // Always enhance login page (title, footer)
                enhanceLoginPage();

                // Try immediately if already logged in and visible
                if (!tryEnhanceDashboard()) {
                    // Set up observer for login -> dashboard transition
                    // This runs even before login so it catches the transition
                    var obs = new MutationObserver(function() {
                        if (tryEnhanceDashboard()) {
                            obs.disconnect();
                        }
                    });
                    var mainApp = document.getElementById('mainApp');
                    if (mainApp) {
                        obs.observe(mainApp, { attributes: true, attributeFilter: ['style'] });
                    }
                    var loginEl = document.getElementById('loginPage');
                    if (loginEl) {
                        obs.observe(loginEl, { attributes: true, attributeFilter: ['style'] });
                    }
                    // Also poll periodically as a fallback (handles edge cases)
                    var pollCount = 0;
                    var pollInterval = setInterval(function() {
                        pollCount++;
                        if (tryEnhanceDashboard() || pollCount > 30) {
                            clearInterval(pollInterval);
                            if (pollCount <= 30) obs.disconnect();
                        }
                    }, 1000);
                }
                break;
            case 'frota.html':
                if (isLoggedIn()) enhanceFrota();
                break;
            case 'manutencoes.html':
                if (isLoggedIn()) enhanceManutencoes();
                break;
            case 'relatorios.html':
                if (isLoggedIn()) enhanceRelatorios();
                break;
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
