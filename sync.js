// Sync System - Sincronização de Dados Entre Dispositivos

document.addEventListener('DOMContentLoaded', function() {
    setupSyncListeners();
});

function setupSyncListeners() {
    // Botão de sincronização no header
    const syncBtn = document.getElementById('syncBtn');
    if (syncBtn) {
        // Se tem API configurada, sincronizar com nuvem
        // Senão, abrir modal de sincronização manual
        syncBtn.addEventListener('click', function() {
            if (window.RealStorage && window.API_URL) {
                syncWithCloud();
            } else {
                openSyncModal();
            }
        });
    }

    // Botões do modal
    const btnExportAllData = document.getElementById('btnExportAllData');
    const btnImportData = document.getElementById('btnImportData');
    const btnGenerateQR = document.getElementById('btnGenerateQR');
    const btnScanQR = document.getElementById('btnScanQR');
    const btnCopyData = document.getElementById('btnCopyData');
    const btnPasteData = document.getElementById('btnPasteData');
    const importFileInput = document.getElementById('importFileInput');

    if (btnExportAllData) {
        btnExportAllData.addEventListener('click', exportAllData);
    }

    if (btnImportData) {
        btnImportData.addEventListener('click', function() {
            importFileInput.click();
        });
    }

    if (importFileInput) {
        importFileInput.addEventListener('change', importData);
    }

    if (btnGenerateQR) {
        btnGenerateQR.addEventListener('click', generateQRCode);
    }

    if (btnScanQR) {
        btnScanQR.addEventListener('click', scanQRCode);
    }

    if (btnCopyData) {
        btnCopyData.addEventListener('click', copyDataToClipboard);
    }

    if (btnPasteData) {
        btnPasteData.addEventListener('click', pasteDataFromClipboard);
    }

    // Botão de forçar sincronização da nuvem
    const btnForceCloudSync = document.getElementById('btnForceCloudSync');
    if (btnForceCloudSync) {
        btnForceCloudSync.addEventListener('click', forceCloudSync);
    }

    // Mostrar opção de nuvem se API estiver configurada
    if (window.API_URL && window.RealStorage) {
        const cloudSyncOption = document.getElementById('cloudSyncOption');
        if (cloudSyncOption) {
            cloudSyncOption.style.display = 'block';
        }
    }
}

// Sincronizar com nuvem (backend)
async function syncWithCloud() {
    if (!window.RealStorage) {
        showToast('Sistema de sincronização não disponível', 'error');
        return;
    }

    const syncBtn = document.getElementById('syncBtn');
    const originalHTML = syncBtn.innerHTML;

    try {
        // Mostrar loading
        syncBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sincronizando...';
        syncBtn.disabled = true;

        console.log('🔄 Sincronização manual iniciada...');

        // 1. Enviar dados locais para nuvem
        await window.RealStorage.syncAllToCloud();

        // 2. Buscar dados da nuvem
        await window.RealStorage.initialSync();

        showToast('✅ Sincronização concluída com sucesso!', 'success');

        // Recarregar página para mostrar dados atualizados
        setTimeout(() => {
            window.location.reload();
        }, 1500);

    } catch (error) {
        console.error('❌ Erro na sincronização:', error);
        showToast('Erro ao sincronizar: ' + error.message, 'error');
    } finally {
        // Restaurar botão
        syncBtn.innerHTML = originalHTML;
        syncBtn.disabled = false;
    }
}

// Forçar sincronização da nuvem (LIMPAR dados locais)
async function forceCloudSync() {
    if (!window.RealStorage) {
        showToast('Sistema de sincronização não disponível', 'error');
        return;
    }

    // Confirmação
    const confirmed = confirm(
        '⚠️ ATENÇÃO!\n\n' +
        'Esta ação vai SUBSTITUIR todos os seus dados locais pelos dados da nuvem.\n\n' +
        'Use isso no CELULAR para baixar os dados do COMPUTADOR.\n\n' +
        'Deseja continuar?'
    );

    if (!confirmed) {
        return;
    }

    const btn = document.getElementById('btnForceCloudSync');
    const originalHTML = btn.innerHTML;

    try {
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Baixando...';
        btn.disabled = true;

        console.log('🧹 Forçando sincronização limpa da nuvem...');

        // Forçar download limpo
        await window.RealStorage.forceDownloadFromCloud();

    } catch (error) {
        console.error('❌ Erro ao forçar sincronização:', error);
        showToast('Erro: ' + error.message, 'error');
        btn.innerHTML = originalHTML;
        btn.disabled = false;
    }
}

function openSyncModal() {
    const modal = document.getElementById('syncModal');
    if (modal) {
        modal.style.display = 'block';
    }
}

// Exportar todos os dados
function exportAllData() {
    try {
        const allData = {
            expenses: {},
            income: {},
            notes: {},
            fleetData: null,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };

        // Coletar dados de despesas
        for (let i = 0; i < 12; i++) {
            const expensesKey = `expenses_${i}`;
            const expensesData = localStorage.getItem(expensesKey);
            if (expensesData) {
                allData.expenses[i] = JSON.parse(expensesData);
            }
        }

        // Coletar dados de receitas
        for (let i = 0; i < 12; i++) {
            const incomeKey = `income_${i}`;
            const incomeData = localStorage.getItem(incomeKey);
            if (incomeData) {
                allData.income[i] = JSON.parse(incomeData);
            }
        }

        // Coletar notas
        for (let i = 0; i < 12; i++) {
            const notesKey = `notes_${i}`;
            const notesData = localStorage.getItem(notesKey);
            if (notesData) {
                allData.notes[i] = notesData;
            }
        }

        // Coletar dados da frota
        const fleetData = localStorage.getItem('fleetData');
        if (fleetData) {
            allData.fleetData = JSON.parse(fleetData);
        }

        // Criar arquivo para download
        const dataStr = JSON.stringify(allData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);

        const link = document.createElement('a');
        const now = new Date();
        const filename = `backup-casario-${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}.json`;

        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        showToast('Dados exportados com sucesso! Arquivo baixado.', 'success');
    } catch (error) {
        console.error('Erro ao exportar dados:', error);
        showToast('Erro ao exportar dados: ' + error.message, 'error');
    }
}

// Importar dados
function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);

            // Validar estrutura dos dados
            if (!importedData.version || !importedData.exportDate) {
                throw new Error('Arquivo inválido ou corrompido');
            }

            // Confirmar antes de importar
            if (!confirm('ATENÇÃO: Importar dados irá SUBSTITUIR todos os dados atuais. Deseja continuar?')) {
                return;
            }

            // Importar despesas
            if (importedData.expenses) {
                for (let month in importedData.expenses) {
                    const key = `expenses_${month}`;
                    localStorage.setItem(key, JSON.stringify(importedData.expenses[month]));
                }
            }

            // Importar receitas
            if (importedData.income) {
                for (let month in importedData.income) {
                    const key = `income_${month}`;
                    localStorage.setItem(key, JSON.stringify(importedData.income[month]));
                }
            }

            // Importar notas
            if (importedData.notes) {
                for (let month in importedData.notes) {
                    const key = `notes_${month}`;
                    localStorage.setItem(key, importedData.notes[month]);
                }
            }

            // Importar dados da frota
            if (importedData.fleetData) {
                localStorage.setItem('fleetData', JSON.stringify(importedData.fleetData));
            }

            showToast('Dados importados com sucesso! Recarregando página...', 'success');

            // Recarregar página após 2 segundos
            setTimeout(() => {
                window.location.reload();
            }, 2000);

        } catch (error) {
            console.error('Erro ao importar dados:', error);
            showToast('Erro ao importar dados: ' + error.message, 'error');
        }
    };

    reader.readAsText(file);

    // Limpar input
    event.target.value = '';
}

// Gerar QR Code
function generateQRCode() {
    try {
        // Coletar dados
        const allData = {
            expenses: {},
            income: {},
            notes: {},
            fleetData: null,
            exportDate: new Date().toISOString()
        };

        // Simplificar para caber no QR Code (limitar dados)
        for (let i = 0; i < 12; i++) {
            const expensesKey = `expenses_${i}`;
            const expensesData = localStorage.getItem(expensesKey);
            if (expensesData) {
                allData.expenses[i] = JSON.parse(expensesData);
            }
        }

        const dataStr = JSON.stringify(allData);

        // Verificar tamanho
        if (dataStr.length > 2000) {
            showToast('Dados muito grandes para QR Code. Use a opção "Exportar e Importar".', 'warning');
            return;
        }

        // Codificar em base64 para URL
        const base64Data = btoa(dataStr);
        const dataUrl = window.location.origin + window.location.pathname + '?import=' + base64Data;

        // Gerar QR Code usando API externa
        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(dataUrl)}`;

        const container = document.getElementById('qrCodeContainer');
        const imageDiv = document.getElementById('qrCodeImage');

        imageDiv.innerHTML = `<img src="${qrCodeUrl}" alt="QR Code" style="max-width:100%;">`;
        container.style.display = 'block';

        showToast('QR Code gerado! Escaneie no outro dispositivo.', 'success');
    } catch (error) {
        console.error('Erro ao gerar QR Code:', error);
        showToast('Erro ao gerar QR Code: ' + error.message, 'error');
    }
}

// Escanear QR Code (abrir câmera)
function scanQRCode() {
    showToast('Use a câmera do celular para escanear o QR Code gerado no outro dispositivo.', 'info');
}

// Copiar dados para área de transferência
function copyDataToClipboard() {
    try {
        const allData = {
            expenses: {},
            income: {},
            notes: {},
            fleetData: null,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };

        // Coletar todos os dados
        for (let i = 0; i < 12; i++) {
            const expensesKey = `expenses_${i}`;
            const expensesData = localStorage.getItem(expensesKey);
            if (expensesData) {
                allData.expenses[i] = JSON.parse(expensesData);
            }
        }

        for (let i = 0; i < 12; i++) {
            const incomeKey = `income_${i}`;
            const incomeData = localStorage.getItem(incomeKey);
            if (incomeData) {
                allData.income[i] = JSON.parse(incomeData);
            }
        }

        for (let i = 0; i < 12; i++) {
            const notesKey = `notes_${i}`;
            const notesData = localStorage.getItem(notesKey);
            if (notesData) {
                allData.notes[i] = notesData;
            }
        }

        const fleetData = localStorage.getItem('fleetData');
        if (fleetData) {
            allData.fleetData = JSON.parse(fleetData);
        }

        const dataStr = JSON.stringify(allData);

        // Copiar para clipboard
        navigator.clipboard.writeText(dataStr).then(() => {
            showToast('Dados copiados! Cole no outro dispositivo via WhatsApp, email, etc.', 'success');
        }).catch(err => {
            // Fallback para navegadores antigos
            const textArea = document.createElement('textarea');
            textArea.value = dataStr;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            showToast('Dados copiados! Cole no outro dispositivo.', 'success');
        });

    } catch (error) {
        console.error('Erro ao copiar dados:', error);
        showToast('Erro ao copiar dados: ' + error.message, 'error');
    }
}

// Colar dados da área de transferência
function pasteDataFromClipboard() {
    const pasteArea = document.getElementById('pasteDataArea');

    if (pasteArea.style.display === 'none') {
        pasteArea.style.display = 'block';
        pasteArea.focus();
        showToast('Cole os dados na caixa de texto e clique novamente em "Colar Dados"', 'info');
    } else {
        const pastedData = pasteArea.value.trim();

        if (!pastedData) {
            showToast('Nenhum dado encontrado. Cole os dados primeiro.', 'warning');
            return;
        }

        try {
            const importedData = JSON.parse(pastedData);

            // Validar estrutura
            if (!importedData.version || !importedData.exportDate) {
                throw new Error('Dados inválidos ou corrompidos');
            }

            // Confirmar antes de importar
            if (!confirm('ATENÇÃO: Importar dados irá SUBSTITUIR todos os dados atuais. Deseja continuar?')) {
                return;
            }

            // Importar despesas
            if (importedData.expenses) {
                for (let month in importedData.expenses) {
                    const key = `expenses_${month}`;
                    localStorage.setItem(key, JSON.stringify(importedData.expenses[month]));
                }
            }

            // Importar receitas
            if (importedData.income) {
                for (let month in importedData.income) {
                    const key = `income_${month}`;
                    localStorage.setItem(key, JSON.stringify(importedData.income[month]));
                }
            }

            // Importar notas
            if (importedData.notes) {
                for (let month in importedData.notes) {
                    const key = `notes_${month}`;
                    localStorage.setItem(key, importedData.notes[month]);
                }
            }

            // Importar dados da frota
            if (importedData.fleetData) {
                localStorage.setItem('fleetData', JSON.stringify(importedData.fleetData));
            }

            showToast('Dados importados com sucesso! Recarregando página...', 'success');

            setTimeout(() => {
                window.location.reload();
            }, 2000);

        } catch (error) {
            console.error('Erro ao processar dados colados:', error);
            showToast('Erro ao processar dados: ' + error.message, 'error');
        }
    }
}

// Verificar se há dados para importar na URL
window.addEventListener('load', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const importData = urlParams.get('import');

    if (importData) {
        try {
            const dataStr = atob(importData);
            const data = JSON.parse(dataStr);

            if (confirm('Detectamos dados para importar. Deseja importar agora? Isso irá substituir seus dados atuais.')) {
                // Importar dados (similar ao pasteDataFromClipboard)
                if (data.expenses) {
                    for (let month in data.expenses) {
                        localStorage.setItem(`expenses_${month}`, JSON.stringify(data.expenses[month]));
                    }
                }

                showToast('Dados importados com sucesso!', 'success');

                // Limpar URL
                window.history.replaceState({}, document.title, window.location.pathname);

                setTimeout(() => window.location.reload(), 1500);
            }
        } catch (error) {
            console.error('Erro ao importar dados da URL:', error);
        }
    }
});
