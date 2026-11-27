<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">

        <title inertia>{{ config('app.name', 'Bom Bocado') }}</title>

        {{-- PWA: instalável no Android (passo 11). asset() respeita o subcaminho do Docker de testes (/receitas). --}}
        <link rel="manifest" href="{{ asset('manifest.webmanifest') }}">
        <link rel="icon" href="{{ asset('favicon.svg') }}" type="image/svg+xml">
        <link rel="icon" href="{{ asset('favicon-32.png') }}" type="image/png" sizes="32x32">
        <link rel="apple-touch-icon" href="{{ asset('apple-touch-icon.png') }}">
        {{-- Cor da barra do celular, conforme o tema do sistema (design, seção 9) --}}
        <meta name="theme-color" content="#FFFFFF" media="(prefers-color-scheme: light)">
        <meta name="theme-color" content="#17171B" media="(prefers-color-scheme: dark)">

        @routes
        @vite(['resources/js/app.ts'])
        @inertiaHead

        <script>
            if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                    navigator.serviceWorker.register(@json(asset('sw.js')), { scope: @json(asset('/') ) });
                });
            }
        </script>
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>
