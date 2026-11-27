// Service worker do Bom Bocado.
// Por enquanto é mínimo: existe para o app ser instalável. Ainda não guarda nada no celular.
// O cache das receitas para uso sem internet entra na Fase 10 (design 5.11).
// Fica em public/ (não em public/build/) para controlar todas as páginas do app.

self.addEventListener('install', () => {
    // Uma versão nova assume logo, sem esperar fechar o app.
    self.skipWaiting();
});

self.addEventListener('activate', (evento) => {
    evento.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', () => {
    // Sem interceptar nada: o navegador busca tudo na rede, como um site comum.
});
