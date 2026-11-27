<?php

namespace Tests\Feature\Auth;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * O Bom Bocado não tem cadastro aberto: só o administrador cria contas, por convite (design 5.1).
 */
class CadastroAbertoTest extends TestCase
{
    use RefreshDatabase;

    public function test_cadastro_aberto_nao_existe(): void
    {
        $this->get('/register')->assertNotFound();
    }

    public function test_nao_da_para_criar_conta_por_post(): void
    {
        $this->post('/register', [
            'name' => 'Pessoa Qualquer',
            'email' => 'pessoa@exemplo.com',
            'password' => 'senha-forte-123',
            'password_confirmation' => 'senha-forte-123',
        ])->assertNotFound();

        $this->assertGuest();
        $this->assertDatabaseMissing('users', ['email' => 'pessoa@exemplo.com']);
    }
}
