<?php

namespace Tests\Feature;

use Tests\TestCase;

/**
 * A página /amostra mostra o tema visual para conferência. Ela só existe no ambiente local
 * (desenvolvimento), nunca na produção nem nos testes.
 */
class AmostraVisualTest extends TestCase
{
    public function test_amostra_so_existe_em_local(): void
    {
        // Os testes rodam com APP_ENV=testing: a rota não pode estar registrada.
        $this->assertFalse(app()->isLocal());
        $this->get('/amostra')->assertNotFound();
    }
}
