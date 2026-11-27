<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * O Bom Bocado é instalável no Android como PWA (design, seção 4 e passo 11 do plano).
 */
class PwaTest extends TestCase
{
    use RefreshDatabase;

    private function manifest(): array
    {
        $caminho = public_path('manifest.webmanifest');
        $this->assertFileExists($caminho);

        return json_decode(file_get_contents($caminho), true, flags: JSON_THROW_ON_ERROR);
    }

    public function test_manifest_tem_nome_e_abre_em_tela_cheia(): void
    {
        $m = $this->manifest();

        $this->assertSame('Bom Bocado', $m['name']);
        $this->assertSame('Bom Bocado', $m['short_name']);
        $this->assertSame('standalone', $m['display']);
        $this->assertSame('pt-BR', $m['lang']);
        // Endereços relativos: o mesmo manifest serve em /receitas (testes) e na raiz (produção).
        $this->assertSame('./', $m['start_url']);
        $this->assertSame('./', $m['scope']);
    }

    public function test_manifest_tem_os_icones_do_android_e_os_arquivos_existem(): void
    {
        $icones = collect($this->manifest()['icons']);

        $this->assertTrue($icones->contains(fn ($i) => $i['sizes'] === '192x192' && ($i['purpose'] ?? 'any') === 'any'));
        $this->assertTrue($icones->contains(fn ($i) => $i['sizes'] === '512x512' && ($i['purpose'] ?? 'any') === 'any'));
        $this->assertTrue($icones->contains(fn ($i) => $i['sizes'] === '512x512' && ($i['purpose'] ?? '') === 'maskable'));

        foreach ($icones as $icone) {
            $this->assertFileExists(public_path($icone['src']), "Falta o arquivo do ícone {$icone['src']}");
        }
    }

    public function test_service_worker_existe(): void
    {
        $this->assertFileExists(public_path('sw.js'));
    }

    public function test_pagina_liga_manifest_icone_e_service_worker(): void
    {
        $html = $this->get('/login')->assertOk()->getContent();

        $this->assertStringContainsString('rel="manifest"', $html);
        $this->assertStringContainsString('rel="apple-touch-icon"', $html);
        $this->assertStringContainsString('name="theme-color"', $html);
        $this->assertStringContainsString('serviceWorker.register', $html);
    }

    public function test_pagina_nao_depende_de_fontes_externas(): void
    {
        $html = $this->get('/login')->assertOk()->getContent();

        $this->assertStringNotContainsString('fonts.bunny.net', $html);
        $this->assertStringNotContainsString('fonts.googleapis.com', $html);
    }
}
