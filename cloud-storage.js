// Sistema de Armazenamento APENAS NA NUVEM
// Sem localStorage - tudo salvo direto no backend

// URL da API
const API_URL = window.APP_CONFIG?.API_URL || null;
const CLOUD_ENABLED = API_URL !== null && API_URL !== '';

// ID do usuário (carregado do sessionStorage ou definido após login)
let USER_ID = sessionStorage.getItem('user-id');

console.log('☁️ Sistema de armazenamento NA NUVEM ativado');
console.log('📡 API:', API_URL);
if (USER_ID) {
    console.log('👤 USER_ID carregado:', USER_ID);
} else {
    console.log('👤 USER_ID será definido após login');
}

// Objeto de armazenamento que usa APENAS a nuvem
const CloudStorage = {
    // Flag: indica se loadAll() foi chamado com sucesso (evita saveAll antes de carregar)
    _dataLoaded: false,

    // Carregar TODOS os dados da nuvem
    async loadAll() {
        const currentUserId = window.getUserId ? window.getUserId() : USER_ID;

        if (!currentUserId || !CLOUD_ENABLED) {
            console.error('❌ Cloud storage não configurado ou USER_ID não definido');
            return null;
        }

        try {
            console.log('📥 Carregando dados da nuvem...');
            const response = await fetch(`${API_URL}/api/sync/${currentUserId}`);

            if (!response.ok) {
                console.log('ℹ️ Nenhum dado na nuvem ainda (primeira vez)');
                this._dataLoaded = true;
                return this.createEmptyData();
            }

            const data = await response.json();
            console.log('✅ Dados carregados da nuvem');

            // Marcar que os dados foram carregados com sucesso
            this._dataLoaded = true;

            // Converter formato da API para formato do sistema
            return this.convertFromAPI(data);

        } catch (error) {
            console.error('❌ Erro ao carregar da nuvem:', error);
            this._dataLoaded = true;
            return this.createEmptyData();
        }
    },

    // Salvar TODOS os dados na nuvem
    async saveAll(financialData) {
        const currentUserId = window.getUserId ? window.getUserId() : USER_ID;

        if (!currentUserId || !CLOUD_ENABLED) {
            console.error('❌ Cloud storage não configurado ou USER_ID não definido');
            return false;
        }

        // Proteção: não salvar antes de carregar os dados da nuvem
        // Isso evita sobrescrever dados existentes com arrays vazios durante a inicialização
        if (!this._dataLoaded) {
            console.warn('⚠️ saveAll bloqueado: dados ainda não foram carregados da nuvem. Aguarde loadAll() completar.');
            return false;
        }

        try {
            console.log('📤 Salvando dados na nuvem...');

            // Converter formato do sistema para formato da API
            const dataToSend = this.convertToAPI(financialData, currentUserId);

            const response = await fetch(`${API_URL}/api/sync`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataToSend)
            });

            if (response.ok) {
                console.log('✅ Dados salvos na nuvem!');
                return true;
            } else {
                console.error('❌ Erro ao salvar na nuvem:', response.status);
                return false;
            }

        } catch (error) {
            console.error('❌ Erro ao salvar na nuvem:', error);
            return false;
        }
    },

    // Criar estrutura vazia
    createEmptyData() {
        const data = {
            months: ['JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO',
                     'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'],
            currentMonth: new Date().getMonth(),
            expenses: {},
            income: {},
            notes: {},
            categories: ['Alimentação', 'Carro', 'Transporte', 'Manutenção',
                        'Farmácia', 'Outros', 'Pets', 'Hotel', 'Escritório', 'Fornecedor'],
            suppliers: ['Amoedo', 'Carrefour', 'Detail Wash', 'Droga Raia', 'Hortfruti',
                       'Kalunga', 'Lave Bem', 'Outros', 'Pacheco', 'PetChic', 'Posto hum',
                       'Prezunic', 'RM água', 'Venancio', 'Zona Sul'],
            paymentMethods: ['Cartão de Crédito', 'Reembolso', 'Conta Corrente', 'Outros'],
            years: [2024, 2025, 2026],
            users: [
                {
                    username: 'admin',
                    password: 'admin',
                    name: 'Administrador',
                    role: 'admin'
                }
            ],
            currentUser: null
        };

        // Inicializar arrays
        for (let i = 0; i < 12; i++) {
            data.expenses[i] = [];
            data.income[i] = [];
            data.notes[i] = '';
        }

        return data;
    },

    // Converter formato da API para formato do sistema
    convertFromAPI(apiData) {
        const data = this.createEmptyData();

        // Converter despesas
        if (apiData.expenses && Array.isArray(apiData.expenses)) {
            apiData.expenses.forEach(exp => {
                data.expenses[exp.month] = exp.items || [];
            });
        }

        // Converter receitas
        if (apiData.income && Array.isArray(apiData.income)) {
            apiData.income.forEach(inc => {
                data.income[inc.month] = inc.items || [];
            });
        }

        // Converter notas
        if (apiData.notes && Array.isArray(apiData.notes)) {
            apiData.notes.forEach(note => {
                data.notes[note.month] = note.content || '';
            });
        }

        // Converter usuários
        if (apiData.systemUsers && Array.isArray(apiData.systemUsers)) {
            data.users = apiData.systemUsers;
        }

        // Converter frota
        if (apiData.fleet) {
            data.fleet = apiData.fleet;
        }

        return data;
    },

    // Converter formato do sistema para formato da API
    convertToAPI(financialData, userId) {
        const apiData = {
            userId: userId || (window.getUserId ? window.getUserId() : USER_ID),
            expenses: [],
            income: [],
            notes: [],
            systemUsers: financialData.users || [],
            fleet: financialData.fleet || { vehicles: [], updateDate: '' }
        };

        // Converter despesas
        for (let i = 0; i < 12; i++) {
            if (financialData.expenses[i] && financialData.expenses[i].length > 0) {
                apiData.expenses.push({
                    month: i,
                    year: new Date().getFullYear(),
                    items: financialData.expenses[i]
                });
            }
        }

        // Converter receitas
        for (let i = 0; i < 12; i++) {
            if (financialData.income[i] && financialData.income[i].length > 0) {
                apiData.income.push({
                    month: i,
                    year: new Date().getFullYear(),
                    items: financialData.income[i]
                });
            }
        }

        // Converter notas
        for (let i = 0; i < 12; i++) {
            if (financialData.notes[i]) {
                apiData.notes.push({
                    month: i,
                    year: new Date().getFullYear(),
                    content: financialData.notes[i]
                });
            }
        }

        return apiData;
    },

    // Deletar todos os dados
    async deleteAll() {
        const currentUserId = window.getUserId ? window.getUserId() : USER_ID;

        if (!currentUserId || !CLOUD_ENABLED) {
            console.error('❌ Cloud storage não configurado ou USER_ID não definido');
            return false;
        }

        try {
            console.log('🧹 Deletando todos os dados da nuvem...');
            const response = await fetch(`${API_URL}/api/sync/${currentUserId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                console.log('✅ Dados deletados da nuvem!');
                return true;
            } else {
                console.error('❌ Erro ao deletar da nuvem');
                return false;
            }
        } catch (error) {
            console.error('❌ Erro ao deletar:', error);
            return false;
        }
    }
};

// Função para definir USER_ID após login
window.setCloudUserId = function(userId) {
    USER_ID = userId;
    sessionStorage.setItem('user-id', userId);
    // Resetar flag de carregamento para novo usuário/sessão
    CloudStorage._dataLoaded = false;
    console.log('👤 USER_ID definido:', userId);
};

// Exportar para uso global
window.CloudStorage = CloudStorage;
window.getUserId = () => USER_ID;
window.API_URL = API_URL;

// Comando para deletar tudo
window.deleteAllCloudData = async function() {
    const confirmed = confirm(
        '⚠️ ATENÇÃO!\n\n' +
        'Deletar TODOS os dados da nuvem?\n\n' +
        'Isso é IRREVERSÍVEL!'
    );

    if (confirmed) {
        await CloudStorage.deleteAll();
        sessionStorage.removeItem('user-id');
        window.location.reload();
    }
};

console.log('✅ CloudStorage pronto!');
console.log('💡 Use: CloudStorage.loadAll() e CloudStorage.saveAll(data)');
