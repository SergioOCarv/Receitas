<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Route;
use Tests\TestCase;

/**
 * Na produção, o Tailscale Funnel entrega as requisições pelo portão da rede do Docker (ex.: 172.20.0.1)
 * e põe o IP de quem acessa em X-Forwarded-For. O limite de tentativas de login usa esse IP.
 */
class IpRealTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        Route::get('/teste-ip', fn () => request()->ip());
    }

    public function test_usa_o_ip_do_x_forwarded_for_quando_a_conexao_vem_da_rede_do_docker(): void
    {
        $this->withServerVariables(['REMOTE_ADDR' => '172.20.0.1'])
            ->get('/teste-ip', ['X-Forwarded-For' => '203.0.113.5'])
            ->assertSee('203.0.113.5');
    }

    public function test_usa_o_ip_do_x_forwarded_for_quando_a_conexao_vem_do_proprio_notebook(): void
    {
        $this->withServerVariables(['REMOTE_ADDR' => '127.0.0.1'])
            ->get('/teste-ip', ['X-Forwarded-For' => '203.0.113.5'])
            ->assertSee('203.0.113.5');
    }

    public function test_ignora_o_x_forwarded_for_vindo_de_fora(): void
    {
        // Ninguém de fora consegue fingir outro IP mandando o cabeçalho.
        $this->withServerVariables(['REMOTE_ADDR' => '198.51.100.7'])
            ->get('/teste-ip', ['X-Forwarded-For' => '203.0.113.5'])
            ->assertSee('198.51.100.7')
            ->assertDontSee('203.0.113.5');
    }
}
