<script setup lang="ts">
// Página de conferência do tema visual (passo 10). Só existe no ambiente local.
// Reproduz a lista do protótipo aprovado (docs/prototipos/telas-bom-bocado.png) com o tema real do app.
import { corDoTipo, TIPOS } from '@/lib/tipos';
import { Head } from '@inertiajs/vue3';

const exemplos = [
    { titulo: 'Pizza de frigideira', tipos: ['assado', 'salgado'], favorita: true, cor: '#E9B872' },
    { titulo: 'Bowl de salmão grelhado', tipos: ['frio', 'prato-principal'], cor: '#F28C6B' },
    { titulo: 'Panquecas americanas', tipos: ['quente', 'doce'], favorita: true, cor: '#D9A05B' },
    { titulo: 'Drink de morango e limão', tipos: ['bebida', 'gelado'], rascunho: true, cor: '#E8505B' },
    { titulo: 'Risoto de parmesão', tipos: ['quente', 'prato-principal'], cor: '#EFE3C2' },
    { titulo: 'Panna cotta de morango', tipos: ['gelado', 'doce', 'sobremesa'], cor: '#F5C6CB' },
];

const nomeDoTipo = (slug: string) => TIPOS.find((t) => t.slug === slug)?.nome ?? slug;
</script>

<template>
    <Head title="Amostra do tema" />
    <div class="min-h-screen bg-bb-fundo text-bb-texto">
        <!-- Topo: nome do app e bolinha do usuário -->
        <header class="flex items-center justify-between px-[18px] pb-1 pt-3">
            <h1 class="font-titulo text-[22px] tracking-tight">Bom Bocado</h1>
            <span class="grid h-[38px] w-[38px] place-items-center rounded-full bg-bb-botao font-titulo text-[15px] text-bb-botao-texto">S</span>
        </header>

        <!-- Busca -->
        <div class="mx-[18px] mb-1 mt-2.5 rounded-xl bg-bb-campo px-3.5 py-3 text-[15px] text-bb-texto-suave">⌕&nbsp; Buscar por nome ou ingrediente</div>

        <!-- Filtros por tipo -->
        <div class="flex gap-[7px] overflow-x-auto px-[18px] py-2.5">
            <span
                v-for="(tipo, i) in TIPOS"
                :key="tipo.slug"
                class="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[10px] px-3 py-[7px] text-[13px] font-bold"
                :class="i === 0 ? 'text-white' : 'bg-bb-campo'"
                :style="i === 0 ? { background: corDoTipo(tipo.slug) } : {}"
            >
                <i class="inline-block h-[9px] w-[9px] rounded-full" :style="{ background: i === 0 ? '#fff' : corDoTipo(tipo.slug) }" />
                {{ tipo.nome }}
            </span>
        </div>

        <!-- Lista de receitas -->
        <ul class="px-[18px]">
            <li v-for="r in exemplos" :key="r.titulo" class="flex items-center gap-3.5 border-b border-bb-divisoria py-[9px]">
                <span class="h-[68px] w-[68px] shrink-0 rounded-[14px]" :style="{ background: r.cor }" />
                <div>
                    <b class="mb-[5px] block text-base leading-tight">{{ r.titulo }}<template v-if="r.favorita"> ★</template></b>
                    <span
                        v-if="r.rascunho"
                        class="mr-1 inline-block rounded-md border-[1.5px] border-dashed border-bb-texto px-[7px] py-px text-[11.5px] font-bold"
                        >Rascunho</span
                    >
                    <span
                        v-for="t in r.tipos"
                        :key="t"
                        class="mr-1 inline-block rounded-md px-[7px] py-0.5 text-[11.5px] font-bold text-white"
                        :style="{ background: corDoTipo(t) }"
                        >{{ nomeDoTipo(t) }}</span
                    >
                </div>
            </li>
        </ul>

        <!-- Todas as cores dos tipos, para conferir o contraste -->
        <section class="px-[18px] pb-24 pt-5">
            <h2 class="mb-2 font-titulo text-sm">Tipos</h2>
            <div class="flex flex-wrap gap-1.5">
                <span
                    v-for="tipo in TIPOS"
                    :key="tipo.slug"
                    class="rounded-md px-[7px] py-0.5 text-[11.5px] font-bold text-white"
                    :style="{ background: corDoTipo(tipo.slug) }"
                    >{{ tipo.nome }}</span
                >
            </div>
            <h2 class="mb-2 mt-5 font-titulo text-sm">Botões</h2>
            <div class="flex items-center gap-3">
                <button class="rounded-xl bg-bb-botao px-4 py-2.5 text-sm font-bold text-bb-botao-texto">Salvar receita</button>
                <button class="rounded-xl bg-bb-campo px-4 py-2.5 text-sm font-bold">Cancelar</button>
                <span class="grid h-[38px] w-[38px] place-items-center rounded-full bg-bb-laranja text-white" title="Compartilhar">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2">
                        <circle cx="18" cy="5" r="3" />
                        <circle cx="6" cy="12" r="3" />
                        <circle cx="18" cy="19" r="3" />
                        <path d="M8.6 10.5l6.8-4M8.6 13.5l6.8 4" />
                    </svg>
                </span>
            </div>
        </section>

        <!-- Botão de nova receita -->
        <span class="fixed bottom-[22px] right-[18px] grid h-[58px] w-[58px] place-items-center rounded-full bg-bb-botao text-3xl text-bb-botao-texto">+</span>
    </div>
</template>
