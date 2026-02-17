// Authentication System

// Check if user is logged in on page load
document.addEventListener('DOMContentLoaded', function() {
    checkAuthentication();
});

function checkAuthentication() {
    const currentUser = localStorage.getItem('currentUser');

    if (!currentUser) {
        showLoginPage();
    } else {
        financialData.currentUser = JSON.parse(currentUser);
        showMainApp();
        updateUIForUserRole();
    }
}

function showLoginPage() {
    document.getElementById('mainApp').style.display = 'none';
    document.getElementById('loginPage').style.display = 'flex';
}

function showMainApp() {
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('mainApp').style.display = 'block';

    // Update user info in header
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

    // Disable buttons for normal users
    const restrictedButtons = [
        'addExpenseBtn',
        'addIncomeBtn',
        'saveNotesBtn',
        'settingsBtn'
    ];

    restrictedButtons.forEach(btnId => {
        const btn = document.getElementById(btnId);
        if (btn) {
            if (!isAdmin) {
                btn.disabled = true;
                btn.style.opacity = '0.5';
                btn.style.cursor = 'not-allowed';
                btn.title = 'Apenas administradores podem realizar esta ação';
            } else {
                btn.disabled = false;
                btn.style.opacity = '1';
                btn.style.cursor = 'pointer';
                btn.title = '';
            }
        }
    });

    // Hide action buttons in tables for normal users
    if (!isAdmin) {
        const style = document.createElement('style');
        style.id = 'userRoleStyles';
        style.textContent = `
            .action-buttons { display: none !important; }
            .data-table th:last-child,
            .data-table td:last-child { display: none !important; }
        `;
        document.head.appendChild(style);
    } else {
        const existingStyle = document.getElementById('userRoleStyles');
        if (existingStyle) {
            existingStyle.remove();
        }
    }
}

function handleLogin(event) {
    event.preventDefault();

    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    // Find user
    const user = financialData.users.find(u =>
        u.username === username && u.password === password
    );

    if (user) {
        // Save to localStorage (without password)
        const userSession = {
            username: user.username,
            name: user.name,
            role: user.role
        };

        localStorage.setItem('currentUser', JSON.stringify(userSession));
        financialData.currentUser = userSession;

        showMainApp();
        updateUIForUserRole();
        showToast(`Bem-vindo, ${user.name}!`, 'success');

        // Reset form
        document.getElementById('loginForm').reset();
    } else {
        showToast('Usuário ou senha incorretos!', 'error');
    }
}

function logout() {
    if (confirm('Deseja realmente sair?')) {
        localStorage.removeItem('currentUser');
        financialData.currentUser = null;
        showLoginPage();
        showToast('Logout realizado com sucesso!', 'success');
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
