# Bom Bocado – Plano de implementação

> **Para agentes:** SUB-SKILL OBRIGATÓRIA: use superpowers:executing-plans (execução no próprio chat, um passo por pedido do Sergio). Os passos usam caixas de seleção (`- [ ]`) para acompanhar o andamento.

**Objetivo:** PWA Android "Bom Bocado": livro de receitas com login, livros compartilhados, busca e filtros, receitas adicionadas pelo Compartilhar do Android (Instagram, YouTube, sites) e lidas pela IA, e compartilhamento da receita como imagem.

**Arquitetura:** Laravel + Inertia + Vue 3 (Vite, PWA pelo `vite-plugin-pwa`) + MariaDB, num Docker de produção no notebook VPS-Claude (no modelo do `ERP-IPSim/producao`), publicado na internet pelo Tailscale Funnel. A leitura dos links roda na fila do Laravel e usa a API do Claude (Haiku). Desenvolvimento e testes no Docker `Teste-de-apps-pre-producao`.

**Tecnologias:** PHP 8.5, Laravel (versão estável atual, com o *starter kit* Vue), Inertia, Vue 3, TypeScript, Tailwind, MariaDB 11.4, PHPUnit, Playwright (só para capturas de tela), Node 26 (no Windows, para o `npm`), SDK PHP da Anthropic (ou HTTP direto, decidido no passo 7).

**Design:** `docs/superpowers/specs/2026-11-27-livro-de-receitas-design.md` (aprovado em 2026-11-27). Protótipos em `docs/prototipos/`. Quem executa um passo lê o design junto.

---

## Como usar este plano (para o Sergio)

- Cada **passo** é um pedido: abra a conversa no projeto e diga **"faça o passo N"**. Eu faço, testo, commito e digo **o que você confere** (quase sempre um link de imagem ou um teste no celular).
- Os passos marcados com 🙋 **são seus** (criar contas, clicar em painéis, testar no celular). Eu deixo tudo pronto e digo exatamente o que fazer.
- O tempo indicado é o **seu** tempo, não o meu.
- Os passos que **detalham uma fase** (ex.: "Passo 15: detalhar a Fase 3") só acrescentam a parte técnica a este arquivo. Você só lê o resumo e aprova.
- Dá para parar entre dois passos quaisquer. O andamento fica marcado aqui e em `docs/CHECKLIST.md`.

## Restrições gerais (valem para todos os passos)

- Textos, comentários, nomes e commits em português do Brasil (`CLAUDE.md` global).
- **Repositório público:** nenhum segredo no Git. Segredos só no `.env` (desenvolvimento) e em `C:\Receitas-producao\segredos\` (produção). O `.env.example` vai para o Git sem valores.
- Testes no Docker `Teste-de-apps-pre-producao` (skill `teste-de-apps-pre-producao`): o projeto aparece em `/projetos/Pessoal/Receitas`, com endereço `http://localhost:8085/receitas`. Ligar o Docker antes: `powershell -File C:\Automacao\docker-ligar.ps1`.
- Todo e-mail enviado em teste termina o assunto com ` - teste do docker`.
- Visual conforme a seção 9 do design: cores, fontes Unbounded + DM Sans, temas claro e escuro, layout da receita com foto nos 25% de cima e texto a partir dos 15%.
- Lista fixa de tipos: seção 5.6 do design.
- Consultar o `LICOES.md` global antes de investigar erros. Pegadinhas já conhecidas: `$` no `tinker --execute` pelo WSL; `|` no `--filter` do PHPUnit; `MSYS_NO_PATHCONV=1` no Git Bash; `queue:restart` depois de mudar código da fila.
- Toda imagem para o Sergio conferir é salva em `docs/capturas/` e passada como link Markdown clicável. Essa pasta fica fora do Git, porque as capturas são de conferência.

## Pontos de atenção (o que mais pode dar errado na mão do usuário)

1. **Texto do Compartilhar com sujeira em volta do link** (ex.: "Olha essa receita 😋 https://www.instagram.com/reel/abc/?igsh=xyz"): o app precisa achar o link, limpar os parâmetros de rastreio e nunca falhar por causa do texto. Teste no Passo 50.
2. **O mesmo link compartilhado duas vezes seguidas** (toque duplo): uma receita só. Teste no Passo 50 (duplicidade) e no Passo 56 (job).
3. **Busca sem acento e sem maiúsculas** ("acucar" acha "Açúcar"): teste no Passo 39.
4. **Foto da câmera grande ou em formato HEIC**: aceitar JPEG, PNG, WebP e HEIC até 15 MB e reduzir para 1600 px. Teste no Passo 32.
5. **Receita muito longa na imagem de compartilhamento** (30 ingredientes): a fonte diminui até o mínimo e depois a receita vira duas imagens. Teste no Passo 64.
6. **Exclusão de conta de quem é dono de um livro compartilhado com membros:** o livro passa para o membro mais antigo, e nenhuma receita de outra pessoa se perde. Teste no Passo 48a.

---

## Roteiro completo

### Fase 0 – Testar os riscos antes de construir

| Passo | Quem | O que acontece | O que você confere | Seu tempo |
|---|---|---|---|---|
| 1 | 🙋 + Claude | Você cola na conversa 3 links de receita do Instagram, 3 do YouTube e 3 de sites, que você usaria de verdade. Eu crio a pasta `pesquisa/` | Só colar os links | 5 min |
| 2 | Claude | Testo o que dá para ler de cada link sem IA (legenda, descrição, transcrição, dados da página, foto) e escrevo o relatório `pesquisa/relatorio-leitura.md` | Ler o resumo: o que funciona e o que não funciona em cada origem | 10 min |
| 3 | 🙋 | Ativar o Funnel no painel do Tailscale (eu passo os cliques exatos) | O painel mostra o Funnel liberado | 10 min |
| 4 | Claude | Publico uma página "Olá, Bom Bocado" temporária pelo Funnel | Abrir o link no celular **pelo 4G** (Wi-Fi desligado) | 5 min |
| 5 | Claude | Crio o `.env` e o `.env.example` com os campos vazios e comentados | Nada | 0 |
| 6 | 🙋 | Criar a conta na API da Anthropic (console.anthropic.com), pôr um crédito (US$ 5 bastam para testar), gerar a chave e colar no `.env` | O campo `ANTHROPIC_API_KEY` preenchido (eu só confiro o nome do campo, nunca o valor) | 15 min |
| 7 | Claude | Mando os textos do Passo 2 para o Claude Haiku e comparo as receitas extraídas, a tradução e o custo por receita | Ler 2 ou 3 receitas extraídas e o custo médio | 10 min |

### Fase 1 – Esqueleto do app

| Passo | Quem | O que acontece | O que você confere | Seu tempo |
|---|---|---|---|---|
| 8 | Claude | Laravel novo em `sistema/` (starter kit Vue, sem cadastro aberto), banco `receitas` no Docker de testes, endereço `localhost:8085/receitas` | Captura da tela de login padrão | 5 min |
| 9 | Claude | Ferramenta de capturas de tela do celular (Playwright, 360×760) | A mesma captura, agora no tamanho de celular | 5 min |
| 10 | Claude | Cores, fontes e temas claro e escuro do design aplicados ao app (página de amostra) | Captura clara e escura da página de amostra | 5 min |
| 11 | Claude | Ícone "Bom Bocado" (B) em PNG nos tamanhos do Android e o PWA básico (manifest e service worker mínimo) | Captura do ícone nos tamanhos e do manifest validado | 5 min |

### Fase 2 – Publicação inicial (o app no seu celular cedo)

| Passo | Quem | O que acontece | O que você confere | Seu tempo |
|---|---|---|---|---|
| 12 | Claude | `producao/` com Dockerfile, `compose.yaml` (web, fila, agendador, banco, porta 8095) e `publicar.ps1`, no modelo do ERP | Nada (revisão técnica minha) | 0 |
| 13 | 🙋 | Preencher a senha do banco de produção em `C:\Receitas-producao\segredos\compose.env` e conferir o `.env` de produção que eu deixo com os campos vazios | Campos preenchidos | 10 min |
| 14 | Claude | Primeira publicação; Funnel apontando para a porta 8095; a página temporária do Passo 4 sai do ar | Abrir o endereço no celular pelo 4G | 5 min |
| 15 | 🙋 | No Chrome do celular: menu → "Instalar app" | Ícone do Bom Bocado na tela inicial; o app abre em tela cheia | 5 min |

### Fase 3 – Contas e acesso

| Passo | Quem | O que acontece | O que você confere | Seu tempo |
|---|---|---|---|---|
| 16 | Claude | Detalhar a Fase 3 neste plano | Ler o resumo | 5 min |
| 17 | Claude | Usuários com administrador, bloqueio, foto e livro padrão; comando para criar o administrador | Nada | 0 |
| 18 | Claude | Tela de login no visual do app, com "lembrar de mim" longo e limite de tentativas | Captura clara e escura | 5 min |
| 19 | 🙋 | Criar a conta Gmail do app, ligar a verificação em duas etapas, gerar a "senha de app" e colar no `.env` (campos que eu deixo prontos) | Campos preenchidos | 15 min |
| 20 | Claude | Envio de e-mail funcionando (e-mail de teste) | Receber o e-mail de teste | 5 min |
| 21 | Claude | Convites: tela do administrador "Convidar pessoa" e e-mail com o link (7 dias, uso único) | Captura da tela e do e-mail | 5 min |
| 22 | Claude | Aceitar o convite: a pessoa cria a senha, e o livro pessoal nasce junto | Captura do fluxo | 5 min |
| 23 | Claude | Esqueci a senha, por e-mail | Receber o e-mail e trocar a senha (no Docker de testes) | 10 min |
| 24 | Claude | Bolinha do usuário (inicial sobre cor) e tela de opções do usuário (com "Sair") | Captura | 5 min |
| 25 | Claude | Trocar a foto: a bolinha passa a mostrar a foto | Captura | 5 min |
| 26 | Claude | Mudar a senha nas preferências | Captura | 5 min |
| 27 | 🙋 + Claude | Publico e crio a sua conta de administrador | No celular: entrar, pôr foto, trocar a senha | 10 min |

### Fase 4 – Receitas feitas à mão

| Passo | Quem | O que acontece | O que você confere | Seu tempo |
|---|---|---|---|---|
| 28 | Claude | Detalhar a Fase 4 | Ler o resumo | 5 min |
| 29 | Claude | Tabelas de livros, membros, receitas, ingredientes, passos, tipos (com a lista fixa), favoritos | Nada | 0 |
| 30 | Claude | Regras de permissão (seção 5.2 do design), com um teste para cada regra | Ler a tabela de permissões testadas | 5 min |
| 31 | Claude | Tela da lista vazia, com o convite "Adicione sua primeira receita" e o botão "+" | Captura | 5 min |
| 32 | Claude | Formulário de criar receita à mão, com foto (câmera ou galeria, HEIC, até 15 MB, reduzida a 1600 px) | Captura | 5 min |
| 33 | Claude | Tela da receita no layout aprovado (foto nos 25%, texto nos 15%, etiquetas coloridas, passos numerados) | Captura clara e escura | 5 min |
| 34 | Claude | Editar e apagar (só quem criou) | Captura | 5 min |
| 35 | Claude | Favoritar (estrela) | Captura | 5 min |
| 36 | Claude | Tela sempre ligada enquanto a receita está aberta | Nada (conferido no celular no 37) | 0 |
| 37 | 🙋 + Claude | Publico | No celular: criar 3 receitas, com foto tirada na hora | 15 min |

### Fase 5 – Lista, busca e filtros

| Passo | Quem | O que acontece | O que você confere | Seu tempo |
|---|---|---|---|---|
| 38 | Claude | Detalhar a Fase 5 | Ler o resumo | 5 min |
| 39 | Claude | Busca por nome e ingrediente, sem acento e sem maiúsculas | Captura com uma busca | 5 min |
| 40 | Claude | Filtros: chips dos tipos com as cores, favoritas e rascunhos | Captura | 5 min |
| 41 | Claude | Seletor de livro (todos, pessoal ou cada compartilhado) | Captura | 5 min |
| 42 | 🙋 + Claude | Publico | No celular: buscar por ingrediente e filtrar por tipo | 10 min |

### Fase 6 – Livros compartilhados

| Passo | Quem | O que acontece | O que você confere | Seu tempo |
|---|---|---|---|---|
| 43 | Claude | Detalhar a Fase 6 | Ler o resumo | 5 min |
| 44 | Claude | Criar, renomear e apagar livro compartilhado (ao apagar, as receitas voltam para o livro pessoal de quem as criou) | Captura | 5 min |
| 45 | Claude | Adicionar e remover membros pelo e-mail (só quem já tem conta) | Captura | 5 min |
| 46 | Claude | Dono do livro "tira do livro" uma receita (ela volta para o livro pessoal do autor) | Captura | 5 min |
| 47 | Claude | Mover receita entre livros (só o autor) e escolher o livro padrão nas preferências | Captura | 5 min |
| 48 | 🙋 + Claude | Publico; você convida alguém da família | No celular: criar o livro da família, adicionar a pessoa e conferir as permissões com ela | 15 min |
| 48a | Claude | **Excluir a própria conta** (design 5.14): senha + confirmação; livro pessoal apagado; receitas nos livros dos outros ficam como "autor removido" (o dono do livro passa a editar); livros dos quais ela é dona passam para o membro mais antigo ou são apagados; o único administrador não se exclui. Um teste para cada regra | Captura da tela de exclusão e a lista das regras testadas | 5 min |

### Fase 7 – Adicionar pelo Compartilhar (o coração do app)

| Passo | Quem | O que acontece | O que você confere | Seu tempo |
|---|---|---|---|---|
| 49 | Claude | Detalhar a Fase 7, com a técnica que funcionou na Fase 0 | Ler o resumo | 5 min |
| 50 | Claude | App no menu Compartilhar do Android: recebe o texto, acha e limpa o link, evita duplicidade e mostra "Recebida! Adicionando ao livro X" | Captura | 5 min |
| 51 | Claude | Leitura segura da página (só `http`/`https`, nunca endereços da rede de casa, tempo e tamanho máximos) | Nada | 0 |
| 52 | Claude | Leitor de sites (dados de receita da página + texto) | Exemplo de um dos sites do Passo 1 | 5 min |
| 53 | Claude | Leitor do YouTube (título, descrição e transcrição) | Exemplo de um dos vídeos do Passo 1 | 5 min |
| 54 | Claude | Leitor do Instagram (a técnica do Passo 2) | Exemplo de um dos posts do Passo 1 | 5 min |
| 55 | Claude | Chamada ao Claude Haiku com resposta em formato fixo, tipos da lista e tradução | Uma receita extraída | 5 min |
| 56 | Claude | Tudo junto na fila: cria a receita (com a foto baixada) ou o rascunho com o motivo | Nada | 0 |
| 57 | Claude | Aviso de rascunhos (selo na lista e contador) e "Completar rascunho" | Captura | 5 min |
| 58 | 🙋 + Claude | Publico | No celular: compartilhar 5 receitas reais (Instagram, YouTube e sites) e ver como ficaram | 15 min |

### Fase 8 – Limites de uso da IA

| Passo | Quem | O que acontece | O que você confere | Seu tempo |
|---|---|---|---|---|
| 59 | Claude | Detalhar a Fase 8 | Ler o resumo | 5 min |
| 60 | Claude | Registro de cada chamada à IA (tokens e custo estimado) | Nada | 0 |
| 61 | Claude | Cota diária por usuário (30) e teto mensal: estourou, a receita vira rascunho com o motivo | Captura do rascunho com o motivo | 5 min |
| 62 | Claude | Tela de administração: usuários (bloquear e desbloquear), limites e consumo do mês | Captura | 5 min |
| 63 | Claude | "Caixa de avisos": o app grava o aviso numa pasta, e uma tarefa do notebook envia pela `agentes@` (skill `emails`). Primeiro uso: teto em 80% e 100% | Receber um aviso de teste | 10 min |
| 63a | Claude | **Indicar alguém** (design 5.15): formulário nas opções do usuário; aviso ao administrador pela caixa de avisos; indicações pendentes na Administração com "Convidar" ou "Recusar"; limite de 5 por dia; sem repetir quem já tem conta ou convite | Captura do formulário e da lista na Administração; receber o aviso | 10 min |

### Fase 9 – Compartilhar como imagem

| Passo | Quem | O que acontece | O que você confere | Seu tempo |
|---|---|---|---|---|
| 64 | Claude | Detalhar a Fase 9 e gerar a imagem 9:16 no layout aprovado (receita longa: a fonte diminui e, se preciso, vira duas imagens) | Captura de uma receita curta e de uma longa | 10 min |
| 65 | Claude | Botão compartilhar abre o compartilhamento do Android com a imagem (se o celular não aceitar, baixa a imagem) | Nada | 0 |
| 66 | 🙋 + Claude | Publico | No celular: compartilhar uma receita no WhatsApp | 5 min |

### Fase 10 – Sem internet

| Passo | Quem | O que acontece | O que você confere | Seu tempo |
|---|---|---|---|---|
| 67 | Claude | Detalhar a Fase 10 e guardar no celular as receitas abertas e as fotos delas | Nada | 0 |
| 68 | Claude | Aviso "sem conexão" ao tentar adicionar, editar ou buscar | Captura | 5 min |
| 69 | 🙋 + Claude | Publico | No celular, em modo avião: abrir receitas já vistas | 5 min |

### Fase 11 – Backup, segurança e lançamento

| Passo | Quem | O que acontece | O que você confere | Seu tempo |
|---|---|---|---|---|
| 70 | Claude | Detalhar a Fase 11 e montar o backup diário (banco + fotos, 30 dias, em `C:\Receitas-producao\backup`) | Ver a primeira cópia criada | 5 min |
| 71 | Claude | Aviso de falha do backup pela caixa de avisos (Passo 63) | Receber um aviso de teste | 5 min |
| 72 | Claude | Ensaio de restauração do backup no Docker de testes | Ler o resultado (contagens batendo) | 5 min |
| 73 | Claude | Revisão de segurança (`/security-review`), conferência de que nenhum segredo está no Git e README público do repositório | Ler o resumo | 10 min |
| 73a | Claude | **FAQ** (design 5.13): item nas opções do usuário; 16 perguntas; tocar abre a resposta abaixo, tocar em outra troca, tocar fora fecha tudo; respostas num arquivo de texto do app. Antes de publicar, mostro o texto de todas as respostas para você aprovar (skill `escrita-humana`) | Ler e aprovar as respostas; captura da tela com uma pergunta aberta | 15 min |
| 74 | 🙋 | Convidar as primeiras pessoas | 🎉 | 10 min |

---

## Detalhe técnico – Fase 0

### Passo 1: links de exemplo

**Arquivos:**
- Criar: `pesquisa/links.md` (os 9 links do Sergio, agrupados por origem)
- Modificar: `.gitignore` (acrescentar `docs/capturas/` e `pesquisa/saida/`)

- [ ] Pedir os 9 links ao Sergio e gravá-los em `pesquisa/links.md`.
- [ ] Commit: `Pesquisa: links de exemplo para o teste de leitura`.

### Passo 2: teste de leitura sem IA

**Arquivos:**
- Criar: `pesquisa/ler-links.mjs` (Node 26, descartável, sem dependências além do `fetch` nativo; `yt-dlp` só se for preciso para a transcrição do YouTube, sempre em pasta própria)
- Criar: `pesquisa/saida/<origem>-<n>.json` (fora do Git)
- Criar: `pesquisa/relatorio-leitura.md`

**O que medir em cada link:** código HTTP; presença de `og:title`, `og:description` e `og:image`; JSON-LD `@type: Recipe`; texto da legenda ou descrição (primeiros 500 caracteres); para o YouTube, se há transcrição; se a foto baixa.
**Técnicas a testar no Instagram, em ordem:** (a) HTML público com o User-Agent de um navegador comum, lendo `og:description`; (b) a mesma URL com `/embed/captioned/`; (c) oEmbed (exige token da Meta: só anotar como alternativa). O User-Agent é genérico, sem nenhum dado do Sergio.

- [ ] Rodar `node pesquisa/ler-links.mjs pesquisa/links.md`. Resultado esperado: um JSON por link em `pesquisa/saida/`.
- [ ] Escrever `pesquisa/relatorio-leitura.md`: uma tabela (link × o que veio) e a **técnica recomendada por origem**, mais o que vira rascunho.
- [ ] Commit: `Pesquisa: teste de leitura de Instagram, YouTube e sites`.

### Passo 3: 🙋 liberar o Funnel

- [ ] Rodar `tailscale funnel status` no notebook. Se o Funnel não estiver liberado, o comando `tailscale funnel 8099` mostra um link do painel: passar o link ao Sergio, que clica em "Enable" (HTTPS + Funnel).
- [ ] Conferir: `tailscale funnel status` sem erro de permissão.

### Passo 4: página de teste pelo Funnel

**Arquivos:** criar `pesquisa/ola/index.html` (página "Olá, Bom Bocado").

- [ ] Servir a pasta em `127.0.0.1:8099` (servidor estático do Node, em segundo plano) e rodar `tailscale funnel --bg 8099`.
- [ ] Passar ao Sergio o endereço `https://<máquina>.<tailnet>.ts.net/`, para ele abrir no celular pelo 4G.
- [ ] Depois da confirmação: `tailscale funnel --https=443 off` e parar o servidor. Anotar o endereço no `CLAUDE.md`.

### Passo 5: `.env` vazio

**Arquivos:** criar `.env` e `.env.example` na raiz (o Laravel do Passo 8 ganha o próprio `.env` em `sistema/`; este é o da pesquisa).

Campos, cada um com um comentário curto acima dizendo onde achar o valor:
```
ANTHROPIC_API_KEY=
```
- [ ] Conferir que o `.env` está no `.gitignore` (`git check-ignore .env` mostra `.env`).
- [ ] Commit só do `.env.example`.

### Passo 6: 🙋 chave da API

- [ ] O Sergio cria a conta, põe o crédito, gera a chave e cola em `ANTHROPIC_API_KEY=`.
- [ ] Conferir só que o nome existe e não está vazio, sem mostrar o valor: `grep -c '^ANTHROPIC_API_KEY=.\+' .env` deve dar `1`.

### Passo 7: teste da IA

**Arquivos:**
- Criar: `pesquisa/extrair-ia.mjs` (lê `pesquisa/saida/*.json`, chama a API Messages com o modelo Haiku mais recente e uma ferramenta `registrar_receita` cujo esquema é o da seção 5.4 do design; grava `pesquisa/saida/<arquivo>.receita.json`)
- Criar: `pesquisa/relatorio-ia.md`

Antes, carregar a skill `claude-api`, para confirmar o ID do modelo, o preço e o formato de saída estruturada.

**Esquema da ferramenta (fonte única; o Passo 55 reusa):**
```json
{ "eh_receita": "boolean", "titulo": "string", "descricao": "string", "porcoes": "integer|null",
  "tempo_minutos": "integer|null",
  "ingredientes": [{ "texto": "string", "nome_busca": "string" }],
  "passos": ["string"], "tipos": ["um ou mais da lista 5.6"], "idioma_original": "string (ISO 639-1)" }
```
- [ ] Rodar com os 9 textos. Esperado: as receitas de verdade com `eh_receita: true`, tudo em português e só tipos da lista.
- [ ] `pesquisa/relatorio-ia.md`: acertos, erros e custo médio por receita, em reais.
- [ ] Commit: `Pesquisa: extração de receitas com o Claude Haiku`.
- [ ] Decidir e anotar no relatório: SDK PHP oficial da Anthropic ou HTTP direto pelo `Http::` do Laravel.

---

## Detalhe técnico – Fase 1

### Passo 8: Laravel no Docker de testes

**Arquivos:**
- Criar: `sistema/` (projeto Laravel, *starter kit* Vue com Inertia e TypeScript)
- Criar: `scripts/dc.sh` (cópia adaptada do `ERP-IPSim/scripts/dc.sh`, com `-w "/projetos/Pessoal/Receitas/sistema"`)
- Modificar: `C:\Projetos AI\Teste-de-apps-pre-producao\config\sites.conf` (+ `Alias /receitas "/projetos/Pessoal/Receitas/sistema/public"`) e `config\servidor.conf` (a linha correspondente, conforme a pegadinha da skill)

- [ ] Criar o projeto com o `composer` **do contêiner** (o `scripts/dc.sh` ainda não serve, porque a pasta `sistema/` não existe); usar `docker exec -w /projetos/Pessoal/Receitas Teste-de-apps-pre-producao composer create-project laravel/laravel sistema` e depois instalar o *starter kit* Vue, conforme a documentação da versão instalada.
- [ ] **Desligar o cadastro aberto:** remover as rotas e telas de registro (`register`). Teste `test_cadastro_aberto_nao_existe`: `GET /register` → 404.
- [ ] `.env` de `sistema/`: `APP_NAME="Bom Bocado"`, `APP_LOCALE=pt_BR`, `APP_URL=http://localhost:8085/receitas`, `DB_HOST=banco`, `DB_DATABASE=receitas` e `DB_PASSWORD=` (vazio; pedir ao Sergio, ou ler do `.env` do ambiente de testes sem mostrar). `.env.example` igual, sem valores.
- [ ] Criar o banco `receitas` no MariaDB de testes e rodar `scripts/dc.sh php artisan migrate`.
- [ ] `npm install` e `npm run build` em `sistema/` (no Windows). Atenção ao subcaminho `/receitas`: conferir se os *assets* do Vite carregam (ajustar `ASSET_URL` ou o `base` do Vite se for preciso).
- [ ] `scripts/dc.sh php artisan test`: todos passam.
- [ ] Reiniciar o contêiner `web` e conferir `curl -s -o /dev/null -w '%{http_code}' http://localhost:8085/receitas/login` → `200`.
- [ ] Atualizar o `CLAUDE.md` do projeto (tecnologias, estrutura, comandos). Commit: `Cria o Laravel do Bom Bocado (sem cadastro aberto)`.

### Passo 9: capturas de tela de celular

**Arquivos:**
- Criar: `scripts/capturar.mjs` (Playwright usando o Edge instalado, `channel: 'msedge'`, sem baixar navegador; viewport 360×760, `deviceScaleFactor: 2`, `isMobile: true`; parâmetros: `--url`, `--saida`, `--tema claro|escuro` via `colorScheme`, `--login email:senha` opcional)
- Modificar: `sistema/package.json` (`playwright` como devDependency) ou `package.json` na raiz (decisão minha: na raiz, para não misturar com o app)

- [ ] `node scripts/capturar.mjs --url http://localhost:8085/receitas/login --saida docs/capturas/login.png` gera o PNG.
- [ ] Mostrar o link ao Sergio. Commit: `Ferramenta de capturas de tela do celular`.

### Passo 10: tema visual

**Arquivos:**
- Criar: `sistema/resources/css/tema.css` (variáveis da seção 9 do design: cores-base claro e escuro, cores dos tipos, `@media (prefers-color-scheme: dark)`)
- Modificar: `sistema/resources/css/app.css` (importar o tema; fontes Unbounded 700 e DM Sans 400/500/700 **servidas pelo próprio app**, sem Google Fonts, para funcionar sem internet)
- Criar: `sistema/resources/js/pages/Amostra.vue` e a rota `/amostra` (só em `APP_ENV=local`)

- [ ] Teste `test_amostra_so_existe_em_local`: com `APP_ENV=production`, `GET /amostra` → 404.
- [ ] Capturas `amostra-claro.png` e `amostra-escuro.png`: chips de tipos, uma linha de lista e os botões. Comparar com `docs/prototipos/telas-bom-bocado.png`.
- [ ] Commit: `Tema visual do Bom Bocado (claro e escuro)`.

### Passo 11: ícone e PWA básico

**Arquivos:**
- Criar: `sistema/resources/icone/bom-bocado.svg` (o "Ícone B" de `docs/prototipos/icones-bom-bocado.html`: fundo `#4FB3FF`, massa `#F7C98B`, cobertura `#6B3E26`, confeitos branco, rosa e amarelo)
- Criar: `scripts/gerar-icones.mjs` (gera `public/icones/icone-192.png`, `icone-512.png`, `icone-maskable-512.png` (com margem de segurança) e `apple-touch-icon.png`, a partir do SVG, usando o Playwright do Passo 9)
- Modificar: `sistema/vite.config.ts` (`vite-plugin-pwa`: `name: "Bom Bocado"`, `short_name: "Bom Bocado"`, `display: "standalone"`, `theme_color: "#FFFFFF"`, `background_color: "#FFFFFF"`, os ícones e `start_url` relativo; o `share_target` só entra no Passo 50)

- [ ] `npm run build` gera `manifest.webmanifest` e `sw.js` em `public/build` (ou onde o plugin estiver configurado).
- [ ] Conferir o manifest com o Playwright: `navigator.serviceWorker.ready` resolve e o manifest tem os ícones 192 e 512.
- [ ] Captura com os ícones gerados lado a lado. Commit: `Ícone e PWA básico do Bom Bocado`.

---

## Detalhe técnico – Fase 2

### Passo 12: arquivos de produção

**Arquivos (modelo: `C:\Projetos AI\Empresas\IPSim\ERP-IPSim\producao\`):**
- Criar: `producao/Dockerfile` (`php:8.5-apache`, extensões `pdo_mysql intl zip gd exif bcmath opcache` + `mariadb-client`; `APACHE_DOCUMENT_ROOT=/app/sistema/public`)
- Criar: `producao/compose.yaml` (projeto `receitas-producao`; serviços `web` (`127.0.0.1:8095:80`), `fila` (`queue:work --tries=1 --timeout=120`), `agendador` (`schedule:work`) e `banco` (`mariadb:11.4`, volume `dados-banco`, healthcheck); volumes `/mnt/c/Receitas-producao/codigo:/app`, `/mnt/c/Receitas-producao/segredos:/segredos:ro`, `/mnt/c/Receitas-producao/backup:/backup` e `/mnt/c/Receitas-producao/fotos:/app/sistema/storage/app/public`)
- Criar: `producao/env.producao.exemplo` (o `.env` de produção sem valores: `APP_ENV=production`, `APP_DEBUG=false`, `APP_URL=https://<endereço do Funnel>`, banco, e-mail e `ANTHROPIC_API_KEY`)
- Criar: `producao/publicar.ps1` (como o do ERP: pede para digitar `producao`, recusa se `codigo\` tiver mudança local, `git pull`, sobe os contêineres, `composer install --no-dev`, `npm` **no Windows** (`npm ci && npm run build` em `codigo\sistema`), `migrate --force`, caches, `storage:link`, `queue:restart`, permissões de `storage`; aceita `-WhatIf` e `-Primeira`)
- Criar: `producao/LEIA-ME.md`

- [ ] Conferir que a porta 8095 está livre no WSL: `wsl -d Ubuntu-24.04 -- ss -ltn | grep 8095` não mostra nada.
- [ ] `publicar.ps1 -WhatIf` lista os passos sem executar nada.
- [ ] Commit: `Arquivos de produção do Bom Bocado (Docker no notebook)`.

### Passo 13: 🙋 segredos de produção

- [ ] Criar `C:\Receitas-producao\segredos\`, `backup\` e `fotos\`; copiar `env.producao.exemplo` para `segredos\.env` e criar `segredos\compose.env` com `BANCO_SENHA_ROOT=` vazio.
- [ ] O Sergio preenche `BANCO_SENHA_ROOT`, `DB_PASSWORD` (a mesma) e `ANTHROPIC_API_KEY`. `APP_KEY` é gerada pelo `-Primeira`.
- [ ] Conferir só os nomes das chaves preenchidas, sem os valores.

### Passo 14: primeira publicação + Funnel

- [ ] `publicar.ps1 -Primeira`: clona `https://github.com/SergioOCarv/Receitas.git` em `C:\Receitas-producao\codigo`, gera a `APP_KEY`, cria o banco e migra.
- [ ] `curl -s -o /dev/null -w '%{http_code}' http://localhost:8095/login` → `200`.
- [ ] `tailscale funnel --bg 8095`. Conferir `https://<endereço>/login` → `200` (de fora: pedir ao Sergio, pelo 4G).
- [ ] Tarefa no Agendador para religar a produção no login do Windows (no modelo de `instalar-tarefas.ps1 -Somente DockerLogon` do ERP) e conferir que o Funnel continua após reiniciar (o `--bg` é persistente; confirmar).
- [ ] Atualizar o `CLAUDE.md` (endereço, comandos de produção). Commit.

### Passo 15: 🙋 instalar no celular

- [ ] O Sergio abre o endereço no Chrome do Android → menu ⋮ → "Instalar app".
- [ ] Esperado: o ícone azul da rosquinha na tela inicial com o nome "Bom Bocado"; ao abrir, tela cheia sem a barra do Chrome, na tela de login.
