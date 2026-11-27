# Relatório – teste da IA (Fase 0, passo 7)

Data: 2026-11-27. Script: `pesquisa/extrair-ia.mjs` (SDK oficial `@anthropic-ai/sdk` 1.14 + Zod; saídas em `pesquisa/saida/*.receita.json`, fora do Git).
Modelo: **Claude Haiku 5.5** (`claude-haiku-5-5`), com **saída estruturada** (`messages.parse` + `output_config.format`): a resposta já vem validada no formato fixo da receita (design 5.4), com os tipos limitados à lista 5.6.

## Resultado (3ª rodada, com as instruções finais)

| Link | Receita extraída | Ingr. | Passos | Tipos marcados | Custo (US$) |
|---|---|---|---|---|---|
| Instagram 1 | Bolo Beijinho Vulcão | 14 | 5 | assado, doce, sobremesa, prato principal ⚠️ | 0,00074 |
| Instagram 2 | Frango com creme de milho | 16 | 5 | quente, frito, prato principal | 0,00079 |
| Instagram 3 | Mousse de maracujá | 3 | 3 | gelado, doce, sobremesa | 0,00041 |
| YouTube Short | Lasanha de frigideira | 7 | 5 | quente, prato principal, pão/massa | 0,00071 |
| YouTube 5 | Bolo nuvem recheado com brigadeiro | 17 | 9 | assado, gelado, doce, sobremesa, vegetariano | 0,00222 |
| YouTube 6 | Torta salgada de frango de liquidificador | 19 | 11 | quente, assado, prato principal, lanche, café da manhã | 0,00140 |
| Site (notícia) | Misto-quente gratinado de forno | 9 | 8 | quente, assado, lanche, café da manhã, salgado, prato principal ⚠️, pão/massa | 0,00080 |
| Tudo Gostoso | Carne de panela com batata | 8 | 7 | quente, cozido, prato principal | 0,00056 |
| Nestlé | Pudim de Leite Condensado | 5 | 6 | assado, gelado, doce, sobremesa | 0,00057 |

**9 de 9 extraídas**, todas em português, com ingredientes, passos, partes da receita ("[Calda]", "[Pudim]") e nomes de busca sem marca ("Leite MOÇA®" → "leite condensado").

## Custo
- **Média: US$ 0,0009 por receita** (cerca de **R$ 0,005**, meio centavo, com o dólar a ~R$ 5,50). O total das três rodadas de teste ficou abaixo de US$ 0,03.
- Receitas com transcrição de vídeo custam mais (até US$ 0,0022), porque o texto de entrada é maior.
- Referência: **1.000 receitas ≈ US$ 0,90 (≈ R$ 5)**. A cota diária de 30 receitas por pessoa (design 5.5) custaria no máximo ≈ R$ 0,15 por pessoa por dia.
- Tempo: de 2 a 12 segundos por receita (roda na fila, em segundo plano, então a pessoa não espera).

## O que aprendemos (entra no passo 55)

1. **Descrição do YouTube pode ter só os ingredientes**, com o preparo falado no vídeo (vídeos 5 e 6). Regra: **se a descrição não trouxer passos, buscar a transcrição** (`yt-dlp`) e mandar as duas juntas. Com a transcrição, os dois vídeos passaram de 0 para 9 e 11 passos.
2. O `yt-dlp` funcionou para os três vídeos quando os pedidos foram feitos com pausa (`--sleep-requests 3` e alguns segundos entre vídeos). Sem pausa, o YouTube deu 429 no segundo pedido (passo 2).
3. **Os tipos precisam de definição na instrução.** Só com os nomes, a IA marcou bolos como "bebida" e a torta de frango como "vegetariano". Com uma linha de definição para cada tipo (está em `extrair-ia.mjs`), esses erros sumiram. Ainda sobram escolhas discutíveis, como bolo e misto-quente como "prato principal". Ajustes para o passo 55: dizer que "prato principal" é refeição de almoço ou jantar, nunca bolo ou sanduíche; e limitar a no máximo 4 tipos por receita.
4. **Nomes de busca:** a instrução para separar "sal e pimenta" em dois itens e não confundir leite líquido com leite em pó funcionou.
5. Os títulos às vezes vêm com Maiúsculas Em Cada Palavra ("Pudim de Leite Condensado"). O app pode padronizar ao salvar (só a primeira letra maiúscula), sem depender da IA.
6. A IA traduz e responde em português mesmo quando a origem é em português. O teste não teve receita em outro idioma: fica para o passo 58, com um link em inglês.

## Decisão para o app (Laravel)
- Usar o **SDK oficial da Anthropic para PHP**, não chamadas HTTP feitas à mão: é o padrão recomendado, e a saída estruturada (`output_config.format`) existe nele. A sintaxe exata vem da documentação do SDK PHP no passo 55.
- Mesmo modelo (`claude-haiku-5-5`), mesmo esquema e as instruções finais deste teste como ponto de partida.
