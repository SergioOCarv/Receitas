# Publica (ou atualiza) o Bom Bocado em producao, no notebook VPS-Claude. Arquivo em ASCII puro
# (o PowerShell 5.1 le .ps1 sem BOM como ANSI: ver LICOES.md).
# Uso:  powershell -File producao\publicar.ps1 [-Primeira] [-WhatIf]
#   -Primeira: primeira publicacao (clona o codigo, gera a APP_KEY, cria o banco).
#   -WhatIf:   so mostra os passos, sem executar nenhum.
# Modelo: ERP-IPSim\producao\publicar.ps1.
[CmdletBinding()]
param(
  [switch]$Primeira,
  [switch]$WhatIf
)
$ErrorActionPreference = 'Stop'
$Raiz = 'C:\Receitas-producao'
$Codigo = Join-Path $Raiz 'codigo'
$Segredos = Join-Path $Raiz 'segredos'
$Log = Join-Path $Raiz 'publicar.log'
$WslRaiz = '/mnt/c/Receitas-producao'
$Porta = 8095
$Compose = @('compose', '-p', 'receitas-producao', '-f', "$WslRaiz/codigo/producao/compose.yaml", '--env-file', "$WslRaiz/segredos/compose.env")
# Imagem do Node para compilar o front-end (Vite). Linux limpo, descartavel.
$ImagemNode = 'node:24-bookworm-slim'

$Passos = @()
$Passos += 'Conferir as pastas e os segredos (segredos\.env e segredos\compose.env)'
$Passos += 'Pedir para digitar "producao"'
if ($Primeira) { $Passos += 'PRIMEIRA: gerar a APP_KEY e gravar em segredos\.env (se estiver vazia)' }
$Passos += 'Conferir que a pasta de producao nao tem mudanca local (git status --porcelain vazio)'
$Passos += 'git fetch e checkout do main (so avanco simples, --ff-only)'
$Passos += 'docker compose up -d --build (imagem, banco, web, fila, agendador)'
$Passos += 'Criar o link sistema/.env -> /segredos/.env e liberar storage e bootstrap/cache'
$Passos += 'composer install --no-dev'
$Passos += "Compilar o front-end num conteiner $ImagemNode (npm ci + npm run build, ASSET_URL vazio; precisa do vendor/ do composer)"
if ($Primeira) { $Passos += 'PRIMEIRA: criar o banco receitas' }
$Passos += 'migrate --force, storage:link, config:cache, route:cache, view:cache'
$Passos += 'queue:restart'
$Passos += "Conferir http://localhost:$Porta/login (precisa responder 200)"
$Passos += 'Mostrar a versao publicada (commit) e gravar no log'
$Passos += '(Backup antes de publicar: entra na Fase 11, quando existir o comando de backup)'

if ($WhatIf) {
  Write-Host 'MODO SIMULACAO (-WhatIf): nada sera executado. Passos:'
  $n = 1
  foreach ($p in $Passos) { Write-Host ("  {0}. {1}" -f $n, $p); $n++ }
  Write-Host "Pasta de producao: $Codigo"
  Write-Host "Log: $Log"
  exit 0
}

function Escrever-Log([string]$Texto) {
  $linha = (Get-Date -Format 'yyyy-MM-dd HH:mm:ss') + '  ' + $Texto
  Add-Content -Path $Log -Value $linha
  Write-Host $linha
}

function Wsl-Docker {
  # Roda "docker <args>" no WSL e para se falhar.
  & wsl.exe -d Ubuntu-24.04 -- docker @args
  if ($LASTEXITCODE -ne 0) { throw "docker falhou (codigo $LASTEXITCODE): $args" }
}

function Wsl-Compose { Wsl-Docker @Compose @args }

function Wsl-Artisan {
  # Roda php artisan no conteiner web, como www-data.
  Wsl-Compose exec -T -u www-data web php artisan @args
}

function Gravar-Utf8SemBom([string]$Caminho, [string]$Texto) {
  [IO.File]::WriteAllText($Caminho, $Texto, (New-Object System.Text.UTF8Encoding $false))
}

# 1. pastas e segredos
foreach ($pasta in @($Raiz, $Segredos, (Join-Path $Raiz 'backup'), (Join-Path $Raiz 'fotos'))) {
  if (-not (Test-Path $pasta)) { throw "Pasta $pasta nao existe. Veja producao\LEIA-ME.md (Primeira publicacao)." }
}
$ArqEnv = Join-Path $Segredos '.env'
$ArqCompose = Join-Path $Segredos 'compose.env'
if (-not (Test-Path $ArqCompose)) { throw 'Falta segredos\compose.env (BANCO_SENHA_ROOT). Veja LEIA-ME.md.' }
if (-not (Test-Path $ArqEnv)) { throw 'Falta segredos\.env (copie de producao\env.producao.exemplo e preencha).' }
if (-not (Select-String -Path $ArqCompose -Pattern '^BANCO_SENHA_ROOT=.+' -Quiet)) { throw 'BANCO_SENHA_ROOT vazio em segredos\compose.env.' }
if (-not (Select-String -Path $ArqEnv -Pattern '^DB_PASSWORD=.+' -Quiet)) { throw 'DB_PASSWORD vazio em segredos\.env.' }

# 2. confirmacao
$resp = Read-Host 'Para publicar em producao, digite: producao'
if ($resp -ne 'producao') { Write-Host 'Cancelado.'; exit 1 }
Escrever-Log 'Inicio da publicacao'

# 3. APP_KEY (so na primeira vez, e so se estiver vazia). O valor nunca aparece na tela.
if ($Primeira) {
  $textoEnv = [IO.File]::ReadAllText($ArqEnv)
  if ($textoEnv -match '(?m)^APP_KEY=\s*$') {
    $bytes = New-Object byte[] 32
    [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
    $chave = 'base64:' + [Convert]::ToBase64String($bytes)
    $textoEnv = [regex]::Replace($textoEnv, '(?m)^APP_KEY=\s*$', "APP_KEY=$chave")
    Gravar-Utf8SemBom $ArqEnv $textoEnv
    Escrever-Log 'APP_KEY gerada e gravada em segredos\.env'
  }
}

# 4. codigo
if (-not (Test-Path (Join-Path $Codigo '.git'))) {
  if (-not $Primeira) { throw "Pasta $Codigo sem repositorio. Use -Primeira na primeira publicacao." }
  $origem = (& git -C (Split-Path -Parent $PSScriptRoot) remote get-url origin).Trim()
  & git clone $origem $Codigo
  if ($LASTEXITCODE -ne 0) { throw 'git clone falhou' }
}
$sujo = & git -C $Codigo status --porcelain
if ($sujo) { throw "A pasta de producao tem mudanca local (ninguem edita ali):`n$sujo" }
& git -C $Codigo fetch origin
if ($LASTEXITCODE -ne 0) { throw 'git fetch falhou' }
& git -C $Codigo checkout main
& git -C $Codigo merge --ff-only origin/main
if ($LASTEXITCODE -ne 0) { throw 'git merge --ff-only falhou' }

# 5. conteineres e aplicacao
Wsl-Compose up -d --build
# Como root dentro do conteiner: link do .env e pastas gravaveis pelo www-data (bind mount do Windows).
Wsl-Compose exec -T -u root web ln -sfn /segredos/.env /app/sistema/.env
Wsl-Compose exec -T -u root web chmod -R a+rwX storage bootstrap/cache
Wsl-Compose exec -T -u www-data web composer install --no-dev --no-interaction --optimize-autoloader

# 6. front-end (Vite) num conteiner Node descartavel, DEPOIS do composer: o JavaScript importa o Ziggy de vendor/.
# ASSET_URL vazio: o app fica na raiz.
Wsl-Docker run --rm -v "$WslRaiz/codigo/sistema:/app" -w /app -e ASSET_URL= -e 'VITE_APP_NAME=Bom Bocado' $ImagemNode sh -c 'npm ci --no-audit --no-fund && npm run build'

if ($Primeira) {
  # O $MARIADB_ROOT_PASSWORD precisa chegar intacto ao conteiner: o wsl.exe repassa os argumentos por um shell
  # que expandiria a variavel (vazia). Por isso o comando vai num .sh temporario, sem a senha na linha de comando.
  $sh = Join-Path $env:TEMP 'receitas-criar-banco.sh'
  $linhas = @(
    'set -e',
    ('docker ' + ($Compose -join ' ') + ' exec -T banco sh -c ''mariadb -uroot -p"$MARIADB_ROOT_PASSWORD" -e "CREATE DATABASE IF NOT EXISTS receitas CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"''')
  )
  Gravar-Utf8SemBom $sh (($linhas -join "`n") + "`n")
  $shWsl = '/mnt/c/' + ($sh.Substring(3) -replace '\\', '/')
  & wsl.exe -d Ubuntu-24.04 -- bash $shWsl
  $rc = $LASTEXITCODE
  Remove-Item $sh -ErrorAction SilentlyContinue
  if ($rc -ne 0) { throw 'Falha ao criar o banco receitas' }
}

Wsl-Artisan migrate --force
Wsl-Artisan storage:link --force
Wsl-Artisan config:cache
Wsl-Artisan route:cache
Wsl-Artisan view:cache

# 7. fila
Wsl-Artisan queue:restart

# 8. conferencia
$status = 0
try { $status = (Invoke-WebRequest -Uri "http://localhost:$Porta/login" -UseBasicParsing -TimeoutSec 30).StatusCode } catch { $status = 0 }
if ($status -ne 200) { throw "http://localhost:$Porta/login respondeu $status (esperado 200). Veja os logs (LEIA-ME.md)." }

# 9. versao
$versao = (& git -C $Codigo log -1 --format='%h %s').Trim()
Escrever-Log "Publicado: $versao (login respondeu 200)"
