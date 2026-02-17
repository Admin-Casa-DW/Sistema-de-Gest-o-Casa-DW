// Settings/Parameters Management

function openSettingsModal() {
    if (!checkAdminPermission()) return;
    const modal = document.getElementById('settingsModal');
    modal.style.display = 'block';
    renderAllParameters();
}

function closeSettingsModal() {
    document.getElementById('settingsModal').style.display = 'none';
}

// Tab Management
function setupSettingsTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');

            // Remove active from all tabs and contents
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

            // Add active to clicked tab and corresponding content
            this.classList.add('active');
            document.getElementById(tabName + '-tab').classList.add('active');
        });
    });
}

// Render Parameters
function renderAllParameters() {
    renderCategories();
    renderSuppliers();
    renderPaymentMethods();
    renderYears();
    renderUsers();
}

function renderCategories() {
    const container = document.getElementById('categoriesList');
    if (financialData.categories.length === 0) {
        container.innerHTML = '<div class="empty-params">Nenhuma categoria cadastrada</div>';
        return;
    }

    container.innerHTML = financialData.categories.map((category, index) => `
        <div class="param-item" id="category-${index}">
            <span class="param-name">${category}</span>
            <div class="param-actions">
                <button class="btn-icon edit" onclick="editParameter('category', ${index})" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon delete" onclick="deleteParameter('category', ${index})" title="Excluir">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function renderSuppliers() {
    const container = document.getElementById('suppliersList');
    if (financialData.suppliers.length === 0) {
        container.innerHTML = '<div class="empty-params">Nenhum fornecedor cadastrado</div>';
        return;
    }

    container.innerHTML = financialData.suppliers.map((supplier, index) => `
        <div class="param-item" id="supplier-${index}">
            <span class="param-name">${supplier}</span>
            <div class="param-actions">
                <button class="btn-icon edit" onclick="editParameter('supplier', ${index})" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon delete" onclick="deleteParameter('supplier', ${index})" title="Excluir">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function renderPaymentMethods() {
    const container = document.getElementById('paymentsList');
    if (financialData.paymentMethods.length === 0) {
        container.innerHTML = '<div class="empty-params">Nenhuma forma de pagamento cadastrada</div>';
        return;
    }

    container.innerHTML = financialData.paymentMethods.map((payment, index) => `
        <div class="param-item" id="payment-${index}">
            <span class="param-name">${payment}</span>
            <div class="param-actions">
                <button class="btn-icon edit" onclick="editParameter('payment', ${index})" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon delete" onclick="deleteParameter('payment', ${index})" title="Excluir">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function renderYears() {
    const container = document.getElementById('yearsList');
    if (financialData.years.length === 0) {
        container.innerHTML = '<div class="empty-params">Nenhum ano cadastrado</div>';
        return;
    }

    container.innerHTML = financialData.years.sort((a, b) => a - b).map((year, index) => {
        const yearIndex = financialData.years.indexOf(year);
        return `
        <div class="param-item" id="year-${yearIndex}">
            <span class="param-name">${year}</span>
            <div class="param-actions">
                <button class="btn-icon edit" onclick="editParameter('year', ${yearIndex})" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon delete" onclick="deleteParameter('year', ${yearIndex})" title="Excluir">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `}).join('');
}

function renderUsers() {
    const container = document.getElementById('usersList');
    if (!financialData.users || financialData.users.length === 0) {
        container.innerHTML = '<div class="empty-params">Nenhum usuário cadastrado</div>';
        return;
    }

    container.innerHTML = financialData.users.map((user, index) => `
        <div class="param-item user-item" id="user-${index}">
            <div class="user-details">
                <span class="param-name">
                    <i class="fas fa-user-circle" style="margin-right: 8px; color: var(--primary);"></i>
                    ${user.name}
                </span>
                <div class="user-meta">
                    <span class="user-username">@${user.username}</span>
                    <span class="user-badge ${user.role === 'admin' ? 'badge-admin' : 'badge-normal'}">
                        ${user.role === 'admin' ? 'Administrador' : 'Normal'}
                    </span>
                </div>
            </div>
            <div class="param-actions">
                <button class="btn-icon edit" onclick="editUser(${index})" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon delete" onclick="deleteUser(${index})" title="Excluir" ${user.username === 'admin' ? 'disabled style="opacity: 0.3; cursor: not-allowed;"' : ''}>
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// Add New Parameter
function addNewParameter(paramType) {
    if (!checkAdminPermission()) return;
    const value = prompt('Digite o nome ' + (paramType === 'category' ? 'da categoria' : paramType === 'supplier' ? 'do fornecedor' : paramType === 'payment' ? 'da forma de pagamento' : 'do ano') + ':');

    if (!value || value.trim() === '') return;

    const trimmedValue = paramType === 'year' ? parseInt(value.trim()) : value.trim();

    switch(paramType) {
        case 'category':
            if (financialData.categories.includes(trimmedValue)) {
                alert('Esta categoria já existe!');
                return;
            }
            financialData.categories.push(trimmedValue);
            renderCategories();
            break;
        case 'supplier':
            if (financialData.suppliers.includes(trimmedValue)) {
                alert('Este fornecedor já existe!');
                return;
            }
            financialData.suppliers.push(trimmedValue);
            renderSuppliers();
            break;
        case 'payment':
            if (financialData.paymentMethods.includes(trimmedValue)) {
                alert('Esta forma de pagamento já existe!');
                return;
            }
            financialData.paymentMethods.push(trimmedValue);
            renderPaymentMethods();
            break;
        case 'year':
            if (isNaN(trimmedValue)) {
                alert('Por favor, digite um ano válido!');
                return;
            }
            if (financialData.years.includes(trimmedValue)) {
                alert('Este ano já existe!');
                return;
            }
            financialData.years.push(trimmedValue);
            renderYears();
            break;
    }

    saveToLocalStorage();
    populateSelects();
    showToast('Item adicionado com sucesso!', 'success');
}

// Edit Parameter
function editParameter(paramType, index) {
    if (!checkAdminPermission()) return;
    let currentValue;
    let arrayName;

    switch(paramType) {
        case 'category':
            arrayName = 'categories';
            currentValue = financialData.categories[index];
            break;
        case 'supplier':
            arrayName = 'suppliers';
            currentValue = financialData.suppliers[index];
            break;
        case 'payment':
            arrayName = 'paymentMethods';
            currentValue = financialData.paymentMethods[index];
            break;
        case 'year':
            arrayName = 'years';
            currentValue = financialData.years[index];
            break;
    }

    const newValue = prompt('Editar ' + (paramType === 'category' ? 'categoria' : paramType === 'supplier' ? 'fornecedor' : paramType === 'payment' ? 'forma de pagamento' : 'ano') + ':', currentValue);

    if (!newValue || newValue.trim() === '' || newValue === currentValue.toString()) return;

    const trimmedValue = paramType === 'year' ? parseInt(newValue.trim()) : newValue.trim();

    if (paramType === 'year' && isNaN(trimmedValue)) {
        alert('Por favor, digite um ano válido!');
        return;
    }

    financialData[arrayName][index] = trimmedValue;

    saveToLocalStorage();
    renderAllParameters();
    populateSelects();
    showToast('Item editado com sucesso!', 'success');
}

// Delete Parameter
function deleteParameter(paramType, index) {
    if (!checkAdminPermission()) return;
    let arrayName;
    let itemName;

    switch(paramType) {
        case 'category':
            arrayName = 'categories';
            itemName = financialData.categories[index];
            break;
        case 'supplier':
            arrayName = 'suppliers';
            itemName = financialData.suppliers[index];
            break;
        case 'payment':
            arrayName = 'paymentMethods';
            itemName = financialData.paymentMethods[index];
            break;
        case 'year':
            arrayName = 'years';
            itemName = financialData.years[index];
            break;
    }

    if (!confirm('Tem certeza que deseja excluir "' + itemName + '"?')) return;

    financialData[arrayName].splice(index, 1);

    saveToLocalStorage();
    renderAllParameters();
    populateSelects();
    showToast('Item excluído com sucesso!', 'success');
}

// User Management Functions
function openAddUserModal() {
    if (!checkAdminPermission()) return;
    const modal = document.getElementById('userModal');
    const form = document.getElementById('userForm');
    const title = document.getElementById('userModalTitle');

    form.reset();
    delete form.dataset.editIndex;
    title.innerHTML = '<i class="fas fa-user-plus"></i> Novo Usuário';
    modal.style.display = 'block';
}

function editUser(index) {
    if (!checkAdminPermission()) return;
    const user = financialData.users[index];
    const modal = document.getElementById('userModal');
    const form = document.getElementById('userForm');
    const title = document.getElementById('userModalTitle');

    title.innerHTML = '<i class="fas fa-user-edit"></i> Editar Usuário';
    document.getElementById('userName').value = user.name;
    document.getElementById('userUsername').value = user.username;
    document.getElementById('userPassword').value = user.password;
    document.getElementById('userRole').value = user.role;
    form.dataset.editIndex = index;

    modal.style.display = 'block';
}

function deleteUser(index) {
    if (!checkAdminPermission()) return;
    const user = financialData.users[index];

    // Prevent deletion of default admin user
    if (user.username === 'admin') {
        alert('O usuário administrador padrão não pode ser excluído!');
        return;
    }

    if (!confirm(`Tem certeza que deseja excluir o usuário "${user.name}"?`)) return;

    financialData.users.splice(index, 1);
    saveToLocalStorage();
    renderUsers();
    showToast('Usuário excluído com sucesso!', 'success');
}

function handleUserSubmit(e) {
    e.preventDefault();

    const form = e.target;
    const isEditing = form.dataset.editIndex !== undefined;

    const user = {
        name: document.getElementById('userName').value.trim(),
        username: document.getElementById('userUsername').value.trim().toLowerCase(),
        password: document.getElementById('userPassword').value,
        role: document.getElementById('userRole').value
    };

    // Validate username uniqueness (except when editing the same user)
    const existingUserIndex = financialData.users.findIndex(u => u.username === user.username);
    if (existingUserIndex !== -1 && (!isEditing || parseInt(form.dataset.editIndex) !== existingUserIndex)) {
        alert('Este nome de usuário já está em uso!');
        return;
    }

    if (isEditing) {
        const index = parseInt(form.dataset.editIndex);
        const oldUser = financialData.users[index];

        // Prevent changing admin username
        if (oldUser.username === 'admin' && user.username !== 'admin') {
            alert('O nome de usuário do administrador padrão não pode ser alterado!');
            return;
        }

        financialData.users[index] = user;
        showToast('Usuário atualizado com sucesso!', 'success');

        // Update current user session if editing logged in user
        if (financialData.currentUser && financialData.currentUser.username === oldUser.username) {
            const userSession = {
                username: user.username,
                name: user.name,
                role: user.role
            };
            localStorage.setItem('currentUser', JSON.stringify(userSession));
            financialData.currentUser = userSession;
            updateUIForUserRole();

            // Update header user info
            const userInfo = document.getElementById('userInfo');
            if (userInfo) {
                userInfo.innerHTML = `
                    <span class="user-name">
                        <i class="fas fa-user-circle"></i> ${user.name}
                        <span class="user-role">(${user.role === 'admin' ? 'Admin' : 'Visualização'})</span>
                    </span>
                    <button class="btn btn-secondary btn-sm" onclick="logout()">
                        <i class="fas fa-sign-out-alt"></i> Sair
                    </button>
                `;
            }
        }
    } else {
        financialData.users.push(user);
        showToast('Usuário criado com sucesso!', 'success');
    }

    saveToLocalStorage();
    renderUsers();
    document.getElementById('userModal').style.display = 'none';
    form.reset();
}

// Initialize Settings
document.addEventListener('DOMContentLoaded', function() {
    const settingsBtn = document.getElementById('settingsBtn');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', openSettingsModal);
    }

    setupSettingsTabs();

    // User Modal
    const userForm = document.getElementById('userForm');
    if (userForm) {
        userForm.addEventListener('submit', handleUserSubmit);
    }

    const cancelUserBtn = document.getElementById('cancelUser');
    if (cancelUserBtn) {
        cancelUserBtn.addEventListener('click', function() {
            document.getElementById('userModal').style.display = 'none';
        });
    }

    // Close user modal when clicking X
    const userModal = document.getElementById('userModal');
    if (userModal) {
        const closeBtn = userModal.querySelector('.close');
        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                userModal.style.display = 'none';
            });
        }

        window.addEventListener('click', function(e) {
            if (e.target === userModal) {
                userModal.style.display = 'none';
            }
        });
    }

    // Close settings modal when clicking X or outside
    const settingsModal = document.getElementById('settingsModal');
    if (settingsModal) {
        const closeBtn = settingsModal.querySelector('.close');
        if (closeBtn) {
            closeBtn.addEventListener('click', closeSettingsModal);
        }

        window.addEventListener('click', function(e) {
            if (e.target === settingsModal) {
                closeSettingsModal();
            }
        });
    }
});
