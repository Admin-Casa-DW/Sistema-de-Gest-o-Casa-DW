// Sistema de Sincronização com Banco de Dados Real
// Substitui localStorage por API REST com MongoDB

// URL da API (configurada automaticamente via config.js)
const API_URL = window.APP_CONFIG?.API_URL || null;

// Verificar se API está configurada
const SYNC_ENABLED = API_URL !== null && API_URL !== '';

// ID do usuário (pode ser email, CPF, ou qualquer identificador único)
let USER_ID = localStorage.getItem('user-id');

// Se não tem ID, solicitar
if (!USER_ID) {
    USER_ID = prompt('Digite seu email ou CPF para identificar seus dados:');
    if (USER_ID) {
        localStorage.setItem('user-id', USER_ID);
    }
}

// Log de status
if (SYNC_ENABLED) {
    console.log('🌐 Modo ONLINE - Sincronização com nuvem ativada');
    console.log('📡 API:', API_URL);
} else {
    console.log('📱 Modo OFFLINE - Dados salvos apenas localmente');
    console.log('ℹ️ Para ativar sincronização, hospede o backend e configure a URL');
}

// ============== WRAPPER PARA localStorage ==============
// Intercepta todas as chamadas ao localStorage e sincroniza com API

const RealStorage = {
    // Armazenar dados localmente E na nuvem
    async setItem(key, value) {
        // Salvar localmente primeiro (para não travar a interface)
        localStorage.setItem(key, value);

        // Sincronizar com nuvem em background
        await this.syncToCloud(key, value);
    },

    // Obter dados (da nuvem se disponível, senão local)
    async getItem(key) {
        // Tentar obter da nuvem primeiro
        try {
            const cloudData = await this.getFromCloud(key);
            if (cloudData !== null) {
                // Atualizar cache local
                localStorage.setItem(key, cloudData);
                return cloudData;
            }
        } catch (error) {
            console.warn('Erro ao buscar da nuvem, usando cache local:', error);
        }

        // Fallback para localStorage
        return localStorage.getItem(key);
    },

    // Sincronizar chave específica com nuvem
    async syncToCloud(key, value) {
        if (!USER_ID || !SYNC_ENABLED) return;

        try {
            // Determinar tipo de dado baseado na chave
            if (key.startsWith('expenses_')) {
                const month = parseInt(key.split('_')[1]);
                const year = new Date().getFullYear();
                const items = JSON.parse(value);

                await fetch(`${API_URL}/api/expenses`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: USER_ID, month, year, items })
                });

            } else if (key.startsWith('income_')) {
                const month = parseInt(key.split('_')[1]);
                const year = new Date().getFullYear();
                const items = JSON.parse(value);

                await fetch(`${API_URL}/api/income`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: USER_ID, month, year, items })
                });

            } else if (key === 'fleetData') {
                const vehicles = JSON.parse(value);

                await fetch(`${API_URL}/api/fleet`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: USER_ID, vehicles })
                });

            } else if (key.startsWith('notes_')) {
                const month = parseInt(key.split('_')[1]);
                const year = new Date().getFullYear();
                const content = value;

                await fetch(`${API_URL}/api/notes`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: USER_ID, month, year, content })
                });
            }

            console.log('✅ Sincronizado com nuvem:', key);

        } catch (error) {
            console.error('❌ Erro ao sincronizar:', error);
        }
    },

    // Obter dados da nuvem
    async getFromCloud(key) {
        if (!USER_ID) return null;

        try {
            let response;

            if (key.startsWith('expenses_')) {
                const month = parseInt(key.split('_')[1]);
                const year = new Date().getFullYear();
                response = await fetch(`${API_URL}/api/expenses/${USER_ID}/${month}/${year}`);

                if (response.ok) {
                    const data = await response.json();
                    return JSON.stringify(data.items || []);
                }

            } else if (key.startsWith('income_')) {
                const month = parseInt(key.split('_')[1]);
                const year = new Date().getFullYear();
                response = await fetch(`${API_URL}/api/income/${USER_ID}/${month}/${year}`);

                if (response.ok) {
                    const data = await response.json();
                    return JSON.stringify(data.items || []);
                }

            } else if (key === 'fleetData') {
                response = await fetch(`${API_URL}/api/fleet/${USER_ID}`);

                if (response.ok) {
                    const data = await response.json();
                    return JSON.stringify(data.vehicles || []);
                }

            } else if (key.startsWith('notes_')) {
                const month = parseInt(key.split('_')[1]);
                const year = new Date().getFullYear();
                response = await fetch(`${API_URL}/api/notes/${USER_ID}/${month}/${year}`);

                if (response.ok) {
                    const data = await response.json();
                    return data.content || '';
                }
            }

        } catch (error) {
            console.error('❌ Erro ao buscar da nuvem:', error);
        }

        return null;
    },

    // Sincronização completa inicial - MELHORADA
    async initialSync() {
        if (!USER_ID || !SYNC_ENABLED) {
            console.log('ℹ️ Sincronização desabilitada - usando apenas localStorage');
            return;
        }

        console.log('🔄 Iniciando sincronização completa...');

        try {
            // PASSO 1: Buscar dados da nuvem
            const response = await fetch(`${API_URL}/api/sync/${USER_ID}`);

            if (!response.ok) {
                console.warn('⚠️ Nenhum dado na nuvem ainda - enviando dados locais...');
                // Se não há dados na nuvem, enviar os dados locais primeiro
                await this.syncAllToCloud();
                return;
            }

            const cloudData = await response.json();
            console.log('☁️ Dados recebidos da nuvem:', cloudData);

            // PASSO 2: Verificar se há dados locais em financialData
            let hasLocalData = false;
            const localFinancialData = originalLocalStorage.getItem('financialData');

            if (localFinancialData) {
                try {
                    const parsed = JSON.parse(localFinancialData);
                    // Verificar se tem alguma despesa ou receita
                    for (let i = 0; i < 12; i++) {
                        if ((parsed.expenses && parsed.expenses[i] && parsed.expenses[i].length > 0) ||
                            (parsed.income && parsed.income[i] && parsed.income[i].length > 0)) {
                            hasLocalData = true;
                            break;
                        }
                    }
                    console.log('💾 Dados locais encontrados:', hasLocalData);
                } catch (e) {
                    console.warn('⚠️ Erro ao verificar dados locais:', e);
                }
            }

            // PASSO 3: Decidir estratégia
            const cloudHasData = (cloudData.expenses && cloudData.expenses.length > 0) ||
                                (cloudData.income && cloudData.income.length > 0);

            if (hasLocalData && !cloudHasData) {
                // Caso 1: Tem dados locais mas nuvem está vazia → ENVIAR para nuvem
                console.log('📤 Enviando dados locais para nuvem...');
                await this.syncAllToCloud();

            } else if (!hasLocalData && cloudHasData) {
                // Caso 2: Não tem dados locais mas nuvem tem → BAIXAR da nuvem
                console.log('📥 Baixando dados da nuvem...');
                await this.downloadFromCloud(cloudData);

            } else if (hasLocalData && cloudHasData) {
                // Caso 3: Ambos têm dados → NÃO MESCLAR AUTOMATICAMENTE!
                console.log('⚠️ CONFLITO: Dados locais E na nuvem!');
                console.log('💡 Use forceSyncFromCloud() para baixar da nuvem');
                console.log('💡 OU use Sincronizar para enviar dados locais');
                // NÃO fazer nada automaticamente para evitar conflitos
                return;

            } else {
                // Caso 4: Nenhum tem dados → OK
                console.log('ℹ️ Nenhum dado local ou na nuvem');
            }

            console.log('✅ Sincronização inicial completa!');

        } catch (error) {
            console.error('❌ Erro na sincronização inicial:', error);
            showToast('Erro ao sincronizar. Usando dados locais.', 'error');
        }
    },

    // Baixar dados da nuvem para localStorage (LIMPAR TUDO ANTES)
    async downloadFromCloud(cloudData, forceClean = false) {
        console.log('📥 Iniciando download de dados da nuvem...');
        console.log('☁️ Dados recebidos:', {
            despesas: cloudData.expenses?.length || 0,
            receitas: cloudData.income?.length || 0,
            veículos: cloudData.fleet?.vehicles?.length || 0,
            notas: cloudData.notes?.length || 0,
            usuários: cloudData.systemUsers?.length || 0
        });

        // Se forceClean = true, criar estrutura limpa
        // Senão, mesclar com dados existentes
        let financialData;
        const existingData = originalLocalStorage.getItem('financialData');

        if (forceClean || !existingData) {
            console.log('🧹 Criando estrutura limpa (sem mesclar dados antigos)');
            financialData = null; // Vai criar novo abaixo
        } else {
            financialData = JSON.parse(existingData);
            console.log('📦 financialData existente carregado (vai mesclar)');
        }

        if (!financialData) {
            // Estrutura padrão do financialData
            financialData = {
                months: ['JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO',
                         'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'],
                currentMonth: 0,
                expenses: {},
                income: {},
                notes: {},
                categories: ['Alimentação', 'Carro', 'Transporte', 'Manutenção',
                            'Farmácia', 'Outros', 'Pets', 'Hotel', 'Escritório', 'Fornecedor'],
                suppliers: ['Amoedo', 'Carrefour', 'Detail Wash', 'Droga Raia', 'Hortfruti',
                           'Kalunga', 'Lave Bem', 'Outros', 'Pacheco', 'PetChic', 'Posto hum',
                           'Prezunic', 'RM água', 'Venancio', 'Zona Sul'],
                paymentMethods: ['Cartão de Crédito', 'Reembolso', 'Conta Corrente', 'Outros'],
                years: [2024, 2025, 2026]
            };
            console.log('📦 financialData novo criado');
        }

        // Inicializar arrays dos meses
        for (let i = 0; i < 12; i++) {
            if (!financialData.expenses[i]) financialData.expenses[i] = [];
            if (!financialData.income[i]) financialData.income[i] = [];
            if (!financialData.notes[i]) financialData.notes[i] = '';
        }

        // Atualizar com dados da nuvem
        if (cloudData.expenses && cloudData.expenses.length > 0) {
            console.log('💾 Salvando despesas no financialData...');
            cloudData.expenses.forEach(exp => {
                financialData.expenses[exp.month] = exp.items;
                console.log(`✅ Carregado despesas do mês ${exp.month}: ${exp.items.length} itens`);
            });
        } else {
            console.log('⚠️ Nenhuma despesa na nuvem');
        }

        if (cloudData.income && cloudData.income.length > 0) {
            console.log('💾 Salvando receitas no financialData...');
            cloudData.income.forEach(inc => {
                financialData.income[inc.month] = inc.items;
                console.log(`✅ Carregado receitas do mês ${inc.month}: ${inc.items.length} itens`);
            });
        } else {
            console.log('⚠️ Nenhuma receita na nuvem');
        }

        if (cloudData.notes && cloudData.notes.length > 0) {
            console.log('💾 Salvando notas no financialData...');
            cloudData.notes.forEach(note => {
                financialData.notes[note.month] = note.content;
                console.log(`✅ Carregado nota do mês ${note.month}`);
            });
        } else {
            console.log('⚠️ Nenhuma nota na nuvem');
        }

        // Salvar usuários do sistema
        if (cloudData.systemUsers && cloudData.systemUsers.length > 0) {
            console.log('💾 Salvando usuários do sistema...');
            financialData.users = cloudData.systemUsers;
            console.log(`✅ Carregado ${cloudData.systemUsers.length} usuários`);
        } else {
            console.log('⚠️ Nenhum usuário na nuvem');
        }

        // Salvar de volta no localStorage
        originalLocalStorage.setItem('financialData', JSON.stringify(financialData));
        console.log('💾 financialData salvo no localStorage');

        // Frota continua separada
        if (cloudData.fleet && cloudData.fleet.vehicles && cloudData.fleet.vehicles.length > 0) {
            originalLocalStorage.setItem('fleetData', JSON.stringify(cloudData.fleet.vehicles));
            console.log(`✅ Carregado: frota (${cloudData.fleet.vehicles.length} veículos)`);
        } else {
            console.log('⚠️ Nenhum veículo na nuvem');
        }

        console.log('✅ Download completo!');
    },

    // FORÇAR download limpo da nuvem (substituir tudo)
    async forceDownloadFromCloud() {
        if (!USER_ID || !SYNC_ENABLED) {
            console.warn('⚠️ Sincronização desabilitada');
            return;
        }

        console.log('🧹 FORÇANDO download limpo da nuvem...');
        console.log('⚠️ Todos os dados locais serão SUBSTITUÍDOS!');

        try {
            // Buscar dados da nuvem
            const response = await fetch(`${API_URL}/api/sync/${USER_ID}`);

            if (!response.ok) {
                console.error('❌ Nenhum dado na nuvem para baixar');
                showToast('Nenhum dado na nuvem', 'error');
                return;
            }

            const cloudData = await response.json();
            console.log('☁️ Dados da nuvem:', cloudData);

            // LIMPAR TUDO primeiro
            console.log('🧹 Limpando dados locais...');
            originalLocalStorage.removeItem('financialData');
            originalLocalStorage.removeItem('fleetData');

            // Baixar dados da nuvem (modo limpo)
            await this.downloadFromCloud(cloudData, true);

            console.log('✅ Download limpo completo!');
            showToast('Dados sincronizados da nuvem!', 'success');

            // Recarregar página
            setTimeout(() => {
                window.location.reload();
            }, 1500);

        } catch (error) {
            console.error('❌ Erro ao forçar download:', error);
            showToast('Erro ao baixar dados da nuvem', 'error');
        }
    },

    // Enviar todos os dados locais para nuvem
    async syncAllToCloud() {
        if (!USER_ID || !SYNC_ENABLED) return;

        console.log('📤 Enviando todos os dados para nuvem...');
        console.log('👤 Usuário:', USER_ID);

        try {
            const dataToSync = {
                userId: USER_ID,
                expenses: [],
                income: [],
                fleet: { vehicles: [] },
                notes: [],
                systemUsers: []
            };

            // O sistema usa 'financialData' como chave única!
            const financialDataStr = originalLocalStorage.getItem('financialData');

            if (!financialDataStr) {
                console.warn('⚠️ Nenhum dado encontrado em financialData');
                return;
            }

            const financialData = JSON.parse(financialDataStr);
            console.log('📦 financialData carregado:', {
                hasExpenses: !!financialData.expenses,
                hasIncome: !!financialData.income,
                hasNotes: !!financialData.notes
            });

            // Coletar despesas do objeto financialData
            if (financialData.expenses) {
                for (let i = 0; i < 12; i++) {
                    const monthExpenses = financialData.expenses[i];
                    if (monthExpenses && monthExpenses.length > 0) {
                        dataToSync.expenses.push({
                            month: i,
                            year: new Date().getFullYear(),
                            items: monthExpenses
                        });
                        console.log(`📦 Coletado despesas do mês ${i}: ${monthExpenses.length} itens`);
                    }
                }
            }

            // Coletar receitas
            if (financialData.income) {
                for (let i = 0; i < 12; i++) {
                    const monthIncome = financialData.income[i];
                    if (monthIncome && monthIncome.length > 0) {
                        dataToSync.income.push({
                            month: i,
                            year: new Date().getFullYear(),
                            items: monthIncome
                        });
                        console.log(`📦 Coletado receitas do mês ${i}: ${monthIncome.length} itens`);
                    }
                }
            }

            // Coletar frota
            const fleetData = originalLocalStorage.getItem('fleetData');
            if (fleetData) {
                dataToSync.fleet.vehicles = JSON.parse(fleetData);
                console.log(`📦 Coletado frota: ${dataToSync.fleet.vehicles.length} veículos`);
            }

            // Coletar notas
            if (financialData.notes) {
                for (let i = 0; i < 12; i++) {
                    const monthNote = financialData.notes[i];
                    if (monthNote) {
                        dataToSync.notes.push({
                            month: i,
                            year: new Date().getFullYear(),
                            content: monthNote
                        });
                        console.log(`📦 Coletado nota do mês ${i}`);
                    }
                }
            }

            // Coletar usuários do sistema
            if (financialData.users && Array.isArray(financialData.users)) {
                dataToSync.systemUsers = financialData.users;
                console.log(`📦 Coletado ${financialData.users.length} usuários do sistema`);
            }

            console.log('📊 Total coletado:', {
                despesas: dataToSync.expenses.length + ' meses',
                receitas: dataToSync.income.length + ' meses',
                veículos: dataToSync.fleet.vehicles.length,
                notas: dataToSync.notes.length + ' meses',
                usuários: dataToSync.systemUsers.length
            });

            // Enviar para API
            console.log('🌐 Enviando para:', `${API_URL}/api/sync`);
            console.log('📦 Dados a enviar:', JSON.stringify(dataToSync).substring(0, 200) + '...');

            const response = await fetch(`${API_URL}/api/sync`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataToSync)
            });

            console.log('📡 Status da resposta:', response.status);

            if (response.ok) {
                const result = await response.json();
                console.log('✅ Todos os dados enviados para nuvem!');
                console.log('📊 Resposta do servidor:', result);
                showToast('Dados salvos na nuvem!', 'success');
            } else {
                const errorText = await response.text();
                console.error('❌ Erro ao enviar dados:', response.status, errorText);
                showToast('Erro ao enviar dados para nuvem', 'error');
            }

        } catch (error) {
            console.error('❌ Erro ao sincronizar todos os dados:', error);
            showToast('Erro de conexão com servidor', 'error');
        }
    }
};

// ============== SUBSTITUIR localStorage ==============

// Salvar referência ao localStorage original
const originalLocalStorage = {
    setItem: localStorage.setItem.bind(localStorage),
    getItem: localStorage.getItem.bind(localStorage)
};

// Substituir localStorage.setItem para sincronizar automaticamente
localStorage.setItem = function(key, value) {
    // Salvar localmente
    originalLocalStorage.setItem(key, value);

    // Sincronizar com nuvem (se for chave relevante)
    if (key.startsWith('expenses_') || key.startsWith('income_') ||
        key === 'fleetData' || key.startsWith('notes_')) {

        console.log('📝 Salvando na nuvem:', key);
        RealStorage.syncToCloud(key, value);
    }
};

// ============== INICIALIZAÇÃO ==============

// SINCRONIZAÇÃO INICIAL DESATIVADA
// Motivo: Estava mesclando dados automaticamente e causando conflitos
// Agora só sincroniza quando você clicar no botão "Sincronizar"

// Flag para garantir que a sincronização inicial só roda uma vez
let initialSyncDone = false;

// Sincronização inicial automática DESATIVADA
// window.addEventListener('load', async () => {
//     if (USER_ID && SYNC_ENABLED && !initialSyncDone) {
//         initialSyncDone = true;
//         console.log('🚀 Iniciando sincronização com banco de dados...');
//         console.log('👤 Usuário:', USER_ID);
//         setTimeout(() => {
//             RealStorage.initialSync();
//         }, 1000);
//     }
// });

console.log('💡 Sincronização inicial DESATIVADA - use botão manual');

// SINCRONIZAÇÃO AUTOMÁTICA DESATIVADA
// Motivo: Estava causando conflitos com dados deletados
// Use o botão "Sincronizar" manualmente quando necessário

// Sincronizar ao fechar/sair da página (DESATIVADO)
// window.addEventListener('beforeunload', () => {
//     RealStorage.syncAllToCloud();
// });

// Sincronização periódica DESATIVADA
// setInterval(() => {
//     if (USER_ID && navigator.onLine) {
//         console.log('🔄 Sincronização automática...');
//         RealStorage.syncAllToCloud();
//     }
// }, 30000);

console.log('⚠️ Sincronização automática DESATIVADA');
console.log('💡 Use o botão "Sincronizar" manualmente para enviar/receber dados');

// Mostrar status de conexão
const showConnectionStatus = () => {
    const indicator = document.createElement('div');
    indicator.id = 'connection-indicator';
    indicator.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: white;
        padding: 10px 15px;
        border-radius: 25px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
        z-index: 9999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-weight: 500;
    `;

    const updateStatus = () => {
        const isOnline = navigator.onLine;
        indicator.innerHTML = `
            <div style="width:10px;height:10px;border-radius:50%;background:${isOnline ? '#10b981' : '#ef4444'};"></div>
            <span>${isOnline ? '🌐 Online' : '📡 Offline'}</span>
        `;
    };

    updateStatus();
    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);

    document.body.appendChild(indicator);
};

// Mostrar indicador após carregar
setTimeout(showConnectionStatus, 2000);

// Exportar para uso global
window.RealStorage = RealStorage;
window.USER_ID = USER_ID;

// Função global para forçar sincronização limpa (uso via console)
window.forceSyncFromCloud = async function() {
    console.log('🔄 Forçando sincronização limpa da nuvem...');
    await RealStorage.forceDownloadFromCloud();
};

// Função global para DELETAR TUDO (backend + localStorage)
window.deleteAllData = async function() {
    const confirmed = confirm(
        '⚠️⚠️⚠️ ATENÇÃO EXTREMA! ⚠️⚠️⚠️\n\n' +
        'Esta ação vai DELETAR PERMANENTEMENTE:\n' +
        '- Todos os dados do BACKEND (nuvem)\n' +
        '- Todos os dados LOCAIS (localStorage)\n\n' +
        'Isso é IRREVERSÍVEL!\n\n' +
        'Tem CERTEZA ABSOLUTA que deseja continuar?'
    );

    if (!confirmed) {
        console.log('❌ Operação cancelada');
        return;
    }

    try {
        console.log('🧹 Deletando TODOS os dados...');

        // 1. Deletar do backend
        if (USER_ID && SYNC_ENABLED) {
            console.log('🌐 Deletando dados do backend...');
            const response = await fetch(`${API_URL}/api/sync/${USER_ID}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                const result = await response.json();
                console.log('✅ Backend limpo:', result.message);
            } else {
                console.warn('⚠️ Erro ao deletar do backend:', response.status);
            }
        }

        // 2. Limpar localStorage
        console.log('💾 Limpando localStorage...');
        originalLocalStorage.removeItem('financialData');
        originalLocalStorage.removeItem('fleetData');
        originalLocalStorage.removeItem('user-id');

        console.log('✅ TUDO DELETADO! Recarregando página...');
        showToast('Todos os dados foram deletados!', 'success');

        setTimeout(() => {
            window.location.reload();
        }, 1500);

    } catch (error) {
        console.error('❌ Erro ao deletar dados:', error);
        showToast('Erro ao deletar: ' + error.message, 'error');
    }
};

console.log('✅ Sistema de sincronização com banco de dados ativado!');
console.log('💡 Comandos disponíveis no console:');
console.log('   - forceSyncFromCloud() = Baixar dados da nuvem (limpar local)');
console.log('   - deleteAllData() = DELETAR TUDO (backend + local)');
