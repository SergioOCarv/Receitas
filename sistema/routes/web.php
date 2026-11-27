<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome');
})->name('home');

Route::get('dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

// Página de conferência do tema visual (passo 10). Só existe no ambiente local.
if (app()->isLocal()) {
    Route::get('amostra', fn () => Inertia::render('Amostra'))->name('amostra');
}

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
