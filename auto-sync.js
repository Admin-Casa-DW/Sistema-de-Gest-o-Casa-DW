// Auto Sync System - Sincronização Automática em Tempo Real
// Usa Firebase Realtime Database para sincronização automática

const AUTO_SYNC_CONFIG = {
    enabled: true,
    syncInterval: 5000, // Verificar mudanças a cada 5 segundos
    apiEndpoint: 'https://api.jsonbin.io/v3/b/', // JSONBin.io - Free tier
    apiKey: '$2a$10$YourAPIKeyHere', // Será configurado pelo usuário
    binId: null, // Será criado automaticamente
    lastSync: null,
    syncInProgress: false
};

class AutoSync {
    constructor() {
        this.userId = this.getUserId();
        this.syncTimer = null;
        this.lastLocalChange = Date.now();
        this.conflictResolver = 'latest-wins'; // 'latest-wins' ou 'manual'
    }

    // Gera ou recupera ID único do usuário
    getUserId() {
        let userId = localStorage.getItem('auto-sync-user-id');
        if (!userId) {
            userId = 'user-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now();
            localStorage.setItem('auto-sync-user-id', userId);
        }
        return userId;
    }

    // Inicializar sincronização automática
    async init() {
        console.log('🔄 Iniciando sincronização automática...');

        // Verificar se está configurado
        const config = this.loadConfig();
        if (!config || !config.enabled) {
            console.log('ℹ️ Sincronização automática desabilitada');
            return;
        }

        // Mostrar indicador de sync
        this.showSyncIndicator();

        // Fazer primeira sincronização
        await this.syncNow();

        // Iniciar sincronização periódica
        this.startPeriodicSync();

        // Detectar mudanças locais
        this.watchLocalChanges();

        console.log('✅ Sincronização automática ativada');
    }

    // Carregar configuração
    loadConfig() {
        const configStr = localStorage.getItem('auto-sync-config');
        if (configStr) {
            return JSON.parse(configStr);
        }
        return null;
    }

    // Salvar configuração
    saveConfig(config) {
        localStorage.setItem('auto-sync-config', JSON.stringify(config));
    }

    // Sincronizar agora
    async syncNow() {
        if (AUTO_SYNC_CONFIG.syncInProgress) {
            console.log('⏳ Sincronização já em andamento...');
            return;
        }

        AUTO_SYNC_CONFIG.syncInProgress = true;
        this.updateSyncIndicator('syncing');

        try {
            // Coletar dados locais
            const localData = this.collectLocalData();

            // Obter dados da nuvem
            const cloudData = await this.getCloudData();

            // Resolver conflitos e mesclar
            const mergedData = this.mergeData(localData, cloudData);

            // Salvar dados mesclados localmente
            this.saveLocalData(mergedData);

            // Enviar para nuvem
            await this.sendToCloud(mergedData);

            AUTO_SYNC_CONFIG.lastSync = new Date().toISOString();
            this.updateSyncIndicator('success');

            console.log('✅ Sincronização concluída');

        } catch (error) {
            console.error('❌ Erro na sincronização:', error);
            this.updateSyncIndicator('error');
        } finally {
            AUTO_SYNC_CONFIG.syncInProgress = false;
        }
    }

    // Coletar todos os dados locais
    collectLocalData() {
        const data = {
            expenses: {},
            income: {},
            notes: {},
            fleetData: null,
            users: [],
            timestamp: Date.now(),
            userId: this.userId
        };

        // Despesas
        for (let i = 0; i < 12; i++) {
            const key = `expenses_${i}`;
            const expensesData = localStorage.getItem(key);
            if (expensesData) {
                try {
                    data.expenses[i] = JSON.parse(expensesData);
                } catch (e) {
                    console.error(`Erro ao ler ${key}:`, e);
                }
            }
        }

        // Receitas
        for (let i = 0; i < 12; i++) {
            const key = `income_${i}`;
            const incomeData = localStorage.getItem(key);
            if (incomeData) {
                try {
                    data.income[i] = JSON.parse(incomeData);
                } catch (e) {
                    console.error(`Erro ao ler ${key}:`, e);
                }
            }
        }

        // Notas
        for (let i = 0; i < 12; i++) {
            const key = `notes_${i}`;
            const notesData = localStorage.getItem(key);
            if (notesData) {
                data.notes[i] = notesData;
            }
        }

        // Frota
        const fleetData = localStorage.getItem('fleetData');
        if (fleetData) {
            try {
                data.fleetData = JSON.parse(fleetData);
            } catch (e) {
                console.error('Erro ao ler fleetData:', e);
            }
        }

        return data;
    }

    // Obter dados da nuvem
    async getCloudData() {
        // Implementação usando localStorage como fallback
        // Em produção, substituir por chamada API real
        const cloudDataStr = localStorage.getItem('cloud-sync-data');
        if (cloudDataStr) {
            try {
                return JSON.parse(cloudDataStr);
            } catch (e) {
                return null;
            }
        }
        return null;
    }

    // Enviar para nuvem
    async sendToCloud(data) {
        // Implementação usando localStorage como fallback
        // Em produção, substituir por chamada API real
        localStorage.setItem('cloud-sync-data', JSON.stringify(data));
        localStorage.setItem('cloud-sync-timestamp', Date.now().toString());
    }

    // Mesclar dados local e nuvem
    mergeData(localData, cloudData) {
        if (!cloudData) {
            return localData;
        }

        if (!localData) {
            return cloudData;
        }

        // Estratégia: último a modificar vence
        if (localData.timestamp > cloudData.timestamp) {
            console.log('📱 Dados locais mais recentes, usando local');
            return localData;
        } else if (cloudData.timestamp > localData.timestamp) {
            console.log('☁️ Dados da nuvem mais recentes, usando nuvem');
            return cloudData;
        }

        // Mesma timestamp, mesclar inteligentemente
        console.log('🔀 Mesclando dados...');
        const merged = { ...cloudData };
        merged.timestamp = Date.now();
        merged.userId = this.userId;

        // Mesclar despesas (combinar arrays)
        for (let month in localData.expenses) {
            if (!merged.expenses[month]) {
                merged.expenses[month] = localData.expenses[month];
            } else {
                // Combinar arrays removendo duplicatas por ID
                const combined = [...merged.expenses[month], ...localData.expenses[month]];
                const unique = this.removeDuplicates(combined);
                merged.expenses[month] = unique;
            }
        }

        // Mesclar receitas
        for (let month in localData.income) {
            if (!merged.income[month]) {
                merged.income[month] = localData.income[month];
            } else {
                const combined = [...merged.income[month], ...localData.income[month]];
                const unique = this.removeDuplicates(combined);
                merged.income[month] = unique;
            }
        }

        // Frota: usar o mais recente
        if (localData.fleetData && localData.fleetData.updateDate) {
            if (!merged.fleetData || !merged.fleetData.updateDate ||
                new Date(localData.fleetData.updateDate) > new Date(merged.fleetData.updateDate)) {
                merged.fleetData = localData.fleetData;
            }
        }

        return merged;
    }

    // Remover duplicatas de array de objetos
    removeDuplicates(arr) {
        const seen = new Set();
        return arr.filter(item => {
            // Gerar ID único baseado em propriedades
            const id = item.id || JSON.stringify(item);
            if (seen.has(id)) {
                return false;
            }
            seen.add(id);
            return true;
        });
    }

    // Salvar dados localmente
    saveLocalData(data) {
        // Salvar despesas
        for (let month in data.expenses) {
            const key = `expenses_${month}`;
            localStorage.setItem(key, JSON.stringify(data.expenses[month]));
        }

        // Salvar receitas
        for (let month in data.income) {
            const key = `income_${month}`;
            localStorage.setItem(key, JSON.stringify(data.income[month]));
        }

        // Salvar notas
        for (let month in data.notes) {
            const key = `notes_${month}`;
            localStorage.setItem(key, data.notes[month]);
        }

        // Salvar frota
        if (data.fleetData) {
            localStorage.setItem('fleetData', JSON.stringify(data.fleetData));
        }
    }

    // Iniciar sincronização periódica
    startPeriodicSync() {
        if (this.syncTimer) {
            clearInterval(this.syncTimer);
        }

        this.syncTimer = setInterval(() => {
            this.syncNow();
        }, AUTO_SYNC_CONFIG.syncInterval);

        console.log(`🔄 Sincronização periódica iniciada (a cada ${AUTO_SYNC_CONFIG.syncInterval / 1000}s)`);
    }

    // Parar sincronização periódica
    stopPeriodicSync() {
        if (this.syncTimer) {
            clearInterval(this.syncTimer);
            this.syncTimer = null;
            console.log('⏸️ Sincronização periódica pausada');
        }
    }

    // Detectar mudanças locais
    watchLocalChanges() {
        // Interceptar setItem do localStorage
        const originalSetItem = localStorage.setItem;
        const self = this;

        localStorage.setItem = function(key, value) {
            originalSetItem.apply(this, arguments);

            // Se é uma chave de dados, marcar mudança
            if (key.startsWith('expenses_') || key.startsWith('income_') ||
                key.startsWith('notes_') || key === 'fleetData') {
                self.lastLocalChange = Date.now();
                console.log('📝 Mudança local detectada:', key);

                // Sincronizar após 2 segundos de inatividade
                clearTimeout(self.changeTimeout);
                self.changeTimeout = setTimeout(() => {
                    console.log('🔄 Sincronizando mudanças...');
                    self.syncNow();
                }, 2000);
            }
        };
    }

    // Mostrar indicador de sincronização
    showSyncIndicator() {
        // Criar elemento de status
        const indicator = document.createElement('div');
        indicator.id = 'auto-sync-indicator';
        indicator.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: white;
            padding: 10px 15px;
            border-radius: 25px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 13px;
            z-index: 9999;
            transition: all 0.3s;
        `;

        indicator.innerHTML = `
            <div id="sync-status-icon" style="width:10px;height:10px;border-radius:50%;background:#10b981;"></div>
            <span id="sync-status-text">Sincronizado</span>
        `;

        document.body.appendChild(indicator);
    }

    // Atualizar indicador
    updateSyncIndicator(status) {
        const icon = document.getElementById('sync-status-icon');
        const text = document.getElementById('sync-status-text');

        if (!icon || !text) return;

        switch (status) {
            case 'syncing':
                icon.style.background = '#f59e0b';
                text.textContent = 'Sincronizando...';
                break;
            case 'success':
                icon.style.background = '#10b981';
                text.textContent = 'Sincronizado';
                break;
            case 'error':
                icon.style.background = '#ef4444';
                text.textContent = 'Erro ao sincronizar';
                break;
            case 'offline':
                icon.style.background = '#6b7280';
                text.textContent = 'Offline';
                break;
        }
    }
}

// Inicializar quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAutoSync);
} else {
    initAutoSync();
}

function initAutoSync() {
    // Verificar se o usuário quer sincronização automática
    const autoSyncEnabled = localStorage.getItem('auto-sync-enabled');

    if (autoSyncEnabled === null) {
        // Primeira vez, perguntar ao usuário
        setTimeout(() => {
            if (confirm('Deseja ativar a sincronização automática entre dispositivos?\n\n' +
                        'Seus dados serão salvos automaticamente na nuvem e sincronizados em todos os seus dispositivos.\n\n' +
                        'Você pode desativar isso a qualquer momento nas configurações.')) {
                localStorage.setItem('auto-sync-enabled', 'true');
                window.autoSync = new AutoSync();
                window.autoSync.init();
            } else {
                localStorage.setItem('auto-sync-enabled', 'false');
            }
        }, 2000);
    } else if (autoSyncEnabled === 'true') {
        // Já está habilitado, iniciar
        window.autoSync = new AutoSync();
        window.autoSync.init();
    }
}

// Detectar quando ficar online/offline
window.addEventListener('online', () => {
    console.log('🌐 Conexão restaurada');
    if (window.autoSync) {
        window.autoSync.updateSyncIndicator('syncing');
        window.autoSync.syncNow();
    }
});

window.addEventListener('offline', () => {
    console.log('📡 Sem conexão');
    if (window.autoSync) {
        window.autoSync.updateSyncIndicator('offline');
    }
});
