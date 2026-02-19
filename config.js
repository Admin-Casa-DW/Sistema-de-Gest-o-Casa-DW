// Configuração Simples do Sistema
// Este arquivo permite configurar a API de forma fácil

// Configuração padrão - Backend ATIVO!
const CONFIG = {
    // URL da API - Backend hospedado no Render.com
    API_URL: 'https://casario-backend-1.onrender.com',

    // Configuração automática - ATIVADA!
    AUTO_SYNC: true,
    SYNC_INTERVAL: 30000, // 30 segundos

    // Indicadores visuais
    SHOW_SYNC_INDICATOR: true,
    SHOW_CONNECTION_STATUS: true,

    // Modo online
    OFFLINE_MODE: false
};

// Função para configurar API personalizada (opcional)
function setCustomAPI(url) {
    CONFIG.API_URL = url;
    localStorage.setItem('custom-api-url', url);
    console.log('✅ API personalizada configurada:', url);
}

// Carregar API personalizada se existir
const customAPI = localStorage.getItem('custom-api-url');
if (customAPI) {
    CONFIG.API_URL = customAPI;
}

// Exportar configuração
window.APP_CONFIG = CONFIG;
window.setCustomAPI = setCustomAPI;

console.log('⚙️ Configuração carregada:');
console.log('  API:', CONFIG.API_URL);
console.log('  Sincronização automática:', CONFIG.AUTO_SYNC ? 'Ativada' : 'Desativada');
