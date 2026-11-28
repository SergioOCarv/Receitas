<?php

use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // Produção: o Tailscale Funnel entrega pelo portão da rede do Docker (172.x) e põe o IP de quem
        // acessa em X-Forwarded-For. Só confia no cabeçalho vindo do notebook e das redes do Docker
        // (a porta 8095 só escuta em 127.0.0.1). Sem isso, todos teriam o mesmo IP e o limite de
        // tentativas de login bloquearia todo mundo junto.
        $middleware->trustProxies(at: ['127.0.0.1', '172.16.0.0/12', '192.168.0.0/16']);

        $middleware->web(append: [
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
