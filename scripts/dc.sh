#!/usr/bin/env bash
# Roda um comando dentro do contêiner PHP do Docker de testes, na pasta sistema/.
# No notebook VPS-Claude o Docker só existe dentro do WSL (Ubuntu-24.04).
# Roda como o usuário ipsim (o mesmo do Apache), para os arquivos criados ficarem graváveis pelo site.
if command -v docker >/dev/null 2>&1; then
    DOCKER=(docker)
else
    DOCKER=(wsl.exe -d Ubuntu-24.04 -- docker)
fi
MSYS_NO_PATHCONV=1 "${DOCKER[@]}" exec -u ipsim -w "/projetos/Pessoal/Receitas/sistema" Teste-de-apps-pre-producao "$@"
