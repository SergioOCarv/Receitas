<?php

namespace App\Providers;

use App\Support\EnderecoSeguro;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Links em https:// na produção (atrás do Tailscale Funnel).
        EnderecoSeguro::aplicar($this->app->environment(), (string) config('app.url'));
    }
}
