<?php
// Cria ou apaga o usuário de teste usado nas capturas de tela (só no banco de TESTES).
// Uso: scripts/dc.sh php ../scripts/usuario-teste.php criar|apagar
// Login do usuário: teste@bombocado.local / senha-de-teste-123
// (script em arquivo porque o wsl.exe apaga as $variáveis de comandos passados direto: ver LICOES.md)

require __DIR__ . '/../sistema/vendor/autoload.php';
$app = require __DIR__ . '/../sistema/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

if (app()->environment('production')) {
    exit("Recusado: este script só roda fora da produção.\n");
}

$email = 'teste@bombocado.local';
$acao = $argv[1] ?? '';

if ($acao === 'criar') {
    App\Models\User::updateOrCreate(
        ['email' => $email],
        ['name' => 'Pessoa de Teste', 'password' => Illuminate\Support\Facades\Hash::make('senha-de-teste-123'), 'email_verified_at' => now()],
    );
    echo "Usuário de teste pronto: {$email}\n";
} elseif ($acao === 'apagar') {
    App\Models\User::where('email', $email)->delete();
    echo "Usuário de teste apagado.\n";
} else {
    echo "Uso: php ../scripts/usuario-teste.php criar|apagar\n";
}
