// Authentication System

// Check if user is logged in on page load
document.addEventListener('DOMContentLoaded', function() {
    checkAuthentication();
});

async function checkAuthentication() {
    const currentUser = sessionStorage.getItem('currentUser');

    if (!currentUser) {
        showLoginPage();
        return;
    }

    const user = JSON.parse(currentUser);
    financialData.currentUser = user;

    // Restaurar USER_ID para cloud storage
    if (window.setCloudUserId) {
        window.setCloudUserId(user.username);
    }

    showMainApp();
    await carregarDadosEInicializar();
}

// Carrega dados da nuvem e inicializa a interface
async function carregarDadosEInicializar() {
    showPageLoading();
    try {
        if (window.loadFromLocalStorage) {
            await window.loadFromLocalStorage();
        }
        updateUIForUserRole();
        if (window.populateSelects) window.populateSelects();
        if (window.renderCurrentMonth) window.renderCurrentMonth();
        if (window.initializeCharts) window.initializeCharts();
    } catch (error) {
        console.error('❌ Erro ao carregar dados:', error);
        updateUIForUserRole();
    } finally {
        hidePageLoading();
    }
}

function showPageLoading() {
    if (document.getElementById('pageLoadingOverlay')) return;
    const overlay = document.createElement('div');
    overlay.id = 'pageLoadingOverlay';
    overlay.innerHTML = `
        <div class="loading-spinner">
            <i class="fas fa-spinner fa-spin fa-3x"></i>
            <p>Carregando dados...</p>
        </div>
    `;
    document.body.appendChild(overlay);
}

function hidePageLoading() {
    const overlay = document.getElementById('pageLoadingOverlay');
    if (overlay) overlay.remove();
}

function showLoginPage() {
    document.getElementById('mainApp').style.display = 'none';
    document.getElementById('loginPage').style.display = 'flex';
}

function showMainApp() {
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('mainApp').style.display = 'block';

    const userInfo = document.getElementById('userInfo');
    if (userInfo && financialData.currentUser) {
        userInfo.innerHTML = `
            <span class="user-name">
                <i class="fas fa-user-circle"></i> ${financialData.currentUser.name}
                <span class="user-role">(${financialData.currentUser.role === 'admin' ? 'Admin' : 'Visualização'})</span>
            </span>
            <button class="btn btn-secondary btn-sm" onclick="logout()">
                <i class="fas fa-sign-out-alt"></i> Sair
            </button>
        `;
    }
}

function updateUIForUserRole() {
    const isAdmin = financialData.currentUser && financialData.currentUser.role === 'admin';

    const restrictedButtons = ['addExpenseBtn', 'addIncomeBtn', 'saveNotesBtn', 'settingsBtn'];
    restrictedButtons.forEach(btnId => {
        const btn = document.getElementById(btnId);
        if (btn) {
            btn.disabled = !isAdmin;
            btn.style.opacity = isAdmin ? '1' : '0.5';
            btn.style.cursor = isAdmin ? 'pointer' : 'not-allowed';
            btn.title = isAdmin ? '' : 'Apenas administradores podem realizar esta ação';
        }
    });

    if (!isAdmin) {
        if (!document.getElementById('userRoleStyles')) {
            const style = document.createElement('style');
            style.id = 'userRoleStyles';
            style.textContent = `
                .action-buttons { display: none !important; }
                .data-table th:last-child,
                .data-table td:last-child { display: none !important; }
            `;
            document.head.appendChild(style);
        }
    } else {
        const existingStyle = document.getElementById('userRoleStyles');
        if (existingStyle) existingStyle.remove();
    }
}

async function handleLogin(event) {
    event.preventDefault();

    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;

    const user = financialData.users.find(u =>
        u.username === username && u.password === password
    );

    if (!user) {
        showToast('Usuário ou senha incorretos!', 'error');
        return;
    }

    const userSession = { username: user.username, name: user.name, role: user.role };
    sessionStorage.setItem('currentUser', JSON.stringify(userSession));
    financialData.currentUser = userSession;

    if (window.setCloudUserId) {
        window.setCloudUserId(user.username);
    }

    document.getElementById('loginForm').reset();

    showMainApp();
    await carregarDadosEInicializar();
    showToast(`Bem-vindo, ${user.name}!`, 'success');
}

function logout() {
    if (confirm('Deseja realmente sair?')) {
        sessionStorage.removeItem('currentUser');
        sessionStorage.removeItem('user-id');
        financialData.currentUser = null;
        showLoginPage();
    }
}

function isAdmin() {
    return financialData.currentUser && financialData.currentUser.role === 'admin';
}

function checkAdminPermission() {
    if (!isAdmin()) {
        showToast('Apenas administradores podem realizar esta ação!', 'error');
        return false;
    }
    return true;
}

// Setup login form
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
});
