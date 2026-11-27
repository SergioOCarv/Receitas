<?php

namespace App\Support;

use Illuminate\Support\Facades\URL;

/**
 * Na produção, o Tailscale Funnel recebe as conexões em HTTPS e as repassa ao app em HTTP.
 * Sem este ajuste, o Laravel gera links http:// e o navegador os bloqueia (conteúdo misto).
 */
class EnderecoSeguro
{
    public static function deveForcarHttps(string $ambiente, string $enderecoDoApp): bool
    {
        return $ambiente === 'production' && str_starts_with($enderecoDoApp, 'https://');
    }

    public static function aplicar(string $ambiente, string $enderecoDoApp): void
    {
        if (self::deveForcarHttps($ambiente, $enderecoDoApp)) {
            URL::forceScheme('https');
        }
    }
}
