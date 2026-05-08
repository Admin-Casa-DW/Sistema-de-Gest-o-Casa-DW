/* =====================================================
   SIDEBAR NAVIGATION - CASA DW
   ===================================================== */

(function() {
    'use strict';

    // Don't initialize sidebar on login page
    function isLoginVisible() {
        var loginPage = document.getElementById('loginPage');
        if (!loginPage) return false;
        var style = window.getComputedStyle(loginPage);
        return style.display !== 'none';
    }

    // Get current page
    function getCurrentPage() {
        var path = window.location.pathname;
        var file = path.split('/').pop() || 'index.html';
        if (file === '' || file === '/') file = 'index.html';
        return file;
    }

    // Get username from localStorage
    function getUsername() {
        try {
            var user = localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser');
            if (user) {
                var parsed = JSON.parse(user);
                return parsed.username || parsed.name || 'Admin';
            }
        } catch(e) {}
        return 'Admin';
    }

    // Get initials
    function getInitials(name) {
        return name.split(' ').map(function(w) { return w[0]; }).join('').toUpperCase().substring(0, 2);
    }

    // Create sidebar HTML
    function createSidebar() {
        var currentPage = getCurrentPage();
        var username = getUsername();
        var initials = getInitials(username);

        var navItems = [
            { href: 'index.html', icon: 'fas fa-th-large', label: 'Dashboard', page: 'index.html' },
            { href: 'frota.html', icon: 'fas fa-car', label: 'Frota', page: 'frota.html' },
            { href: 'manutencoes.html', icon: 'fas fa-tools', label: 'Manutenções', page: 'manutencoes.html' },
            { href: 'relatorios.html', icon: 'fas fa-chart-bar', label: 'Relatórios', page: 'relatorios.html' }
        ];

        var navHTML = '';
        navItems.forEach(function(item) {
            var activeClass = (currentPage === item.page) ? ' active' : '';
            navHTML += '<a href="' + item.href + '" class="sidebar-nav-item' + activeClass + '">' +
                       '<i class="' + item.icon + '"></i> ' + item.label + '</a>';
        });

        // Settings item (opens modal on dashboard)
        var settingsActive = '';
        navHTML += '<a href="#" class="sidebar-nav-item' + settingsActive + '" id="sidebarSettings">' +
                   '<i class="fas fa-cog"></i> Parâmetros</a>';

        var sidebarHTML =
            '<div class="sidebar" id="sidebarNav">' +
                '<div class="sidebar-logo">' +
                    '<img src="logo-dw.png" alt="DW">' +
                    '<div class="sidebar-logo-text">' +
                        '<h2>Casa DW</h2>' +
                        '<span>Sistema de Gestão</span>' +
                    '</div>' +
                '</div>' +
                '<nav class="sidebar-nav">' +
                    '<div class="sidebar-nav-label">Menu Principal</div>' +
                    navHTML +
                '</nav>' +
                '<div class="sidebar-user">' +
                    '<div class="sidebar-user-avatar">' + initials + '</div>' +
                    '<div class="sidebar-user-info">' +
                        '<div class="user-name">' + username + '</div>' +
                        '<div class="user-status">Online</div>' +
                    '</div>' +
                    '<button class="sidebar-logout" onclick="sidebarLogout()" title="Sair do sistema">' +
                        '<i class="fas fa-sign-out-alt"></i>' +
                    '</button>' +
                '</div>' +
            '</div>';

        // Toggle button for mobile
        var toggleHTML = '<button class="sidebar-toggle" id="sidebarToggle" title="Menu">' +
                         '<i class="fas fa-bars"></i></button>';

        // Overlay for mobile
        var overlayHTML = '<div class="sidebar-overlay" id="sidebarOverlay"></div>';

        return toggleHTML + overlayHTML + sidebarHTML;
    }

    // Initialize sidebar
    function initSidebar() {
        // Check if user is logged in
        var currentUser = localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser');
        if (!currentUser) return;

        // Check if on login page
        if (isLoginVisible()) return;

        // Don't add sidebar twice
        if (document.getElementById('sidebarNav')) return;

        // Insert sidebar
        document.body.insertAdjacentHTML('afterbegin', createSidebar());
        document.body.classList.add('has-sidebar');

        // Mobile toggle
        var toggle = document.getElementById('sidebarToggle');
        var sidebar = document.getElementById('sidebarNav');
        var overlay = document.getElementById('sidebarOverlay');

        if (toggle) {
            toggle.addEventListener('click', function() {
                sidebar.classList.toggle('open');
                overlay.classList.toggle('active');
                // Toggle icon
                var icon = toggle.querySelector('i');
                if (sidebar.classList.contains('open')) {
                    icon.className = 'fas fa-times';
                } else {
                    icon.className = 'fas fa-bars';
                }
            });
        }

        if (overlay) {
            overlay.addEventListener('click', function() {
                sidebar.classList.remove('open');
                overlay.classList.remove('active');
                var icon = toggle.querySelector('i');
                icon.className = 'fas fa-bars';
            });
        }

        // Settings button
        var settingsBtn = document.getElementById('sidebarSettings');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', function(e) {
                e.preventDefault();
                // If on dashboard, click the settings button
                var btn = document.getElementById('settingsBtn');
                if (btn) {
                    btn.click();
                } else {
                    // Navigate to dashboard with settings param
                    window.location.href = 'index.html?openSettings=1';
                }
                // Close mobile sidebar
                if (sidebar) sidebar.classList.remove('open');
                if (overlay) overlay.classList.remove('active');
            });
        }

        // Start inactivity monitoring on all pages
        startInactivityMonitor();
    }

    // =====================================================
    // LOGOUT - Properly clear all auth state
    // =====================================================
    window.sidebarLogout = function() {
        if (!confirm('Deseja realmente sair?')) return;

        // Clear session timeout if running
        clearInactivityTimer();

        // Clear auth tokens from both storages
        sessionStorage.removeItem('authToken');
        localStorage.removeItem('authToken');

        // Clear user data from both storages
        sessionStorage.removeItem('currentUser');
        localStorage.removeItem('currentUser');

        // Clear financialData.currentUser if it exists (dashboard page)
        if (window.financialData) {
            window.financialData.currentUser = null;
        }

        // Log audit if available
        if (window.auditoria && typeof window.auditoria.logout === 'function') {
            try { window.auditoria.logout(); } catch(e) {}
        }

        // Clear auth.js timers if available
        if (typeof window.clearSessionTimeout === 'function') {
            try { window.clearSessionTimeout(); } catch(e) {}
        }

        // Redirect to login
        window.location.href = 'index.html';
    };

    // =====================================================
    // INACTIVITY MONITOR - Works on ALL pages
    // =====================================================
    var INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes
    var INACTIVITY_WARNING = 25 * 60 * 1000; // 25 minutes (warn 5 min before)
    var inactivityTimerId = null;
    var inactivityWarningId = null;
    var warningShown = false;

    function startInactivityMonitor() {
        // Only monitor if user is logged in
        var currentUser = localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser');
        if (!currentUser) return;

        // On the dashboard (index.html), auth.js handles its own timeout
        // But we still run ours as a safety net on ALL pages
        resetInactivityTimer();

        // Listen for user activity
        ['click', 'keydown', 'mousemove', 'scroll', 'touchstart'].forEach(function(evt) {
            document.addEventListener(evt, function() {
                if (!warningShown) {
                    resetInactivityTimer();
                }
            }, { passive: true });
        });
    }

    function resetInactivityTimer() {
        clearInactivityTimer();
        warningShown = false;

        inactivityWarningId = setTimeout(function() {
            var currentUser = localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser');
            if (!currentUser) return;

            warningShown = true;
            if (confirm('Sua sessão expira em 5 minutos por inatividade.\n\nDeseja continuar logado?')) {
                resetInactivityTimer();
                // Try to refresh token
                var token = sessionStorage.getItem('authToken') || localStorage.getItem('authToken');
                var apiUrl = window.APP_CONFIG ? window.APP_CONFIG.API_URL : '';
                if (token && apiUrl) {
                    fetch(apiUrl + '/api/auth/verify', {
                        headers: { 'Authorization': 'Bearer ' + token }
                    }).then(function(r) { return r.json(); }).then(function(data) {
                        if (data.token) {
                            sessionStorage.setItem('authToken', data.token);
                            localStorage.setItem('authToken', data.token);
                        }
                    }).catch(function() {});
                }
            } else {
                forceInactivityLogout();
            }
        }, INACTIVITY_WARNING);

        inactivityTimerId = setTimeout(function() {
            var currentUser = localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser');
            if (!currentUser) return;
            forceInactivityLogout();
        }, INACTIVITY_TIMEOUT);
    }

    function clearInactivityTimer() {
        if (inactivityTimerId) { clearTimeout(inactivityTimerId); inactivityTimerId = null; }
        if (inactivityWarningId) { clearTimeout(inactivityWarningId); inactivityWarningId = null; }
    }

    function forceInactivityLogout() {
        clearInactivityTimer();

        // Clear all auth state
        sessionStorage.removeItem('authToken');
        localStorage.removeItem('authToken');
        sessionStorage.removeItem('currentUser');
        localStorage.removeItem('currentUser');

        if (window.financialData) {
            window.financialData.currentUser = null;
        }

        if (window.auditoria && typeof window.auditoria.logout === 'function') {
            try { window.auditoria.logout(); } catch(e) {}
        }

        // Redirect to login with timeout message
        window.location.href = 'index.html';
        setTimeout(function() {
            alert('Sua sessão expirou por inatividade. Faça login novamente.');
        }, 500);
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSidebar);
    } else {
        initSidebar();
    }

    // Also handle the case where login page switches to main app
    // (on index.html, login hides and mainApp shows)
    var observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                var loginPage = document.getElementById('loginPage');
                var mainApp = document.getElementById('mainApp');
                if (loginPage && mainApp) {
                    var loginHidden = window.getComputedStyle(loginPage).display === 'none';
                    var mainVisible = window.getComputedStyle(mainApp).display !== 'none';
                    if (loginHidden && mainVisible && !document.getElementById('sidebarNav')) {
                        initSidebar();
                    }
                }
            }
        });
    });

    // Observe login page style changes
    var loginEl = document.getElementById('loginPage');
    if (loginEl) {
        observer.observe(loginEl, { attributes: true, attributeFilter: ['style'] });
    }

    // Also observe mainApp
    var mainEl = document.getElementById('mainApp');
    if (mainEl) {
        observer.observe(mainEl, { attributes: true, attributeFilter: ['style'] });
    }
})();
