# Bom Bocado em produção (notebook VPS-Claude)

O app roda no Docker do WSL2 do notebook, projeto `receitas-producao`, na porta `127.0.0.1:8095`.
Quem vem da internet entra pelo **Tailscale Funnel**: `https://vps-claude.tail263835.ts.net/` → `http://127.0.0.1:8095`.
Esta pasta só guarda os arquivos: nada é ligado sem rodar o `publicar.ps1`.

Modelo: `C:\Projetos AI\Empresas\IPSim\ERP-IPSim\producao\`.

## Contêineres

| Serviço | O que faz |
|---|---|
| `web` | Apache + PHP 8.5 com o Laravel (constrói a imagem `receitas-producao:latest`) |
| `fila` | `queue:work`: trabalhos em segundo plano (leitura de links e IA, a partir da Fase 7) |
| `agendador` | `schedule:work`: limites de uso e backup (Fases 8 e 11) |
| `banco` | MariaDB 11.4, dados no volume `dados-banco` (dentro do WSL) |

O leitor de links (Chromium sem tela + `yt-dlp`) vira mais um contêiner na Fase 7.

## Pastas fora do Git (`C:\Receitas-producao\`)

| Pasta | Conteúdo |
|---|---|
| `codigo\` | clone do repositório (ninguém edita à mão: só o `publicar.ps1`) |
| `segredos\` | `.env` (modelo: `env.producao.exemplo`) e `compose.env` (`BANCO_SENHA_ROOT=...`) |
| `fotos\` | fotos das receitas e dos perfis (`storage/app/public` do Laravel) |
| `backup\` | cópias do backup diário (Fase 11) |
| `publicar.log` | histórico das publicações |

## Primeira publicação

1. Crie `C:\Receitas-producao\` com as subpastas `segredos`, `fotos` e `backup` (o `codigo` é clonado pelo script).
2. Copie `env.producao.exemplo` para `segredos\.env`. Deixe a `APP_KEY` vazia (o script gera).
3. Crie `segredos\compose.env` com a linha `BANCO_SENHA_ROOT=<senha forte>` e ponha a **mesma** senha em `DB_PASSWORD` do `segredos\.env`.
4. Rode `powershell -File producao\publicar.ps1 -WhatIf` para ver os passos, depois `-Primeira`.
5. Ligue o Funnel: `tailscale funnel --bg 8095`.

## Publicar uma versão nova

```
powershell -File "C:\Projetos AI\Pessoal\Receitas\producao\publicar.ps1"
```

O script pede para digitar `producao`, atualiza o código (`main`, só avanço simples), sobe os contêineres,
roda o `composer`, compila o front-end num contêiner Node descartável, migra o banco, gera os caches,
reinicia a fila e confere se `http://localhost:8095/login` responde 200. Recusa se `codigo\` tiver mudança local.

O backup antes de publicar entra na Fase 11, quando existir o comando de backup.

## Ver logs e reiniciar

```
wsl.exe -d Ubuntu-24.04 -- docker compose -p receitas-producao ps
wsl.exe -d Ubuntu-24.04 -- docker compose -p receitas-producao logs --tail 100 web
wsl.exe -d Ubuntu-24.04 -- docker compose -p receitas-producao logs --tail 100 fila
wsl.exe -d Ubuntu-24.04 -- docker compose -p receitas-producao restart fila
```

O log da aplicação fica em `codigo\sistema\storage\logs\`.

## Cuidados

- **HTTPS:** o Funnel entrega o app em HTTP para o contêiner. Com `APP_ENV=production` e `APP_URL` em `https://`, o app força `https` nos links (`app/Support/EnderecoSeguro.php`). Sem isso, o navegador bloqueia (conteúdo misto) e o PWA não instala.
- **`ASSET_URL` fica vazio** na produção. O `/receitas` é só do Docker de testes.
- **Front-end depois do Composer:** o JavaScript importa o Ziggy de `vendor/`.
- Se der erro 500 por permissão: `wsl.exe -d Ubuntu-24.04 -- docker compose -p receitas-producao exec -u root web chmod -R a+rwX storage bootstrap/cache`.
