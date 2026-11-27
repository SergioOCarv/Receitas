// Gera os ícones PNG do Bom Bocado a partir dos SVGs de sistema/resources/icone/.
// Uso (na raiz do projeto): node scripts/gerar-icones.mjs
// Usa o Edge já instalado (playwright-core, sem baixar navegador).
import { chromium } from 'playwright-core';
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs';

const ORIGEM = 'sistema/resources/icone';
const PUBLICO = 'sistema/public';

// [svg de origem, arquivo de saída, tamanho em px]
const ICONES = [
    ['bom-bocado.svg', 'icones/icone-192.png', 192],
    ['bom-bocado.svg', 'icones/icone-512.png', 512],
    ['bom-bocado-maskable.svg', 'icones/icone-maskable-512.png', 512],
    ['bom-bocado-maskable.svg', 'apple-touch-icon.png', 180], // o iOS arredonda sozinho: usa o fundo até a borda
    ['bom-bocado.svg', 'favicon-32.png', 32],
];

mkdirSync(`${PUBLICO}/icones`, { recursive: true });
const navegador = await chromium.launch({ channel: 'msedge', headless: true });
try {
    for (const [svg, saida, tamanho] of ICONES) {
        // Janela sempre grande: o Edge sem tela falha ao capturar janelas pequenas (~500 px é o mínimo, ver LICOES.md).
        // A captura é só do desenho (o <svg>), no tamanho pedido.
        const pagina = await navegador.newPage({ viewport: { width: 800, height: 800 }, deviceScaleFactor: 1 });
        const conteudo = readFileSync(`${ORIGEM}/${svg}`, 'utf8');
        await pagina.setContent(
            `<html><body style="margin:0;background:transparent">${conteudo.replace('<svg ', `<svg style="display:block" width="${tamanho}" height="${tamanho}" `)}</body></html>`,
        );
        writeFileSync(`${PUBLICO}/${saida}`, await pagina.locator('svg').screenshot({ omitBackground: true }));
        await pagina.close();
        console.log(`${saida} (${tamanho}px)`);
    }
    // Favicon vetorial para navegadores que aceitam SVG
    copyFileSync(`${ORIGEM}/bom-bocado.svg`, `${PUBLICO}/favicon.svg`);
    console.log('favicon.svg');
} finally {
    await navegador.close();
}
