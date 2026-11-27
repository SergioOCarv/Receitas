// Teste descartável (Fase 0, passo 7): extrai as receitas com o Claude Haiku 5.5.
// Uso (na raiz do projeto): node --env-file=.env pesquisa/extrair-ia.mjs
// Lê pesquisa/saida/*.json (passo 2), monta o texto de cada link, chama a IA com saída
// estruturada e grava pesquisa/saida/<nome>.receita.json + pesquisa/saida/resumo-ia.json.
import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { z } from 'zod';
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';

const SAIDA = new URL('./saida/', import.meta.url);
const MODELO = 'claude-haiku-5-5';
const PRECO_ENTRADA = 0.10 / 1e6; // US$ por token (até 100 mil tokens de entrada)
const PRECO_SAIDA = 0.50 / 1e6;

// Lista fixa de tipos (design, seção 5.6).
const TIPOS = ['quente', 'frio', 'gelado', 'assado', 'frito', 'cozido', 'cru/salada', 'bebida', 'doce', 'salgado',
  'sobremesa', 'lanche', 'café da manhã', 'prato principal', 'acompanhamento', 'molho', 'pão/massa', 'vegetariano'];

// Esquema da receita (fonte única; o passo 55 reusa no PHP).
const Receita = z.object({
  eh_receita: z.boolean(),
  titulo: z.string(),
  descricao: z.string(),
  porcoes: z.number().int().nullable(),
  tempo_minutos: z.number().int().nullable(),
  ingredientes: z.array(z.object({ texto: z.string(), nome_busca: z.string() })),
  passos: z.array(z.string()),
  tipos: z.array(z.enum(TIPOS)),
  idioma_original: z.string(),
});

const INSTRUCOES = `Você extrai receitas culinárias de textos tirados de posts do Instagram, vídeos do YouTube e páginas de sites.
Responda sempre em português do Brasil: se a receita estiver em outro idioma, traduza tudo e informe o idioma original (código ISO 639-1, ex.: "pt", "en", "es").
Regras:
- eh_receita: false quando o texto não contém uma receita (com ingredientes ou modo de preparo). Nesse caso, deixe as listas vazias e os outros campos vazios ou nulos.
- Ignore curtidas, comentários, hashtags, chamadas como "salva", "curte", "compartilha", "siga", propagandas e menus do site.
- titulo: nome curto da receita, sem emojis e sem letras todas maiúsculas.
- descricao: uma frase curta e neutra sobre o prato.
- ingredientes: um item por ingrediente, com a quantidade no "texto" (ex.: "2 xícaras (chá) de farinha de trigo"). Se a receita tiver partes (massa, cobertura, calda), comece o texto com a parte entre colchetes (ex.: "[Cobertura] 1 lata de leite condensado"). "nome_busca" é só o ingrediente, em minúsculas e no singular, sem quantidade nem marca (ex.: "farinha de trigo", "leite condensado").
- passos: modo de preparo em passos curtos, na ordem, sem numeração no texto.
- porcoes e tempo_minutos: só se o texto informar ou se der para deduzir com segurança; senão, null.
- "nome_busca" com dois ingredientes juntos (ex.: "sal e pimenta-do-reino a gosto"): use o primeiro e repita o item para o segundo (um item "sal", outro "pimenta-do-reino"). Leite líquido é "leite"; leite em pó só quando o texto diz "em pó".
- tipos: marque só os que valem de verdade para o prato pronto, conforme estas definições:
  quente = servido quente; frio = servido frio ou em temperatura ambiente sem ir à geladeira para gelar; gelado = servido gelado ou congelado (sorvete, mousse, pavê, bebida gelada);
  assado = vai ao forno ou à airfryer; frito = frito em óleo; cozido = cozido em água, caldo ou panela de pressão; cru/salada = sem cozimento, saladas;
  bebida = só bebidas (sucos, drinks, cafés, vitaminas); bolos, doces e pratos nunca são bebida;
  doce, salgado = sabor principal; sobremesa = servido como sobremesa; lanche = sanduíches, salgadinhos, petiscos; café da manhã = típico do café da manhã;
  prato principal = refeição principal; acompanhamento = guarnição (arroz, purê, farofa); molho = molhos e caldas servidos à parte; pão/massa = pães, massas (macarrão, lasanha, pizza, tortas de massa);
  vegetariano = SEM nenhuma carne, frango, peixe ou frutos do mar (na dúvida, não marque).
- Não invente ingredientes nem passos que não estejam no texto.`;

// --- Montagem do texto de entrada de cada link ---
const ENTIDADES = { amp: '&', quot: '"', apos: "'", lt: '<', gt: '>', nbsp: ' ', aacute: 'á', agrave: 'à', acirc: 'â', atilde: 'ã', eacute: 'é', ecirc: 'ê',
  iacute: 'í', oacute: 'ó', ocirc: 'ô', otilde: 'õ', uacute: 'ú', ccedil: 'ç', Aacute: 'Á', Atilde: 'Ã', Eacute: 'É', Ecirc: 'Ê', Iacute: 'Í', Oacute: 'Ó', Uacute: 'Ú', Ccedil: 'Ç', ordm: 'º', ordf: 'ª', deg: '°', frac12: '½', frac14: '¼', frac34: '¾', ndash: '–', mdash: '—', hellip: '…', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“' };
const decodificar = s => s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+\d*);/gi, (m, e) =>
  e[0] === '#' ? String.fromCodePoint(e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : +e.slice(1)) : (ENTIDADES[e] ?? m));

function receitasJsonLd(html) {
  const achatar = o => Array.isArray(o) ? o.flatMap(achatar) : o && typeof o === 'object' ? [o, ...(o['@graph'] ? achatar(o['@graph']) : [])] : [];
  const todas = [];
  for (const m of html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    try { todas.push(...achatar(JSON.parse(m[1])).filter(o => [].concat(o['@type'] ?? []).includes('Recipe'))); } catch { /* ignora bloco inválido */ }
  }
  // Fica com a entrada mais completa (a Nestlé tem uma só com avaliações).
  const r = todas.sort((a, b) => (b.recipeIngredient?.length ?? 0) - (a.recipeIngredient?.length ?? 0))[0];
  if (!r?.recipeIngredient) return null;
  const passos = i => typeof i === 'string' ? [i] : i?.itemListElement ? [`[${i.name}]`, ...i.itemListElement.flatMap(passos)] : i?.text ? [i.text] : [];
  return { nome: r.name, rendimento: r.recipeYield, tempoTotal: r.totalTime, categoria: r.recipeCategory, ingredientes: r.recipeIngredient, passos: [].concat(r.recipeInstructions ?? []).flatMap(passos) };
}

function textoVisivel(html) {
  return decodificar(html.replace(/<(script|style|noscript|svg|nav|header|footer)[\s\S]*?<\/\1>/gi, ' ').replace(/<br\s*\/?>|<\/(p|li|h\d|div)>/gi, '\n').replace(/<[^>]+>/g, ' '))
    .replace(/[ \t]+/g, ' ').replace(/\s*\n\s*/g, '\n').trim();
}

async function entrada(nome, dados) {
  if (dados.origem === 'instagram') return `Origem: post do Instagram\nLegenda:\n${dados.navegador?.legenda ?? ''}`;
  if (dados.origem === 'youtube') {
    let t = `Origem: vídeo do YouTube\nTítulo: ${dados.youtube?.titulo ?? ''}\nDescrição:\n${dados.youtube?.descricao ?? ''}`;
    const id = dados.linkLimpo.match(/(?:shorts\/|v=)([\w-]{11})/)?.[1];
    const leg = id && readdirSync(new URL('yt/', SAIDA)).find(f => f.startsWith(id) && f.endsWith('.json3'));
    if (leg) {
      const j = JSON.parse(readFileSync(new URL(`yt/${leg}`, SAIDA), 'utf8'));
      t += `\nTranscrição automática da fala:\n${(j.events ?? []).flatMap(e => e.segs ?? []).map(s => s.utf8).join('').replace(/\s+/g, ' ')}`;
    }
    return t;
  }
  // Site: baixa de novo para pegar o JSON-LD completo e o texto da página.
  const html = await (await fetch(dados.linkLimpo, { headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Mobile Safari/537.36' } })).text();
  const ld = receitasJsonLd(html);
  return ld
    ? `Origem: site de receitas\nDados estruturados da receita (JSON-LD):\n${JSON.stringify(ld, null, 1)}`
    : `Origem: página de site (sem dados estruturados)\nTexto da página:\n${textoVisivel(html)}`;
}

// --- Execução ---
const cliente = new Anthropic();
const arquivos = readdirSync(SAIDA).filter(f => /^(instagram|youtube|site)-\d+\.json$/.test(f)).sort((a, b) => parseInt(a.match(/\d+/)) - parseInt(b.match(/\d+/)));
const resumo = [];
for (const arq of arquivos) {
  const nome = arq.replace('.json', '');
  const dados = JSON.parse(readFileSync(new URL(arq, SAIDA), 'utf8'));
  const texto = await entrada(nome, dados);
  const inicio = Date.now();
  try {
    const resp = await cliente.messages.parse({
      model: MODELO,
      max_tokens: 16000,
      system: INSTRUCOES,
      messages: [{ role: 'user', content: texto }],
      output_config: { format: zodOutputFormat(Receita) },
    });
    const custo = resp.usage.input_tokens * PRECO_ENTRADA + resp.usage.output_tokens * PRECO_SAIDA;
    const r = resp.parsed_output;
    writeFileSync(new URL(`${nome}.receita.json`, SAIDA), JSON.stringify({ receita: r, stop_reason: resp.stop_reason, usage: resp.usage }, null, 2));
    resumo.push({ nome, ok: !!r, eh_receita: r?.eh_receita, titulo: r?.titulo, ingredientes: r?.ingredientes.length, passos: r?.passos.length, tipos: r?.tipos,
      tokens_entrada: resp.usage.input_tokens, tokens_saida: resp.usage.output_tokens, custo_usd: +custo.toFixed(6), segundos: (Date.now() - inicio) / 1000, stop_reason: resp.stop_reason });
  } catch (e) {
    resumo.push({ nome, ok: false, erro: `${e.constructor.name}: ${e.message}`.slice(0, 300) });
  }
  const u = resumo.at(-1);
  console.log(`${nome}: ${u.ok ? `"${u.titulo}" ${u.ingredientes} ingr., ${u.passos} passos, tipos=${u.tipos?.join('|')} | ${u.tokens_entrada}+${u.tokens_saida} tokens, US$ ${u.custo_usd}, ${u.segundos}s` : `ERRO ${u.erro}`}`);
}
writeFileSync(new URL('resumo-ia.json', SAIDA), JSON.stringify(resumo, null, 2));
const ok = resumo.filter(r => r.ok);
const total = ok.reduce((s, r) => s + r.custo_usd, 0);
console.log(`\n${ok.length}/${resumo.length} extraídas. Custo total US$ ${total.toFixed(5)}; média US$ ${(total / ok.length).toFixed(5)} por receita.`);
