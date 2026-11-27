# Bom Bocado (projeto Receitas)

Andamento: docs/CHECKLIST.md
Design (aprovado): docs/superpowers/specs/2026-11-27-livro-de-receitas-design.md
Plano: docs/superpowers/plans/2026-11-27-bom-bocado.md

## Objetivo e contexto

Projeto pessoal do Sergio. App Android (PWA) **"Bom Bocado"**: livro de receitas com login (contas criadas só por convite do Sergio), livros pessoais e compartilhados, busca por nome e ingrediente e filtro por tipo. As receitas entram pelo **Compartilhar do Android** (Instagram, YouTube, sites), sem perguntas: o servidor lê o link e a API do Claude (Haiku) monta a receita. Também compartilha a receita como imagem 9:16. Aberto pela internet via Tailscale Funnel.

O Sergio faz o projeto **passo a passo, nas horas vagas**: cada passo do plano é um pedido "faça o passo N". Passos 🙋 são dele.

## Tecnologias e versões

Laravel (starter kit Vue + Inertia + TypeScript), PHP 8.5, MariaDB 11.4, Vite + `vite-plugin-pwa`, Node 26 (no Windows, para o `npm`), Playwright (capturas de tela). Produção: Docker no WSL do notebook VPS-Claude, porta 8095, publicado pelo Tailscale Funnel.

## Estrutura de pastas

```
CLAUDE.md        este arquivo
.gitignore
docs/
  CHECKLIST.md   andamento (um item por passo)
  superpowers/specs/   design aprovado
  superpowers/plans/   plano passo a passo
  prototipos/    protótipos visuais (HTML + PNG); aprovados: telas-bom-bocado e icones-bom-bocado (B)
  capturas/      capturas para o Sergio conferir (fora do Git)  [a partir do passo 9]
pesquisa/        testes descartáveis da Fase 0  [a partir do passo 1]
sistema/         app Laravel  [a partir do passo 8]
producao/        Docker e scripts de produção  [a partir do passo 12]
scripts/         dc.sh, capturar.mjs, gerar-icones.mjs  [a partir dos passos 8 e 9]
```

## Comandos

A definir a partir do passo 8 (instalar, rodar, testar, publicar).

## Decisões e motivos

- 2026-11-27: projeto criado em `C:\Projetos AI\Pessoal\Receitas`; repositório `SergioOCarv/Receitas`, **público** a pedido do Sergio (por isso, segredos só em `.env` e em `C:\Receitas-producao\segredos`).
- 2026-11-27: entrevista (P1 a P36) e design aprovados: PWA; Compartilhar do Android; Claude Haiku; notebook + Tailscale Funnel (sem domínio próprio); Laravel + MariaDB + Vue; só o Sergio cria contas; livro pessoal + livros compartilhados (membros adicionam; só o autor edita e apaga; o dono do livro "tira do livro" e a receita volta ao livro pessoal do autor); e-mail de senha por uma conta Gmail do app.
- 2026-11-27: visual "Cor por tipo" (opção C), nome **Bom Bocado**, ícone de rosquinha com fundo azul (B), botão de compartilhar laranja com o símbolo de três círculos.
- 2026-11-27: o plano detalha a parte técnica das Fases 0 a 2; as outras fases ganham o detalhe num passo próprio, logo antes de começar, porque dependem do teste do Instagram (Fase 0).

## Convenções

- Textos, comentários e commits em português do Brasil (regras do `CLAUDE.md` global).
- Imagens para o Sergio conferir: salvar no projeto e passar como link Markdown clicável.

## Pendências e próximos passos

Ver `docs/CHECKLIST.md`. Próximo: passo 2.

## Onde paramos

- 2026-11-27: entrevista, design, visual e plano aprovados; repositório público; passo 1 feito (links em `pesquisa/links.md`; originais em `pesquisa/privado/`, fora do Git). **Próximo: passo 2** (teste de leitura sem IA). Para retomar: ler `docs/CHECKLIST.md` e o detalhe do passo no plano.
