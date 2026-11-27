<?php

namespace Tests\Unit;

use App\Support\EnderecoSeguro;
use Illuminate\Support\Facades\URL;
use Tests\TestCase;

/**
 * Na produção, o Tailscale Funnel recebe o HTTPS e repassa ao app em HTTP.
 * Os links gerados pelo Laravel precisam sair em https://, senão o navegador bloqueia
 * (conteúdo misto) e o PWA não instala.
 */
class EnderecoSeguroTest extends TestCase
{
    protected function tearDown(): void
    {
        URL::forceScheme(null);
        parent::tearDown();
    }

    public function test_em_producao_com_endereco_https_os_links_saem_em_https(): void
    {
        $this->assertTrue(EnderecoSeguro::deveForcarHttps('production', 'https://vps-claude.tail263835.ts.net'));

        EnderecoSeguro::aplicar('production', 'https://vps-claude.tail263835.ts.net');
        $this->assertStringStartsWith('https://', url('/login'));
    }

    public function test_fora_da_producao_nao_forca_https(): void
    {
        $this->assertFalse(EnderecoSeguro::deveForcarHttps('local', 'https://exemplo.com'));
        $this->assertFalse(EnderecoSeguro::deveForcarHttps('testing', 'https://exemplo.com'));
    }

    public function test_producao_com_endereco_http_nao_forca_https(): void
    {
        $this->assertFalse(EnderecoSeguro::deveForcarHttps('production', 'http://localhost:8095'));
    }
}
