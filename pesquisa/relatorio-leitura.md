# Relatório – teste de leitura sem IA (Fase 0, passo 2)

Data: 2026-11-27. Script: `pesquisa/ler-links.mjs` (as saídas brutas ficam em `pesquisa/saida/`, fora do Git).
Links: os 9 de `pesquisa/links.md` (3 Instagram, 3 YouTube, 3 sites).

## Resumo

| Origem | Funcionou? | De onde vem a receita | Foto |
|---|---|---|---|
| Instagram (3/3) | ✅ só com **navegador de verdade** (Edge/Chromium sem tela) | Legenda completa do post na meta `og:description` (800 a 1.540 caracteres, com ingredientes e preparo) | ✅ `og:image` |
| YouTube vídeo normal (2/2) | ✅ com `fetch` simples | **Descrição do vídeo** (1.000 a 1.400 caracteres, com a lista de ingredientes) | ✅ miniatura |
| YouTube Short (1/1) | ✅ só com **`yt-dlp`** | Descrição vazia ("Olá pessoal…"): a receita é **falada**; veio pela **legenda automática em português** (323 caracteres, receita completa e curta) | ✅ miniatura |
| Site de receita (2/2) | ✅ com `fetch` simples | Dados estruturados `schema.org/Recipe` (JSON-LD), com ingredientes e passos separados | ✅ `og:image` |
| Site, notícia com receita (1/1) | ✅ com `fetch` simples | Sem dados estruturados; a receita está **no meio do texto** da notícia (ingredientes, porções e preparo) | ✅ `og:image` |

**Conclusão: as 9 receitas são legíveis.** Nenhuma virou rascunho.

## O que aprendemos (vale para o app)

### Instagram
- O Compartilhar do Instagram manda **links curtos** `instagram.com/share/<código>`. Eles **não redirecionam pelo servidor**: quem leva ao post é o JavaScript da página.
- Um `fetch` simples, mesmo no endereço final do post (`/reel/<id>/`), **não traz a legenda** (a página vem sem `og:description`). A versão incorporada (`/embed/captioned/`) também vem vazia sem navegador.
- Num **navegador de verdade sem tela** (testado com o Edge `--headless --dump-dom`), os 3 links abriram o post, e a meta `og:description` trouxe a **legenda inteira** com a receita, além de `og:url` (endereço final do post) e `og:image` (foto).
- A legenda começa com "N likes, N comments - <perfil> no <data>:" e termina com chamadas como "Bjs SAN": a IA ignora isso.
- **Não** usamos truques de disfarce (fingir ser o robô do Facebook etc.). O app abre o link como um navegador comum.
- **Risco:** o Instagram não gosta de leitura automática e pode passar a pedir login ou bloquear sem aviso. No nosso volume (uso pessoal e familiar, poucas receitas por dia, IP de casa) o risco é baixo. Se acontecer, a receita entra como **rascunho** com o link (decisão P13).

### YouTube
- O link do celular vem como `youtube.com/shorts/<id>?si=...`: o `si` é rastreio e sai.
- Vídeos normais: a página traz `ytInitialPlayerResponse` com título, canal e **descrição completa**. Nos dois testados, a receita estava inteira na descrição.
- Transcrição: a página lista as legendas (inclusive a automática em português), mas o endereço da legenda **responde vazio** sem um "token" que hoje só navegadores e ferramentas especializadas geram.
- O **`yt-dlp`** (ferramenta livre, mantida pela comunidade) baixou a legenda automática do Short sem problema. Na segunda tentativa em sequência, o YouTube respondeu **HTTP 429 (muitas requisições)**: há limite. Ele também recomenda instalar o `deno` (motor de JavaScript) para funcionar bem.
- Ordem recomendada: **descrição primeiro**; a transcrição só quando a descrição não tem a receita (caso dos Shorts). Se der 429, a receita vira rascunho com o motivo "YouTube limitou a leitura; tente de novo mais tarde".

### Sites
- Sites de receita grandes (Tudo Gostoso, Nestlé) têm **JSON-LD `Recipe`**: ingredientes em lista e passos (às vezes em seções, como "Calda" e "Pudim" na Nestlé).
- A **Nestlé tem duas entradas `Recipe`** na mesma página, e a primeira só tem avaliações: o app deve ficar com a **mais completa** (a que tem `recipeIngredient`).
- **Notícia com receita** (Tudo Gostoso, misto-quente): sem JSON-LD, a receita está no texto. O texto da página precisa ser limpo (tirar scripts, menus e entidades HTML como `&atilde;`) antes de ir para a IA, porque o texto bruto tem ~12 mil caracteres, a maior parte de menu.
- Links de anúncio chegam com muito rastreio (`utm_*`, `gclid`, `gbraid`, `gad_*`, `gclsrc`): limpar antes de guardar e de comparar duplicidade.

## Técnica recomendada por origem

| Origem | Como ler | Vira rascunho quando |
|---|---|---|
| Instagram | Navegador sem tela (Chromium no Docker de produção) abre o link (inclusive `/share/`) e lê `og:description`, `og:url` e `og:image` | Página pede login, post privado ou apagado, legenda sem receita |
| YouTube | `fetch` da página → descrição; se a descrição não tiver receita, `yt-dlp` para a legenda automática em português | Sem receita na descrição nem na legenda; 429 do YouTube |
| Site | `fetch` → JSON-LD `Recipe` (a entrada mais completa) como pista principal + texto limpo da página; tudo vai para a IA | Página não é receita; bloqueio do site |

Em todos os casos, **a IA recebe o texto e devolve a receita no formato fixo** (passo 7), mesmo quando o JSON-LD já vem organizado: assim ela também classifica os tipos, traduz e padroniza.

## Impacto no projeto

1. **O servidor de produção precisa de um navegador sem tela** (Chromium) e do **`yt-dlp`** (+ `deno`). Proposta: um contêiner separado, o `leitor`, que recebe um link e devolve o texto, para não pesar no contêiner do app. Isso entra no design (seção 6) e no detalhe da Fase 7.
2. No passo 7 (teste da IA), os textos de entrada são: legenda do Instagram (3), descrição do YouTube (2), transcrição do Short (1), JSON-LD (2) e texto limpo da notícia (1).
3. Pontos de atenção do plano confirmados: **limpeza de rastreio** (ponto 1) e **duplicidade** (ponto 2), que depende do link limpo e do endereço final.

## Para o passo 7
- Gerar os 9 textos de entrada a partir de `pesquisa/saida/`.
- Para o Short, usar `pesquisa/saida/yt/T1wIU_EYhS4.pt.json3`.
