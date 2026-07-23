// Importar todas as imagens
import acaiCombo300 from "@/assets/acai-combo-300.jpg";
import acaiCombo500 from "@/assets/acai-combo-500.jpg";
import acaiPuro from "@/assets/acai-puro.jpg";
import acaiRoleta from "@/assets/acai-roleta.jpg";
import acaiKids from "@/assets/acai-kids.jpg";
import acaiTradicional from "@/assets/acai-tradicional.jpg";
import acaiMega from "@/assets/acai-mega.jpg";
import acaiSensacao from "@/assets/acai-sensacao.jpg";
import acaiDaCasa from "@/assets/acai-da-casa.jpg";
import acaiLaka from "@/assets/acai-laka.jpg";
import acaiKitkat from "@/assets/acai-kitkat.jpg";
import acaiRafaelo from "@/assets/acai-rafaelo.jpg";
import acaiFerreiro from "@/assets/acai-ferreiro.jpg";
import acaiSonhoValsa from "@/assets/acai-sonho-valsa.jpg";
import acaiOuroBranco from "@/assets/acai-ouro-branco.jpg";
import acaiDiamanteNegro from "@/assets/acai-diamante-negro.jpg";
import balde22l from "@/assets/balde-22l.jpg";
import picoleTrufado from "@/assets/picole-trufado.jpg";
import cocaColaLata from "@/assets/bebidas/coca-cola-lata.jpg";
import aguaComGas from "@/assets/bebidas/agua-com-gas.jpg";
import aguaSemGas from "@/assets/bebidas/agua-sem-gas.jpg";

export interface Produto {
  id: string;
  image: string;
  title: string;
  description: string;
  price: number;
  categoria: string;
}

// Todos os produtos do cardápio
export const todosProdutos: Produto[] = [
  // Combos Premium
  {
    id: "promo-combo-300",
    image: acaiCombo300,
    title: "Combo premium 2 açaí 300ml + 4 complementos grátis",
    description: "Combo 2 Açaís 300 ml (4 complementos grátis cada).",
    price: 49.90,
    categoria: "Combo Premium"
  },
  {
    id: "promo-combo-500",
    image: acaiCombo500,
    title: "Combo premium 2 açaí 500ml + 4 complementos grátis",
    description: "Combo 2 Açaís 500 ml (4 complementos grátis cada).",
    price: 59.90,
    categoria: "Combo Premium"
  },
  
  // Monte Seu Copo
  {
    id: "monte-300ml",
    image: acaiPuro,
    title: "Copo 300ml Açaí Puro - Monte do seu jeito",
    description: "Turbine seu copo do seu jeito com quantos adicionais quiser!",
    price: 25.90,
    categoria: "Monte Seu Copo"
  },
  {
    id: "monte-500ml",
    image: acaiPuro,
    title: "Copo 500ml Açaí Puro - monte do seu jeito",
    description: "Turbine seu copo do seu jeito com quantos adicionais quiser!",
    price: 29.90,
    categoria: "Monte Seu Copo"
  },
  {
    id: "monte-700ml",
    image: acaiPuro,
    title: "Copo 700ml Açaí Puro - monte do seu jeito",
    description: "Turbine seu copo do seu jeito com quantos adicionais quiser!",
    price: 34.90,
    categoria: "Monte Seu Copo"
  },
  
  // Roleta
  {
    id: "roleta-500g",
    image: acaiRoleta,
    title: "Roleta de açaí puro 500g - Monte Do seu jeito",
    description: "Turbine sua roleta do seu jeito com quantos adicionais quiser!",
    price: 32.90,
    categoria: "Roleta"
  },
  {
    id: "roleta-1k",
    image: acaiRoleta,
    title: "Roleta de açaí puro 1L - Monte Do seu jeito",
    description: "Turbine sua roleta do seu jeito com quantos adicionais quiser!",
    price: 59.90,
    categoria: "Roleta"
  },
  
  // Trufados
  {
    id: "sonho-valsa-300",
    image: acaiSonhoValsa,
    title: "Copo trufado Sonho de Valsa - 300ml",
    description: "Leite condensado, Leite em pó, Sonho de Valsa, por cima creme de avelã",
    price: 32.90,
    categoria: "Trufados"
  },
  {
    id: "sonho-valsa-500",
    image: acaiSonhoValsa,
    title: "Copo Trufado Sonho de Valsa - 500ml",
    description: "Leite condensado, Leite em pó, Sonho de Valsa, por cima creme de avelã",
    price: 37.90,
    categoria: "Trufados"
  },
  {
    id: "sonho-valsa-700",
    image: acaiSonhoValsa,
    title: "Copo Trufado Sonho de Valsa - 700ml",
    description: "Leite condensado, Leite em pó, Sonho de Valsa, por cima creme de avelã",
    price: 42.90,
    categoria: "Trufados"
  },
  {
    id: "ouro-branco-300",
    image: acaiOuroBranco,
    title: "Copo Trufado Ouro Branco - 300ml",
    description: "Leite condensado, Leite em pó, Ouro Branco, por cima creme de Ninho",
    price: 32.90,
    categoria: "Trufados"
  },
  {
    id: "ouro-branco-500",
    image: acaiOuroBranco,
    title: "Copo Trufado Ouro Branco - 500ml",
    description: "Leite condensado, Leite em pó, Ouro Branco, por cima creme de Ninho",
    price: 37.90,
    categoria: "Trufados"
  },
  {
    id: "ouro-branco-700",
    image: acaiOuroBranco,
    title: "Copo Trufado Ouro Branco - 700ml",
    description: "Leite condensado, Leite em pó, Ouro Branco, por cima creme de Ninho",
    price: 42.90,
    categoria: "Trufados"
  },
  {
    id: "diamante-negro-300",
    image: acaiDiamanteNegro,
    title: "Copo Trufado Diamante Negro 300 ML",
    description: "Leite condensado, Leite em pó, diamante negro, por cima cobertura de chocolate",
    price: 24.00,
    categoria: "Trufados"
  },
  {
    id: "diamante-negro-400",
    image: acaiDiamanteNegro,
    title: "Copo Trufado Diamante Negro 400 ML",
    description: "Leite condensado, Leite em pó, diamante negro, por cima cobertura de chocolate",
    price: 29.00,
    categoria: "Trufados"
  },
  {
    id: "diamante-negro-700",
    image: acaiDiamanteNegro,
    title: "Copo Trufado Diamante Negro 700 ML",
    description: "Leite condensado, Leite em pó, diamante negro, por cima cobertura de chocolate",
    price: 35.00,
    categoria: "Trufados"
  },
  {
    id: "kitkat-300",
    image: acaiKitkat,
    title: "Copo Trufado Kit Kat 300ml",
    description: "Leite condensado, Leite em pó, Kit Kat, por cima creme de Nutella",
    price: 33.90,
    categoria: "Trufados"
  },
  {
    id: "kitkat-500",
    image: acaiKitkat,
    title: "Copo Trufado Kit Kat 500 Ml",
    description: "Leite condensado, Leite em pó, Kit Kat, por cima creme de Nutella",
    price: 38.90,
    categoria: "Trufados"
  },
  {
    id: "kitkat-700",
    image: acaiKitkat,
    title: "Copo Trufado Kit Kat 700 Ml",
    description: "Leite condensado, Leite em pó, Kit Kat, por cima creme de Nutella",
    price: 43.90,
    categoria: "Trufados"
  },
  {
    id: "laka-300",
    image: acaiLaka,
    title: "Copo trufado Laka 300 ml",
    description: "Leite condensado, Leite em pó, laka, por cima creme de ninho",
    price: 33.90,
    categoria: "Trufados"
  },
  {
    id: "laka-500",
    image: acaiLaka,
    title: "Copo trufado Laka 500 Ml",
    description: "Leite condensado, Leite em pó, laka, por cima creme de ninho",
    price: 38.90,
    categoria: "Trufados"
  },
  {
    id: "laka-700",
    image: acaiLaka,
    title: "Copo trufado Laka 700 Ml",
    description: "Leite condensado, Leite em pó, laka, por cima creme de ninho",
    price: 44.90,
    categoria: "Trufados"
  },
  {
    id: "ferreiro-300",
    image: acaiFerreiro,
    title: "Copo trufado Ferreiro 300 ML",
    description: "Creme de avelã, 2 bombons Ferrera, por cima nutella",
    price: 34.99,
    categoria: "Trufados"
  },
  {
    id: "ferreiro-500",
    image: acaiFerreiro,
    title: "Copo trufado Ferreiro 500 ML",
    description: "Creme de avelã, 2 bombons Ferrera, por cima nutella",
    price: 39.99,
    categoria: "Trufados"
  },
  {
    id: "ferreiro-700",
    image: acaiFerreiro,
    title: "Copo trufado Ferreiro 700 ML",
    description: "Creme de avelã, 2 bombons Ferrera, por cima nutella",
    price: 44.99,
    categoria: "Trufados"
  },
  {
    id: "rafaelo-300",
    image: acaiRafaelo,
    title: "Copo trufado Rafaelo 300 ML",
    description: "Creme raffaelo, 1 bombons raffaelo leite condensado",
    price: 34.99,
    categoria: "Trufados"
  },
  {
    id: "rafaelo-500",
    image: acaiRafaelo,
    title: "Copo trufado Rafaelo 500 ML",
    description: "Creme raffaelo, 2 bombons raffaelo, leite condensado",
    price: 39.99,
    categoria: "Trufados"
  },
  {
    id: "rafaelo-700",
    image: acaiRafaelo,
    title: "Copo trufado Rafaelo 700 ML",
    description: "Creme raffaelo, 2 bombons raffaelo, leite condensado",
    price: 44.99,
    categoria: "Trufados"
  },
  
  // Tradicionais
  {
    id: "kids-300",
    image: acaiKids,
    title: "Açaí Kids 300ml",
    description: "Leite condensado, Confete e chocobol!",
    price: 29.90,
    categoria: "Tradicionais"
  },
  {
    id: "kids-500",
    image: acaiKids,
    title: "Açaí Kids 500ml",
    description: "Leite condensado, Confete e chocobol!",
    price: 34.90,
    categoria: "Tradicionais"
  },
  {
    id: "kids-700",
    image: acaiKids,
    title: "Açaí kids 700ml",
    description: "Leite condensado, Confete e chocobol!",
    price: 39.90,
    categoria: "Tradicionais"
  },
  {
    id: "tradicional-300",
    image: acaiTradicional,
    title: "Açaí Tradicional 300ml",
    description: "Leite condensado, leite em pó, banana e morango",
    price: 29.90,
    categoria: "Tradicionais"
  },
  {
    id: "tradicional-500",
    image: acaiTradicional,
    title: "Açaí Tradicional 500ml",
    description: "Leite condensado, leite em pó, banana e morango",
    price: 34.90,
    categoria: "Tradicionais"
  },
  {
    id: "tradicional-700",
    image: acaiTradicional,
    title: "Açaí Tradicional 700ml",
    description: "Leite condensado, leite em pó, banana e morango",
    price: 39.90,
    categoria: "Tradicionais"
  },
  {
    id: "mega-300",
    image: acaiMega,
    title: "Açaí Mega 300ml",
    description: "Leite condensado, banana, Morango, Confete e sucrilhos",
    price: 29.90,
    categoria: "Tradicionais"
  },
  {
    id: "mega-500",
    image: acaiMega,
    title: "Açaí Mega 500ml",
    description: "Leite condensado, banana, Morango, Confete e sucrilhos",
    price: 34.90,
    categoria: "Tradicionais"
  },
  {
    id: "mega-700",
    image: acaiMega,
    title: "Açaí Mega 700ml",
    description: "Leite condensado, banana, Morango, Confete e sucrilhos",
    price: 39.90,
    categoria: "Tradicionais"
  },
  {
    id: "da-casa-300",
    image: acaiDaCasa,
    title: "Açaí Da Casa 300ml",
    description: "Leite condensado, banana, paçoca",
    price: 29.90,
    categoria: "Tradicionais"
  },
  {
    id: "da-casa-500",
    image: acaiDaCasa,
    title: "Açaí Da Casa 500ml",
    description: "Leite condensado, banana e chocobol!",
    price: 34.90,
    categoria: "Tradicionais"
  },
  {
    id: "da-casa-700",
    image: acaiDaCasa,
    title: "Açaí Da Casa 700ml",
    description: "Leite condensado, banana e chocobol!",
    price: 39.90,
    categoria: "Tradicionais"
  },
  {
    id: "sensacao-300",
    image: acaiSensacao,
    title: "Açaí Sensação 300ml",
    description: "Nutella e morango",
    price: 31.90,
    categoria: "Tradicionais"
  },
  {
    id: "sensacao-500",
    image: acaiSensacao,
    title: "Açaí sensação 500ml",
    description: "Nutella e morango",
    price: 36.90,
    categoria: "Tradicionais"
  },
  {
    id: "sensacao-700",
    image: acaiSensacao,
    title: "Açaí sensação 700ml",
    description: "Nutella e morango",
    price: 41.90,
    categoria: "Tradicionais"
  },
  
  // Balde
  {
    id: "balde-22l",
    image: balde22l,
    title: "BALDE 2,2 L",
    description: "Escolha o açaí e os adicionais!",
    price: 90.00,
    categoria: "Balde"
  },
  
  // Picolés Trufados
  {
    id: "picole-laka-oreo",
    image: picoleTrufado,
    title: "LAKA OREO",
    description: "Picolé trufado sabor Laka Oreo",
    price: 4.00,
    categoria: "Picolé Trufado"
  },
  {
    id: "picole-morango-ninho",
    image: picoleTrufado,
    title: "MORANGO COM NINHO",
    description: "Picolé trufado sabor Morango com Ninho",
    price: 4.00,
    categoria: "Picolé Trufado"
  },
  {
    id: "picole-choconinho",
    image: picoleTrufado,
    title: "CHOCONINHO",
    description: "Picolé trufado sabor Choconinho",
    price: 4.00,
    categoria: "Picolé Trufado"
  },
  
  // Bebidas
  {
    id: "coca-cola-lata",
    image: cocaColaLata,
    title: "COCA COLA LATA",
    description: "Coca-Cola Original 350ml",
    price: 6.00,
    categoria: "Bebidas"
  },
  {
    id: "agua-com-gas",
    image: aguaComGas,
    title: "ÁGUA COM GÁS",
    description: "Água mineral com gás 500ml",
    price: 4.00,
    categoria: "Bebidas"
  },
  {
    id: "agua-sem-gas",
    image: aguaSemGas,
    title: "ÁGUA SEM GÁS",
    description: "Água mineral sem gás 500ml",
    price: 3.50,
    categoria: "Bebidas"
  }
];
