// Service Worker - Casa DW
// Intercepta arquivos compartilhados via Web Share Target API

const CACHE_NAME = 'casadw-v1';
const SHARE_STORE = 'shared-files';

// ===== INSTALL =====
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

// ===== ACTIVATE =====
self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

// ===== FETCH: interceptar POST do share target =====
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Interceptar POST em /share-scan (Web Share Target)
    if (url.pathname === '/share-scan' && event.request.method === 'POST') {
        event.respondWith(handleShareTarget(event.request));
        return;
    }
});

async function handleShareTarget(request) {
    try {
        const formData = await request.formData();

        // Pegar arquivo compartilhado (PDF ou imagem)
        const file = formData.get('documento');
        const title = formData.get('title') || '';
        const text = formData.get('text') || '';

        if (file && file instanceof File) {
            // Converter arquivo para base64 para passar pela URL hash
            const arrayBuffer = await file.arrayBuffer();
            const bytes = new Uint8Array(arrayBuffer);
            let binary = '';
            for (let i = 0; i < bytes.byteLength; i++) {
                binary += String.fromCharCode(bytes[i]);
            }
            const base64 = btoa(binary);
            const mimeType = file.type || 'application/pdf';
            const dataUrl = `data:${mimeType};base64,${base64}`;
            const filename = file.name || `scan_${Date.now()}.pdf`;

            // Guardar no cache temporário (IndexedDB via Cache API)
            const cache = await caches.open(SHARE_STORE);
            const response = new Response(JSON.stringify({
                dataUrl,
                filename,
                mimeType,
                title,
                text,
                timestamp: Date.now()
            }), {
                headers: { 'Content-Type': 'application/json' }
            });
            await cache.put('/pending-scan', response);

            // Abrir ou focar a janela do app e navegar para ?share=1
            const allClients = await clients.matchAll({
                type: 'window',
                includeUncontrolled: true
            });

            if (allClients.length > 0) {
                // Já tem janela aberta: navegar para share
                const client = allClients[0];
                client.navigate('/?share=1');
                client.focus();
            } else {
                // Abrir nova janela
                clients.openWindow('/?share=1');
            }
        }

        // Redirecionar sempre (o SW não bloqueia a navegação)
        return Response.redirect('/?share=1', 303);

    } catch (e) {
        console.error('[SW] Erro ao processar share:', e);
        return Response.redirect('/', 303);
    }
}
