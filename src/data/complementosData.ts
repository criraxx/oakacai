// Imagens individuais dos complementos
import uva from "@/assets/complementos/uva.jpg";
import banana from "@/assets/complementos/banana.jpg";
import abacaxi from "@/assets/complementos/abacaxi.jpg";
import sucrilhos from "@/assets/complementos/sucrilhos.jpg";
import pacoca from "@/assets/complementos/pacoca.jpg";
import ovomaltine from "@/assets/complementos/ovomaltine.jpg";
import mms from "@/assets/complementos/mms.jpg";
import leiteNinho from "@/assets/complementos/leite-ninho.jpg";
import leiteCondensado from "@/assets/complementos/leite-condensado.jpg";
import granola from "@/assets/complementos/granola.jpg";
import coberturaMorango from "@/assets/complementos/cobertura-morango.jpg";
import coberturaCaramelo from "@/assets/complementos/cobertura-caramelo.jpg";
import chocoboll from "@/assets/complementos/chocoboll.jpg";
import caldaChocolate from "@/assets/complementos/calda-chocolate.jpg";
import amendoim from "@/assets/complementos/amendoim.jpg";
import kiwi from "@/assets/complementos/kiwi.jpg";
import ouroBranco from "@/assets/complementos/ouro-branco.jpg";
import bisPreto from "@/assets/complementos/bis-preto.jpg";
import bisBranco from "@/assets/complementos/bis-branco.jpg";
import sonhoValsa from "@/assets/complementos/sonho-valsa.jpg";
import kitkatPreto from "@/assets/complementos/kitkat-preto.jpg";
import kitkatBranco from "@/assets/complementos/kitkat-branco.jpg";
import gomets from "@/assets/complementos/gomets.jpg";
import morango from "@/assets/complementos/morango.jpg";
import cremeAvela from "@/assets/complementos/creme-avela.jpg";
import nutela from "@/assets/complementos/nutela.jpg";
import cremeLeiteNinho from "@/assets/complementos/creme-leite-ninho.jpg";
import cremeMorango from "@/assets/complementos/creme-morango.jpg";
import cremeCookies from "@/assets/complementos/creme-cookies.jpg";

export interface Complemento {
  id: string;
  nome: string;
  preco: number | null; // null = grátis
  imagem: string;
  maxQuantidade?: number;
}

export type TipoSecao = "gratis" | "pago" | "premium";

export interface SecaoComplemento {
  id: string;
  titulo: string;
  subtitulo: string;
  itens: Complemento[];
  maxItens?: number;
  tipo?: TipoSecao;
}

// ============ MONTE O COPO ============

// Monte o Copo 1 - Grátis (Escolha 4 itens - Obrigatório)
export const monteOCopo1: SecaoComplemento = {
  id: "monte-copo-1",
  titulo: "Prepara el vaso 1",
  subtitulo: "Elige hasta 4 productos gratis",
  maxItens: 4,
  tipo: "gratis",
  itens: [
    { id: "uva-m1", nome: "Uva", preco: null, imagem: uva, maxQuantidade: 3 },
    { id: "banana-m1", nome: "Plátano", preco: null, imagem: banana, maxQuantidade: 3 },
    { id: "abacaxi-m1", nome: "Piña", preco: null, imagem: abacaxi, maxQuantidade: 3 },
    { id: "sucrilhos-m1", nome: "Cereales", preco: null, imagem: sucrilhos, maxQuantidade: 3 },
    { id: "pacoca-m1", nome: "Paçoca", preco: null, imagem: pacoca, maxQuantidade: 3 },
    { id: "ovomaltine-m1", nome: "Ovomaltine", preco: null, imagem: ovomaltine, maxQuantidade: 3 },
    { id: "mms-m1", nome: "M&M's", preco: null, imagem: mms, maxQuantidade: 3 },
    { id: "leite-ninho-m1", nome: "Leche Ninho", preco: null, imagem: leiteNinho, maxQuantidade: 3 },
    { id: "leite-condensado-m1", nome: "Leche condensada", preco: null, imagem: leiteCondensado, maxQuantidade: 3 },
    { id: "granola-m1", nome: "Granola", preco: null, imagem: granola, maxQuantidade: 3 },
    { id: "cobertura-morango-m1", nome: "Cobertura de fresa", preco: null, imagem: coberturaMorango, maxQuantidade: 3 },
    { id: "cobertura-caramelo-m1", nome: "Cobertura de caramelo", preco: null, imagem: coberturaCaramelo, maxQuantidade: 3 },
    { id: "chocoboll-m1", nome: "Chocoboll", preco: null, imagem: chocoboll, maxQuantidade: 3 },
    { id: "calda-chocolate-m1", nome: "Salsa de chocolate", preco: null, imagem: caldaChocolate, maxQuantidade: 3 },
    { id: "amendoim-m1", nome: "Cacahuete", preco: null, imagem: amendoim, maxQuantidade: 3 },
  ]
};

// Monte o Copo 2 - Grátis (Escolha 4 itens - Obrigatório)
export const monteOCopo2: SecaoComplemento = {
  id: "monte-copo-2",
  titulo: "Prepara el vaso 2",
  subtitulo: "Elige hasta 4 productos gratis",
  maxItens: 4,
  tipo: "gratis",
  itens: [
    { id: "uva-m2", nome: "Uva", preco: null, imagem: uva, maxQuantidade: 3 },
    { id: "banana-m2", nome: "Plátano", preco: null, imagem: banana, maxQuantidade: 3 },
    { id: "abacaxi-m2", nome: "Piña", preco: null, imagem: abacaxi, maxQuantidade: 3 },
    { id: "sucrilhos-m2", nome: "Cereales", preco: null, imagem: sucrilhos, maxQuantidade: 3 },
    { id: "pacoca-m2", nome: "Paçoca", preco: null, imagem: pacoca, maxQuantidade: 3 },
    { id: "ovomaltine-m2", nome: "Ovomaltine", preco: null, imagem: ovomaltine, maxQuantidade: 3 },
    { id: "mms-m2", nome: "M&M's", preco: null, imagem: mms, maxQuantidade: 3 },
    { id: "leite-ninho-m2", nome: "Leche Ninho", preco: null, imagem: leiteNinho, maxQuantidade: 3 },
    { id: "leite-condensado-m2", nome: "Leche condensada", preco: null, imagem: leiteCondensado, maxQuantidade: 3 },
    { id: "granola-m2", nome: "Granola", preco: null, imagem: granola, maxQuantidade: 3 },
    { id: "cobertura-morango-m2", nome: "Cobertura de fresa", preco: null, imagem: coberturaMorango, maxQuantidade: 3 },
    { id: "cobertura-caramelo-m2", nome: "Cobertura de caramelo", preco: null, imagem: coberturaCaramelo, maxQuantidade: 3 },
    { id: "chocoboll-m2", nome: "Chocoboll", preco: null, imagem: chocoboll, maxQuantidade: 3 },
    { id: "calda-chocolate-m2", nome: "Salsa de chocolate", preco: null, imagem: caldaChocolate, maxQuantidade: 3 },
    { id: "amendoim-m2", nome: "Cacahuete", preco: null, imagem: amendoim, maxQuantidade: 3 },
  ]
};

// Monte o Copo Único (para Monte Seu Copo do Seu Jeito - apenas 1 copo)
export const monteOCopoUnico: SecaoComplemento = {
  id: "monte-copo",
  titulo: "Prepara tu vaso",
  subtitulo: "Elige hasta 4 productos gratis",
  maxItens: 4,
  tipo: "gratis",
  itens: [
    { id: "uva-mc", nome: "Uva", preco: null, imagem: uva, maxQuantidade: 3 },
    { id: "banana-mc", nome: "Plátano", preco: null, imagem: banana, maxQuantidade: 3 },
    { id: "abacaxi-mc", nome: "Piña", preco: null, imagem: abacaxi, maxQuantidade: 3 },
    { id: "sucrilhos-mc", nome: "Cereales", preco: null, imagem: sucrilhos, maxQuantidade: 3 },
    { id: "pacoca-mc", nome: "Paçoca", preco: null, imagem: pacoca, maxQuantidade: 3 },
    { id: "ovomaltine-mc", nome: "Ovomaltine", preco: null, imagem: ovomaltine, maxQuantidade: 3 },
    { id: "mms-mc", nome: "M&M's", preco: null, imagem: mms, maxQuantidade: 3 },
    { id: "leite-ninho-mc", nome: "Leche Ninho", preco: null, imagem: leiteNinho, maxQuantidade: 3 },
    { id: "leite-condensado-mc", nome: "Leche condensada", preco: null, imagem: leiteCondensado, maxQuantidade: 3 },
    { id: "granola-mc", nome: "Granola", preco: null, imagem: granola, maxQuantidade: 3 },
    { id: "cobertura-morango-mc", nome: "Cobertura de fresa", preco: null, imagem: coberturaMorango, maxQuantidade: 3 },
    { id: "cobertura-caramelo-mc", nome: "Cobertura de caramelo", preco: null, imagem: coberturaCaramelo, maxQuantidade: 3 },
    { id: "chocoboll-mc", nome: "Chocoboll", preco: null, imagem: chocoboll, maxQuantidade: 3 },
    { id: "calda-chocolate-mc", nome: "Salsa de chocolate", preco: null, imagem: caldaChocolate, maxQuantidade: 3 },
    { id: "amendoim-mc", nome: "Cacahuete", preco: null, imagem: amendoim, maxQuantidade: 3 },
  ]
};

// ============ ADICIONAIS ============

// Adicionais (Pagos - Escolha até 15 itens)
export const adicionais: SecaoComplemento = {
  id: "adicionais",
  titulo: "Extras de pago",
  subtitulo: "Elige hasta 20 productos",
  maxItens: 20,
  tipo: "pago",
  itens: [
    { id: "uva-a", nome: "Uva", preco: 3.99, imagem: uva, maxQuantidade: 15 },
    { id: "banana-a", nome: "Plátano", preco: 1.99, imagem: banana, maxQuantidade: 15 },
    { id: "kiwi-a", nome: "Kiwi", preco: 1.99, imagem: kiwi, maxQuantidade: 15 },
    { id: "abacaxi-a", nome: "Piña", preco: 3.99, imagem: abacaxi, maxQuantidade: 15 },
    { id: "leite-ninho-a", nome: "Leche Ninho", preco: 1.99, imagem: leiteNinho, maxQuantidade: 15 },
    { id: "ovomaltine-a", nome: "Ovomaltine", preco: 2.99, imagem: ovomaltine, maxQuantidade: 15 },
    { id: "leite-condensado-a", nome: "Leche condensada", preco: 2.99, imagem: leiteCondensado, maxQuantidade: 15 },
    { id: "ouro-branco-a", nome: "Ouro Branco", preco: 1.99, imagem: ouroBranco, maxQuantidade: 15 },
    { id: "bis-preto-a", nome: "Bis negro", preco: 2.99, imagem: bisPreto, maxQuantidade: 15 },
    { id: "bis-branco-a", nome: "Bis blanco", preco: 2.99, imagem: bisBranco, maxQuantidade: 15 },
    { id: "sonho-valsa-a", nome: "Sonho de Valsa", preco: 1.99, imagem: sonhoValsa, maxQuantidade: 15 },
    { id: "mms-a", nome: "M&M's", preco: 1.99, imagem: mms, maxQuantidade: 15 },
    { id: "granola-a", nome: "Granola", preco: 3.99, imagem: granola, maxQuantidade: 15 },
    { id: "pacoca-a", nome: "Paçoca", preco: 1.99, imagem: pacoca, maxQuantidade: 15 },
    { id: "kitkat-preto-a", nome: "Kit Kat negro", preco: 6.00, imagem: kitkatPreto, maxQuantidade: 15 },
    { id: "kitkat-branco-a", nome: "Kit Kat blanco", preco: 6.00, imagem: kitkatBranco, maxQuantidade: 15 },
    { id: "gomets-a", nome: "Gomets", preco: 1.99, imagem: gomets, maxQuantidade: 15 },
    { id: "cobertura-morango-a", nome: "Cobertura de fresa", preco: 1.99, imagem: coberturaMorango, maxQuantidade: 15 },
    { id: "cobertura-chocolate-a", nome: "Cobertura de chocolate", preco: 1.99, imagem: caldaChocolate, maxQuantidade: 15 },
    { id: "cobertura-caramelo-a", nome: "Cobertura de caramelo", preco: 1.99, imagem: coberturaCaramelo, maxQuantidade: 15 },
    { id: "chocoboll-a", nome: "Chocoboll", preco: 2.99, imagem: chocoboll, maxQuantidade: 15 },
    { id: "amendoim-a", nome: "Cacahuete", preco: 3.99, imagem: amendoim, maxQuantidade: 15 },
  ]
};

// ============ ADICIONAIS PREMIUM ============

// Adicionais Premium (Escolha até 14 itens)
export const adicionaisPremium: SecaoComplemento = {
  id: "adicionais-premium",
  titulo: "Extras premium",
  subtitulo: "Elige hasta 20 productos",
  maxItens: 20,
  tipo: "premium",
  itens: [
    { id: "morango-p", nome: "Fresa", preco: 4.99, imagem: morango, maxQuantidade: 15 },
    { id: "creme-avela-p", nome: "Crema de avellana", preco: 5.99, imagem: cremeAvela, maxQuantidade: 15 },
    { id: "nutela-p", nome: "Nutella", preco: 6.99, imagem: nutela, maxQuantidade: 15 },
    { id: "creme-leite-ninho-p", nome: "Crema de leche Ninho", preco: 5.99, imagem: cremeLeiteNinho, maxQuantidade: 15 },
    { id: "creme-morango-p", nome: "Crema de fresa", preco: 5.99, imagem: cremeMorango, maxQuantidade: 15 },
    { id: "creme-cookies-p", nome: "Crema de galletas", preco: 3.99, imagem: cremeCookies, maxQuantidade: 15 },
  ]
};

// ============ SEÇÕES POR TIPO DE PRODUTO ============

// Para Combo Premium (2 copos com adicionais)
export const secoesCombo: SecaoComplemento[] = [
  monteOCopo1,
  monteOCopo2,
  { ...adicionais, id: "adicionais-copo-1", titulo: "Extras vaso 1" },
  { ...adicionais, id: "adicionais-copo-2", titulo: "Extras vaso 2", itens: adicionais.itens.map(item => ({ ...item, id: item.id.replace('-a', '-a2') })) },
  { ...adicionaisPremium, id: "adicionais-premium-copo-1", titulo: "Extras premium vaso 1" },
  { ...adicionaisPremium, id: "adicionais-premium-copo-2", titulo: "Extras premium vaso 2", itens: adicionaisPremium.itens.map(item => ({ ...item, id: item.id.replace('-p', '-p2') })) }
];

// Para Monte Seu Copo / Trufados / Tradicionais (grátis + pago + premium)
export const secoesMonteCopo: SecaoComplemento[] = [
  { ...monteOCopoUnico, titulo: "Prepara tu açaí", subtitulo: "Elige hasta 4 productos gratis" },
  adicionais,
  adicionaisPremium
];

// Para produtos normais (sem adicionais, apenas monte o copo)
export const secoesNormal: SecaoComplemento[] = [
  { ...monteOCopoUnico, titulo: "Prepara tu açaí", subtitulo: "Elige 4 productos gratis" }
];

// Todas as seções (para compatibilidade - usado no carrinho para buscar nomes)
export const todasSecoes: SecaoComplemento[] = [
  monteOCopo1,
  monteOCopo2,
  monteOCopoUnico,
  adicionais,
  adicionaisPremium,
  { ...adicionais, id: "adicionais-copo-1", titulo: "Extras vaso 1" },
  { ...adicionais, id: "adicionais-copo-2", titulo: "Extras vaso 2", itens: adicionais.itens.map(item => ({ ...item, id: item.id.replace('-a', '-a2') })) },
  { ...adicionaisPremium, id: "adicionais-premium-copo-1", titulo: "Extras premium vaso 1" },
  { ...adicionaisPremium, id: "adicionais-premium-copo-2", titulo: "Extras premium vaso 2", itens: adicionaisPremium.itens.map(item => ({ ...item, id: item.id.replace('-p', '-p2') })) }
];
