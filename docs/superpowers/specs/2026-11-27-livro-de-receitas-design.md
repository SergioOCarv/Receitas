# Bom Bocado (livro de receitas) – Design

Data: 2026-11-27. Origem: entrevista com o Sergio (perguntas P1 a P30).
Situação: **aprovado pelo Sergio em 2026-11-27**.

Marcação: o que não tem marca foi decidido pelo Sergio. O que está como **(decisão minha)** foi preenchido pelo Claude e pode ser contestado.

## 1. Intenção

Um livro de receitas no celular ou tablet Android. Quem vê uma receita no Instagram, no YouTube ou num site toca em **Compartilhar → (app)**, e a receita entra no livro sozinha, organizada, **sem nenhuma pergunta**. O livro tem visual limpo e moderno: uma lista com busca por nome e ingrediente e filtro por tipo (quente, frio, gelado, assado, bebida…). O app é aberto a outras pessoas, mas o acesso é controlado: só o Sergio cria contas.

## 2. Objetivos, não objetivos e antiobjetivos

**Objetivos**
- Adicionar uma receita com o mínimo de toques: Compartilhar → app → pronto.
- Achar uma receita rápido: busca por nome ou ingrediente e filtro por tipo.
- Ler a receita na cozinha: foto grande, texto claro, tela sempre ligada.
- Compartilhar uma receita como imagem, por qualquer app do celular.
- Livros compartilhados entre pessoas (ex.: livro da família).

**Não objetivos (fora da primeira versão)**
- iPhone (o PWA não entra no "Compartilhar" do iOS).
- Publicar na Play Store.
- Transcrever o áudio de vídeos (só texto: legenda, descrição e transcrição já existente do YouTube).
- Porções ajustáveis, lista de compras e modo passo a passo.
- Cadastro aberto ao público.
- Mais preferências do usuário além de foto, senha e livro padrão (a tela fica pronta para crescer).

**Antiobjetivos (seria um fracasso mesmo funcionando)**
- O app perguntar alguma coisa na hora de adicionar a receita.
- Uma conta de IA surpresa (custo descontrolado).
- Perder receitas: por falha de leitura, por alguém apagar o que é dos outros ou por falta de backup.

## 3. Restrições

- Roda num **Docker novo no notebook VPS-Claude** (Windows 11 + WSL), exposto à internet pelo **Tailscale Funnel**, com endereço fixo `https://<máquina>.<tailnet>.ts.net`, sem domínio próprio e sem custo.
- O notebook ou a internet de casa fora do ar = app fora do ar. Aceito; migrar para uma VPS depois é possível, mas troca o endereço e todos reinstalam o app.
- O **repositório `SergioOCarv/Receitas` é público**: nenhum segredo no código. Chave da API, senha do Gmail e senhas do banco ficam só no `.env` (regras do `CLAUDE.md` global).
- Os testes rodam no Docker `Teste-de-apps-pre-producao` (regra global). Consultar o `LICOES.md` global antes de escolher configurações.
- Textos, comentários e commits em português do Brasil.

## 4. Abordagens consideradas

| Tema | Escolhida | Descartadas e motivo |
|---|---|---|
| Tipo de app | **PWA** instalável pelo Chrome, com *Web Share Target* | App nativo por APK (mais código, atualização manual, Play Store paga); site sem instalar (não aparece no Compartilhar) |
| Canal do link | **Compartilhar do Android** | Bot no Telegram (depende de outro app; pode virar canal extra no futuro); WhatsApp (API paga e burocrática) |
| Leitura do link | **API do Claude (Haiku)** sempre | Leitura sem IA (falha em Instagram e YouTube e não classifica o tipo) |
| Servidor | **Laravel + MariaDB + Vue** | Next.js + SQLite (pilha nova para o Sergio); FastAPI + front-end separado (dois projetos) |
| Hospedagem | **Notebook + Tailscale Funnel** | Domínio próprio + Cloudflare Tunnel (cerca de R$ 40 por ano); VPS (R$ 25 a 50 por mês); túnel rápido (o endereço muda) |

## 5. O que o app faz

### 5.1 Contas e acesso
- Login com e-mail e senha. Sessão longa ("lembrar de mim"), para o Compartilhar funcionar sem pedir login toda vez **(decisão minha)**.
- **Só o administrador (Sergio) cria contas**, por convite: informa nome e e-mail, e o app manda um link para a pessoa criar a senha. O link vale 7 dias e serve uma vez só **(decisão minha)**.
- **Esqueci a senha:** link de redefinição por e-mail, enviado por uma conta Gmail nova, só do app, via SMTP com "senha de app" (no `.env`).
- Ícone do usuário: uma bolinha no canto superior direito. Sem foto, mostra a inicial do nome sobre uma cor **(decisão minha)**; com foto, a foto toma o lugar da cor.
- Tocar na bolinha abre as **opções do usuário**: trocar a foto, **mudar a senha**, escolher o **livro padrão** e sair. O administrador vê também o item "Administração".

### 5.2 Livros e permissões
- Todo usuário tem um **livro pessoal**, privado e criado junto com a conta.
- Qualquer usuário pode criar **livros compartilhados** e adicionar **usuários que já têm conta** (pelo e-mail).
- Num livro compartilhado:
  - os membros **veem** todas as receitas e **adicionam** receitas;
  - **só quem criou a receita pode editá-la e apagá-la**;
  - o **dono do livro** pode **tirar uma receita do livro**: ela não é apagada, volta para o livro pessoal de quem a criou;
  - o dono adiciona e remove membros. Quando um membro sai, as receitas dele voltam para o livro pessoal dele **(decisão minha, coerente com a regra anterior)**.
  - Se o dono apagar o livro, cada receita volta para o livro pessoal de quem a criou **(decisão minha)**.
- **Livro padrão:** destino das receitas que chegam pelo Compartilhar. Escolhido nas preferências; no começo, o pessoal. Dá para mover uma receita depois, entre livros em que o usuário é membro, desde que seja o autor dela **(decisão minha)**.

### 5.3 Adicionar receita pelo Compartilhar
1. No Instagram, YouTube ou navegador: Compartilhar → ícone do app.
2. O Android abre o app na rota de recebimento (o *Web Share Target* do `manifest`), com o texto e o link.
3. O app extrai o link do texto, registra o pedido e responde na hora: "Recebida! Já está sendo adicionada ao livro X". Dá para voltar ao Instagram em seguida.
4. Um processo em segundo plano (fila do Laravel) lê o link e cria a receita.
5. A receita aparece no livro. Se algo falhar, ela entra como **rascunho** e o app mostra um aviso (um selo na lista e um contador de rascunhos) **(decisão minha sobre a forma do aviso)**.
6. Se o mesmo link já estiver no mesmo livro, o app não duplica e só avisa "já estava no livro" **(decisão minha)**.

### 5.4 Leitura do link (extração)
- **Coleta do texto, conforme a origem** (decisão minha sobre a técnica; **o passo 1 do plano é um teste real com o Instagram**, o maior risco):
  - **Site:** HTML da página; se houver dados de receita no padrão `schema.org/Recipe` (JSON-LD), eles vão junto, como pista forte.
  - **YouTube:** título, descrição e transcrição (legenda), quando existir.
  - **Instagram:** legenda do post público (pelos metadados da página ou pelo método que o teste do passo 1 mostrar que funciona).
- **IA:** Claude Haiku com resposta em formato fixo (JSON validado), com: `eh_receita`, título, descrição curta, porções, tempo, ingredientes (lista de textos, cada um com o nome do ingrediente separado para a busca), modo de preparo (lista de passos), tipos (somente da lista fixa, um ou mais) e idioma original.
- **Sempre em português:** a IA traduz quando a receita vem em outro idioma. O link original fica guardado e visível na receita.
- **Foto:** a imagem principal do post, vídeo ou página é **baixada e guardada no servidor** (os links do Instagram expiram), redimensionada para no máximo 1600 px de largura **(decisão minha)**.
- **Falha** (não é receita, página bloqueada, vídeo só falado, limite estourado): salva **rascunho** com o link, a foto e o texto que deu para pegar.

### 5.5 Limites de uso da IA
- Cota por usuário por dia (começa em 30) e teto mensal geral em reais. As duas ficam ajustáveis pelo administrador.
- O app registra cada chamada (usuário, data e custo estimado pelos tokens).
- Cota ou teto estourado: a receita entra como rascunho, com o motivo. O administrador recebe um e-mail pela `agentes@ipsim.com.br` quando o teto mensal passar de 80% e de 100% **(decisão minha)**.

### 5.6 Tipos (lista fixa)
Proposta inicial **(decisão minha, para o Sergio aprovar ou mudar)**: quente, frio, gelado, assado, frito, cozido, cru/salada, bebida, doce, salgado, sobremesa, lanche, café da manhã, prato principal, acompanhamento, molho, pão/massa, vegetariano.
A IA escolhe um ou mais, e o usuário pode trocar ao editar.

### 5.7 Lista, busca e filtros
- Tela inicial: lista de receitas com foto em miniatura, título e tipos. A mais recente vem primeiro **(decisão minha)**.
- **Busca** num campo só, que procura no título e nos ingredientes, sem diferenciar acentos nem maiúsculas.
- **Filtros** em "chips" roláveis: tipos, favoritos e rascunhos. Um seletor escolhe o livro: todos, pessoal ou cada compartilhado.
- **Favoritos:** uma estrela na receita. Cada usuário tem os próprios favoritos.
- Botão "+" para criar uma receita à mão.

### 5.8 Tela da receita
- **Foto no topo**, ocupando cerca de 25% da altura da tela, com degradê para transparente na parte de baixo.
- **O texto da receita sobe sobre a foto a partir de cerca de 15% da tela**: título, tipos, porções e tempo, ingredientes e modo de preparo.
- Ações: favoritar, **compartilhar como imagem**, editar e apagar (só para o autor), tirar do livro (só para o dono do livro), mover de livro e abrir o link original.
- **Tela sempre ligada** enquanto a receita estiver aberta (Wake Lock API).
- Receita sem foto: ilustração ou cor neutra no lugar **(decisão minha)**.

### 5.9 Editar e criar à mão
O mesmo formulário serve para criar e editar: título, foto (câmera ou galeria), porções, tempo, tipos, ingredientes (um por linha), passos (um por linha) e link de origem. Para completar um rascunho, abre-se esse mesmo formulário.

### 5.10 Compartilhar como imagem
- Gera uma **imagem vertical 9:16 (formato de story)**: foto em cima, título, ingredientes e modo de preparo resumidos e o nome do app discreto no rodapé.
- Receita longa: a fonte diminui até um limite; se ainda não couber, viram **duas imagens** **(decisão minha sobre o limite)**.
- Gerada **no próprio celular** (desenho em canvas) e entregue ao **compartilhamento nativo do Android** (`navigator.share` com arquivo), onde a pessoa escolhe WhatsApp, Instagram etc. **(decisão minha sobre a técnica)**.

### 5.11 Sem internet
As receitas já abertas e as fotos delas ficam guardadas no celular (*service worker*) e abrem sem internet. Adicionar, editar e buscar no servidor exigem conexão.

### 5.12 Administração (só o Sergio)
Tela simples, com: convidar usuário; lista de usuários com opção de bloquear ou desbloquear; ajustar a cota diária e o teto mensal; ver o consumo de IA no mês.

## 6. Arquitetura (decisões minhas, salvo onde indicado)

- **Laravel** (versão estável atual, PHP 8.5) + **MariaDB** + **Vue 3** com **Inertia** e **Vite**. O PWA (manifest, ícones, service worker) vem do `vite-plugin-pwa`.
- **Docker Compose de produção** no notebook, com quatro contêineres: `app` (nginx + php-fpm), `fila` (`queue:work`), `agendador` (`schedule:work`, para limites e backup) e `banco` (MariaDB). Fotos num volume próprio.
- **Tailscale Funnel** no notebook apontando para a porta do `app`.
- **Fila no banco** (driver `database`), sem Redis.
- Busca: índice FULLTEXT ou `LIKE` sobre título e ingredientes, com *collation* `utf8mb4_unicode_ci`, que já ignora acentos.

### 6.1 Dados (visão geral)
- `usuarios`: nome, e-mail, senha (hash), foto, é_admin, bloqueado, livro_padrao_id.
- `convites`: e-mail, nome, token, expira_em, usado_em.
- `livros`: nome, dono_id, é_pessoal.
- `livro_membros`: livro_id, usuario_id.
- `receitas`: livro_id, autor_id, situação (rascunho/pronta), título, descrição, porções, tempo, foto, link_origem, idioma_original, motivo_rascunho.
- `ingredientes`: receita_id, ordem, texto, nome_busca.
- `passos`: receita_id, ordem, texto.
- `tipos` e `receita_tipo`.
- `favoritos`: usuario_id, receita_id.
- `pedidos_importacao`: usuario_id, livro_id, link, situação, erro, receita_id.
- `uso_ia`: usuario_id, data, tokens, custo_estimado.
- `configuracoes`: cota diária, teto mensal.

## 7. Segurança
- Senhas com hash (padrão do Laravel). Limite de tentativas no login e no "esqueci a senha".
- HTTPS pelo Funnel. Proteção CSRF do Laravel.
- Toda ação confere a permissão no servidor (seção 5.2), não só na tela.
- Ao baixar o link: só `http`/`https`, nunca endereços internos (rede local, `localhost`), com tempo limite e tamanho máximo **(decisão minha, para evitar que o servidor seja usado para acessar a rede de casa)**.
- Segredos só no `.env`. O `.env.example` (sem valores) vai para o Git.

## 8. Backup
- Diário e automático: dump do banco + pasta de fotos, compactados, guardando os últimos 30 dias.
- Destino: uma pasta no notebook fora do projeto **(decisão minha; o local exato entra no plano)**.
- Se falhar, e-mail de aviso pela `agentes@ipsim.com.br` (skill `emails`).

## 9. Visual (aprovado em 2026-11-27)

Referência: `docs/prototipos/telas-bom-bocado.png` (telas) e `docs/prototipos/icones-bom-bocado.png` (ícone B). Os arquivos `.html` ao lado são a fonte dos protótipos.

- **Nome do app: Bom Bocado.**
- **Ícone:** rosquinha inclinada, mordida no canto, cobertura de chocolate com gotas e poucos confeitos (branco, rosa e amarelo), sobre **fundo azul `#4FB3FF`**, com cantos arredondados (protótipo "Ícone B").
- **Direção visual "Cor por tipo" (opção C):** cada tipo tem cor própria, e a cor é a mesma no filtro, nas etiquetas da lista e na receita.
  - Cores (tema claro): quente `#FF6B2C`, gelado `#4FB3FF`, assado `#C8873A`, bebida `#9B6CFF`, doce `#FF6FA5`, frio `#2BB673`. Os outros tipos ganham cores no mesmo espírito.
  - No tema escuro, as mesmas cores um pouco mais vivas (ex.: quente `#FF7A3D`).
- **Cores-base:** claro com fundo `#FFFFFF`, texto `#121212` e campos `#F1F1F1`; escuro com fundo `#17171B`, texto `#F1F1F3` e campos `#26262C`. O app segue o tema do celular.
- **Fontes:** títulos e nome em **Unbounded** (700); texto em **DM Sans**.
- **Lista:** topo com "Bom Bocado" e a bolinha do usuário; campo de busca arredondado; filtros em chips com um ponto da cor do tipo (o chip ativo fica cheio da cor); linhas com foto quadrada arredondada (68 px), título e etiquetas coloridas; rascunho com etiqueta tracejada; favorita com estrela; botão "+" redondo no canto inferior.
- **Receita:** foto nos 25% de cima, sumindo para baixo; título grande em Unbounded começando nos 15%; etiquetas dos tipos, porções e tempo; ingredientes em linhas com divisória fina; passos com número dentro de um círculo da cor do tipo principal. No topo, sobre a foto: voltar (esquerda), estrela e **compartilhar** (direita). O botão de compartilhar tem o símbolo de três círculos ligados, em branco, dentro de um **círculo laranja `#FF6B2C`**.
- **Imagem de compartilhamento (9:16):** foto em cima, com curva no canto inferior esquerdo; fundo laranja `#FF6B2C`; título em Unbounded branco; ingredientes e preparo resumidos; "Bom Bocado" no rodapé. É igual nos dois temas.

## 10. Plano e forma de trabalho
- Passos de 5 a 15 minutos do tempo do Sergio. Cada passo é um pedido ("faça o passo N"): o Claude faz, testa, commita e diz o que conferir.
- Passos que só o Sergio pode fazer ficam marcados à parte: conta da API da Anthropic, conta Gmail com senha de app, Tailscale Funnel no painel e testes no celular.
- **Passo 1:** teste real de leitura de posts públicos do Instagram (e do YouTube) e confirmação de que o Funnel está liberado.

## 11. Riscos conhecidos
- **Instagram** pode bloquear a leitura ou mudar sem aviso. A mitigação é o rascunho com o link, para completar à mão.
- **Funnel:** tem limite de banda não divulgado e o endereço é feio. A mitigação é migrar para um domínio próprio se crescer.
- **Notebook fora do ar** = app fora do ar.
