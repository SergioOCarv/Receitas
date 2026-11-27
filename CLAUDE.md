# Bom Bocado (projeto Receitas)

Andamento: docs/CHECKLIST.md
Design (aprovado): docs/superpowers/specs/2026-11-27-livro-de-receitas-design.md
Plano: docs/superpowers/plans/2026-11-27-bom-bocado.md

## Objetivo e contexto

Projeto pessoal do Sergio. App Android (PWA) **"Bom Bocado"**: livro de receitas com login (contas criadas só por convite do Sergio), livros pessoais e compartilhados, busca por nome e ingrediente e filtro por tipo. As receitas entram pelo **Compartilhar do Android** (Instagram, YouTube, sites), sem perguntas: o servidor lê o link e a API do Claude (Haiku) monta a receita. Também compartilha a receita como imagem 9:16. Aberto pela internet via Tailscale Funnel.

O Sergio faz o projeto **passo a passo, nas horas vagas**: cada passo do plano é um pedido "faça o passo N". Passos 🙋 são dele.

## Tecnologias e versões

**Laravel 12.74** (starter kit `laravel/vue-starter-kit`: Vue 3 + Inertia + TypeScript + Tailwind; telas de login em `sistema/resources/js/pages/auth/`), PHP 8.5, MariaDB 11.4, Vite + `vite-plugin-pwa`, Node 26 (no Windows, para o `npm`), Playwright (capturas de tela). Produção: Docker no WSL do notebook VPS-Claude, porta 8095, publicado pelo Tailscale Funnel em **https://vps-claude.tail263835.ts.net/** (Funnel liberado na conta do Tailscale em 2026-11-27; ligar: `tailscale funnel --bg <porta>`; desligar: `tailscale funnel --https=443 off`; ver: `tailscale funnel status`).

## Estrutura de pastas

```
CLAUDE.md        este arquivo
.gitignore
docs/
  CHECKLIST.md   andamento (um item por passo)
  superpowers/specs/   design aprovado
  superpowers/plans/   plano passo a passo
  prototipos/    protótipos visuais (HTML + PNG); aprovados: telas-bom-bocado e icones-bom-bocado (B)
  capturas/      capturas para o Sergio conferir (fora do Git)
pesquisa/        testes descartáveis da Fase 0  [a partir do passo 1]
sistema/         app Laravel (endereço de testes: http://localhost:8085/receitas)
producao/        Docker e scripts de produção  [a partir do passo 12]
scripts/         dc.sh (comando no contêiner de testes), criar-banco.php, capturar.mjs (capturas de celular), usuario-teste.php; gerar-icones.mjs a partir do passo 11
package.json     ferramentas da raiz (playwright-core para as capturas); o app tem o próprio em sistema/
```

## Comandos

Antes de tudo, ligar o Docker de testes: `powershell -File C:\Automacao\docker-ligar.ps1` (desligar no fim: `docker-desligar.ps1`).

```bash
scripts/dc.sh php artisan test                 # todos os testes (SQLite em memória)
scripts/dc.sh php artisan test --filter NomeDoTeste
scripts/dc.sh php artisan migrate              # migrações no banco receitas (MariaDB de testes)
scripts/dc.sh php ../scripts/criar-banco.php   # cria o banco receitas, se não existir
cd sistema && npm install && npm run build     # front-end, no Windows (Node 26)

# Capturas de tela de celular (360x760, Edge já instalado; npm install na raiz uma vez)
node scripts/capturar.mjs --url http://localhost:8085/receitas/login --saida docs/capturas/x.png
node scripts/capturar.mjs --url ... --saida ... --dupla              # claro e escuro lado a lado
node scripts/capturar.mjs --url ... --saida ... --inteira            # página inteira
node scripts/capturar.mjs --url http://localhost:8085/receitas/dashboard --login teste@bombocado.local:senha-de-teste-123 --saida ...
scripts/dc.sh php ../scripts/usuario-teste.php criar|apagar          # usuário de teste das capturas (só fora da produção)
```

- O `dc.sh` roda como o usuário `ipsim` (o mesmo do Apache). Não passe `$variáveis` direto pelo `wsl.exe` (ver `LICOES.md`): use um script `.php` em `scripts/`.
- Sem `npm run build`, as telas dão erro 500 (falta o manifest do Vite).
- **Testes com `APP_URL` próprio:** o `sistema/phpunit.xml` fixa `APP_URL=http://localhost` e `ASSET_URL` vazio. Com o `/receitas` do `.env`, as requisições dos testes viram `/receitas/login` e todas as rotas dão 404 (aconteceu em 2026-11-27: 22 testes falharam).
- **Antes de commitar, rode `scripts/dc.sh php artisan test` sozinho e confira o código de saída** (0 = tudo passou). Não encadeie com `| grep ... &&`: o `grep` dá certo mesmo com teste falhando, e o commit sai quebrado (aconteceu no passo 10).
- **`ASSET_URL=/receitas` no `sistema/.env` de testes** (o app fica num subcaminho): sem isso, o Vite compila o CSS apontando as fontes para `/build/...` e elas não carregam (o título sai em fonte comum). Na produção (raiz do endereço) `ASSET_URL` fica vazio, e o `npm run build` tem de rodar com o `.env` de produção.
- Visual: cores em `sistema/resources/css/tema.css` (`--bb-*` e `--tipo-*`, claro e `.dark`), classes Tailwind `bg-bb-*`, `text-bb-*`, `font-titulo` (Unbounded); lista de tipos em `sistema/resources/js/lib/tipos.ts`. Página de conferência `/amostra` (só no ambiente local).
- Endereço `/receitas` no Docker de testes: `Alias` em `C:\Projetos AI\Teste-de-apps-pre-producao\config\sites.conf` e `servidor.conf` (backups `.bak-2026-11-27`).

## Decisões e motivos

- 2026-11-27: projeto criado em `C:\Projetos AI\Pessoal\Receitas`; repositório `SergioOCarv/Receitas`, **público** a pedido do Sergio (por isso, segredos só em `.env` e em `C:\Receitas-producao\segredos`).
- 2026-11-27: entrevista (P1 a P36) e design aprovados: PWA; Compartilhar do Android; Claude Haiku; notebook + Tailscale Funnel (sem domínio próprio); Laravel + MariaDB + Vue; só o Sergio cria contas; livro pessoal + livros compartilhados (membros adicionam; só o autor edita e apaga; o dono do livro "tira do livro" e a receita volta ao livro pessoal do autor); e-mail de senha por uma conta Gmail do app.
- 2026-11-27: visual "Cor por tipo" (opção C), nome **Bom Bocado**, ícone de rosquinha com fundo azul (B), botão de compartilhar laranja com o símbolo de três círculos.
- 2026-11-27: licença **MIT** (P42), arquivo `LICENSE` na raiz, em nome de Sergio Carvalho (SergioOCarv).
- 2026-11-27: o plano detalha a parte técnica das Fases 0 a 2; as outras fases ganham o detalhe num passo próprio, logo antes de começar, porque dependem do teste do Instagram (Fase 0).

## Convenções

- Textos, comentários e commits em português do Brasil (regras do `CLAUDE.md` global).
- Imagens para o Sergio conferir: salvar no projeto e passar como link Markdown clicável.
- **README.md é público e escrito para quem encontra o projeto no GitHub** (pedido do Sergio, 2026-11-27). Atualizar com carinho sempre que o projeto avançar: ao concluir cada fase (tabela "Roteiro" e a nota de "Situação"), quando surgirem telas reais (trocar protótipos por capturas), quando houver como rodar o projeto (seção "Rodando o projeto") e quando mudar tecnologia ou arquitetura. Usar a skill `escrita-humana`. Nunca pôr dados pessoais nem segredos.

## Pendências e próximos passos

Ver `docs/CHECKLIST.md`. Próximo: passo 11.

## Onde paramos

- 2026-11-27: entrevista, design, visual e plano aprovados; repositório público; passos 1 a 7 feitos (Fase 0 concluída) (links em `pesquisa/links.md`, originais em `pesquisa/privado/`, fora do Git; resultado em `pesquisa/relatorio-leitura.md`: as 9 receitas legíveis; Instagram só com navegador sem tela, Short do YouTube só com `yt-dlp`). Funnel liberado e testado de fora (página de teste aberta pelo 4G e por um celular sem Tailscale; hoje desligado). Chave da API da Anthropic no `.env` da raiz (nome `bom-bocado`, escopo "Espaço de trabalho padrão", **vence em 01/07/2027**: trocar antes; aviso 30 dias antes previsto no passo 63), validada (lista de modelos = 200; Haiku disponível: `claude-haiku-5-5`). Passo 7 feito (`pesquisa/relatorio-ia.md`): 9/9 receitas extraídas pelo Haiku 5.5 com saída estruturada, média US$ 0,0009 (≈ R$ 0,005) por receita; no app, usar o SDK oficial PHP. **Fase 0 concluída.** Passo 8 feito: Laravel 12.74 em `sistema/`, sem cadastro aberto (27 testes passando), banco `receitas` no MariaDB de testes, `localhost:8085/receitas` respondendo. Passo 9 feito: `scripts/capturar.mjs` (celular 360x760, `--dupla` claro/escuro, `--login`). Passo 10 feito: tema visual (cores, fontes Unbounded/DM Sans servidas pelo app, claro e escuro), página `/amostra`. **Próximo: passo 11** (ícone e PWA básico). Para retomar: ler `docs/CHECKLIST.md` e o detalhe do passo no plano.
