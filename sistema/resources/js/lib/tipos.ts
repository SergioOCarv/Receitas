// Lista fixa de tipos de receita (design 5.6) e a cor de cada um (resources/css/tema.css).
// A ordem é a dos filtros na tela.

export interface Tipo {
    slug: string;
    nome: string;
}

export const TIPOS: Tipo[] = [
    { slug: 'quente', nome: 'Quente' },
    { slug: 'frio', nome: 'Frio' },
    { slug: 'gelado', nome: 'Gelado' },
    { slug: 'assado', nome: 'Assado' },
    { slug: 'frito', nome: 'Frito' },
    { slug: 'cozido', nome: 'Cozido' },
    { slug: 'cru-salada', nome: 'Cru/salada' },
    { slug: 'bebida', nome: 'Bebida' },
    { slug: 'doce', nome: 'Doce' },
    { slug: 'salgado', nome: 'Salgado' },
    { slug: 'sobremesa', nome: 'Sobremesa' },
    { slug: 'lanche', nome: 'Lanche' },
    { slug: 'cafe-da-manha', nome: 'Café da manhã' },
    { slug: 'prato-principal', nome: 'Prato principal' },
    { slug: 'acompanhamento', nome: 'Acompanhamento' },
    { slug: 'molho', nome: 'Molho' },
    { slug: 'pao-massa', nome: 'Pão/massa' },
    { slug: 'vegetariano', nome: 'Vegetariano' },
];

/** Cor do tipo como valor CSS (segue o tema claro/escuro). */
export function corDoTipo(slug: string): string {
    return `var(--tipo-${slug})`;
}
