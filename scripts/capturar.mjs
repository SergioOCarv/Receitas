// Captura de tela no tamanho de um celular Android, para o Sergio conferir cada passo.
// Usa o Edge já instalado (playwright-core, sem baixar navegador).
//
// Uso:
//   node scripts/capturar.mjs --url <endereço> --saida docs/capturas/nome.png [opções]
//
// Opções:
//   --tema claro|escuro      tema do sistema simulado (padrão: claro)
//   --largura 360 --altura 760   tamanho da tela em pixels CSS (padrão: 360 × 760)
//   --inteira                captura a página inteira, não só a parte visível
//   --login email:senha      entra no app antes de abrir a --url (formulário de /login)
//   --base <endereço>        endereço base do app para o login (padrão: http://localhost:8085/receitas)
//   --dupla                  gera claro e escuro lado a lado num só PNG (ignora --tema)
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

function lerArgumentos(lista) {
  const a = { tema: 'claro', largura: 360, altura: 760, base: 'http://localhost:8085/receitas' };
  for (let i = 0; i < lista.length; i++) {
    const nome = lista[i].replace(/^--/, '');
    if (['inteira', 'dupla'].includes(nome)) a[nome] = true;
    else a[nome] = lista[++i];
  }
  if (!a.url || !a.saida) {
    console.error('Uso: node scripts/capturar.mjs --url <endereço> --saida <arquivo.png> [--tema claro|escuro] [--inteira] [--login email:senha] [--dupla]');
    process.exit(1);
  }
  a.largura = Number(a.largura);
  a.altura = Number(a.altura);
  return a;
}

async function capturarTema(navegador, a, tema) {
  const contexto = await navegador.newContext({
    viewport: { width: a.largura, height: a.altura },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    colorScheme: tema === 'escuro' ? 'dark' : 'light',
    locale: 'pt-BR',
    userAgent: 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Mobile Safari/537.36',
  });
  const pagina = await contexto.newPage();
  if (a.login) {
    const [email, ...resto] = a.login.split(':');
    await pagina.goto(`${a.base}/login`, { waitUntil: 'networkidle' });
    await pagina.fill('input[type="email"]', email);
    await pagina.fill('input[type="password"]', resto.join(':'));
    await Promise.all([pagina.waitForURL(u => !u.pathname.endsWith('/login')), pagina.click('button[type="submit"]')]);
  }
  await pagina.goto(a.url, { waitUntil: 'networkidle' });
  await pagina.evaluate(() => document.fonts?.ready);
  const imagem = await pagina.screenshot({ fullPage: !!a.inteira });
  await contexto.close();
  return imagem;
}

// Junta duas imagens lado a lado, com o nome do tema em cima, usando o próprio navegador.
async function juntar(navegador, imagens, a) {
  // A janela da página de montagem precisa caber as duas telas inteiras (senão a imagem sai cortada).
  const pagina = await navegador.newPage({ deviceScaleFactor: 2, viewport: { width: a.largura * 2 + 80, height: 400 } });
  const bloco = (titulo, png) => `<div style="display:flex;flex-direction:column;align-items:center;gap:8px">
    <div style="font:600 14px system-ui">${titulo}</div>
    <img src="data:image/png;base64,${png.toString('base64')}" style="width:${a.largura}px;display:block;border:1px solid #ccc;border-radius:12px"></div>`;
  await pagina.setContent(`<body style="margin:0;background:#e5e5e5">
    <div id="montagem" style="background:#e5e5e5;padding:16px 16px 24px;display:flex;gap:16px;width:max-content;box-sizing:content-box">
    ${bloco('Tema claro', imagens[0])}${bloco('Tema escuro', imagens[1])}</div></body>`);
  await pagina.waitForLoadState('load');
  // Captura do bloco, não da página inteira: a página inteira falha às vezes no Edge sem tela.
  const resultado = await pagina.locator('#montagem').screenshot();
  await pagina.close();
  return resultado;
}

const a = lerArgumentos(process.argv.slice(2));
const navegador = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const saida = resolve(a.saida);
  mkdirSync(dirname(saida), { recursive: true });
  const { writeFileSync } = await import('node:fs');
  if (a.dupla) {
    const imagens = [await capturarTema(navegador, a, 'claro'), await capturarTema(navegador, a, 'escuro')];
    writeFileSync(saida, await juntar(navegador, imagens, a));
  } else {
    writeFileSync(saida, await capturarTema(navegador, a, a.tema));
  }
  console.log(`Captura salva em ${a.saida}`);
} finally {
  await navegador.close();
}
