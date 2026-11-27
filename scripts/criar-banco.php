<?php
// Cria o banco do Bom Bocado no MariaDB do Docker de testes, com os dados do sistema/.env.
// Uso: scripts/dc.sh php ../scripts/criar-banco.php
// (script em arquivo porque o wsl.exe apaga as $variáveis de comandos passados direto: ver LICOES.md)

$env = [];
foreach (file(__DIR__ . '/../sistema/.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $linha) {
    if ($linha[0] === '#' || !str_contains($linha, '=')) {
        continue;
    }
    [$chave, $valor] = explode('=', $linha, 2);
    $env[$chave] = trim($valor, '"');
}

$pdo = new PDO("mysql:host={$env['DB_HOST']};port={$env['DB_PORT']}", $env['DB_USERNAME'], $env['DB_PASSWORD']);
$nome = $env['DB_DATABASE'];
if (!preg_match('/^[a-z0-9_]+$/', $nome)) {
    exit("Nome de banco inválido: {$nome}\n");
}
$pdo->exec("CREATE DATABASE IF NOT EXISTS `{$nome}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
echo "Banco {$nome} pronto.\n";
