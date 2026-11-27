// Teste descartável (Fase 0, passo 2): o que dá para ler de cada link SEM IA.
// Uso: node pesquisa/ler-links.mjs <arquivo com links, um por linha>
// Grava um JSON por link em pesquisa/saida/ (fora do Git).
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const AGENTE = 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Mobile Safari/537.36';
const SAIDA = new URL('./saida/', import.meta.url);
mkdirSync(SAIDA, { recursive: true });

const arquivo = process.argv[2];
const links = readFileSync(arquivo, 'utf8').split(/\r?\n/).filter(l => /^https?:\/\//.test(l.trim())).map(l => l.trim());

// Remove parâmetros de rastreio (o mesmo que o app vai precisar fazer).
const RASTREIO = /^(utm_.*|gclid|gbraid|wbraid|gad_.*|gclsrc|fbclid|si|igsh|igshid|feature)$/i;
function limpar(url) {
  const u = new URL(url);
  for (const k of [...u.searchParams.keys()]) if (RASTREIO.test(k)) u.searchParams.delete(k);
  return u.toString();
}

async function baixar(url, extra = {}) {
  const r = await fetch(url, { redirect: 'follow', headers: { 'User-Agent': AGENTE, 'Accept-Language': 'pt-BR,pt;q=0.9', ...extra }, signal: AbortSignal.timeout(20000) });
  const texto = await r.text();
  return { status: r.status, urlFinal: r.url, texto };
}

const decodificar = s => s?.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n)).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));

function meta(html, nome) {
  const re = new RegExp(`<meta[^>]+(?:property|name)=["']${nome}["'][^>]*content=["']([^"']*)["']|<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${nome}["']`, 'i');
  const m = html.match(re);
  return decodificar(m?.[1] ?? m?.[2]) ?? null;
}

function jsonLdReceita(html) {
  const blocos = [...html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1]);
  const achatar = o => Array.isArray(o) ? o.flatMap(achatar) : o && typeof o === 'object' ? [o, ...(o['@graph'] ? achatar(o['@graph']) : [])] : [];
  for (const b of blocos) {
    try {
      for (const o of achatar(JSON.parse(b))) {
        const t = [].concat(o['@type'] ?? []);
        if (t.includes('Recipe')) return {
          nome: o.name, ingredientes: o.recipeIngredient?.length ?? 0,
          passos: [].concat(o.recipeInstructions ?? []).length, rendimento: o.recipeYield ?? null,
          tempo: o.totalTime ?? null, imagem: !!o.image,
          amostraIngredientes: (o.recipeIngredient ?? []).slice(0, 3),
        };
      }
    } catch { /* bloco inválido: ignora */ }
  }
  return null;
}

async function fotoBaixa(url) {
  if (!url) return null;
  try { const r = await fetch(url, { headers: { 'User-Agent': AGENTE }, signal: AbortSignal.timeout(20000) }); const b = await r.arrayBuffer(); return { status: r.status, tipo: r.headers.get('content-type'), bytes: b.byteLength }; }
  catch (e) { return { erro: e.message }; }
}

async function lerYoutube(html) {
  const m = html.match(/ytInitialPlayerResponse\s*=\s*(\{.+?\});(?:var|<\/script>)/s);
  if (!m) return { playerResponse: false };
  const pr = JSON.parse(m[1]);
  const v = pr.videoDetails ?? {};
  const trilhas = pr.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? [];
  const r = { playerResponse: true, titulo: v.title, autor: v.author, descricao: (v.shortDescription ?? '').slice(0, 800), tamanhoDescricao: (v.shortDescription ?? '').length,
    legendas: trilhas.map(t => ({ idioma: t.languageCode, tipo: t.kind ?? 'manual' })) };
  const trilha = trilhas.find(t => t.languageCode === 'pt' && t.kind !== 'asr') ?? trilhas.find(t => t.languageCode === 'pt') ?? trilhas[0];
  if (trilha) {
    r.legendaUsada = `${trilha.languageCode}/${trilha.kind ?? 'manual'}`;
    try {
      const t = await baixar(new URL(trilha.baseUrl, 'https://www.youtube.com').toString() + '&fmt=json3');
      let texto = '';
      try { texto = JSON.parse(t.texto).events?.flatMap(e => e.segs ?? []).map(s => s.utf8).join('') ?? ''; } catch { texto = ''; }
      r.transcricao = { status: t.status, tamanho: texto.length, amostra: texto.slice(0, 300) };
    } catch (e) { r.transcricao = { erro: e.message }; }
  }
  return r;
}

import { execFile } from 'node:child_process';
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
function abrirNoNavegador(url) {
  return new Promise(ok => execFile(EDGE, ['--headless=new', '--disable-gpu', '--virtual-time-budget=15000', '--dump-dom', url],
    { maxBuffer: 50e6, timeout: 60000 }, (_e, saida) => ok(saida ?? '')));
}

let n = 0;
for (const original of links) {
  n++;
  const origem = /instagram\.com/.test(original) ? 'instagram' : /youtu\.?be/.test(original) ? 'youtube' : 'site';
  const res = { origem, linkLimpo: limpar(original) };
  try {
    const p = await baixar(original);
    res.status = p.status;
    res.urlFinal = limpar(p.urlFinal);
    res.tamanhoHtml = p.texto.length;
    res.titulo = decodificar(p.texto.match(/<title[^>]*>([^<]*)/i)?.[1]?.trim()) ?? null;
    res.og = { titulo: meta(p.texto, 'og:title'), descricao: meta(p.texto, 'og:description'), imagem: meta(p.texto, 'og:image') };
    res.jsonLdReceita = jsonLdReceita(p.texto);
    res.foto = await fotoBaixa(res.og.imagem);
    if (origem === 'youtube') res.youtube = await lerYoutube(p.texto);
    if (origem === 'instagram') {
      // O fetch simples não traz a legenda (testado): abre num navegador de verdade (Edge sem tela).
      const dom = await abrirNoNavegador(original);
      const urlPost = meta(dom, 'og:url');
      res.navegador = {
        tamanhoDom: dom.length,
        post: urlPost?.match(/\/(reel|p|tv)\/([^/?#]+)/)?.slice(1).join('/') ?? null,
        legenda: meta(dom, 'og:description'),
        foto: meta(dom, 'og:image'),
      };
      res.navegador.tamanhoLegenda = res.navegador.legenda?.length ?? 0;
      res.foto = await fotoBaixa(res.navegador.foto);
    }
  } catch (e) { res.erro = e.message; }
  writeFileSync(new URL(`${origem}-${n}.json`, SAIDA), JSON.stringify(res, null, 2));
  console.log(`${origem}-${n}: status=${res.status ?? 'erro'} og.desc=${res.og?.descricao ? res.og.descricao.length + ' car.' : 'não'} jsonld=${res.jsonLdReceita ? 'sim' : 'não'} foto=${res.foto?.status ?? '-'}`
    + (res.youtube ? ` desc=${res.youtube.tamanhoDescricao} legendas=${res.youtube.legendas?.length ?? 0} transcr=${res.youtube.transcricao?.tamanho ?? '-'}` : '')
    + (res.navegador ? ` navegador: post=${res.navegador.post} legenda=${res.navegador.tamanhoLegenda}` : '') + (res.erro ? ` ERRO=${res.erro}` : ''));
}
