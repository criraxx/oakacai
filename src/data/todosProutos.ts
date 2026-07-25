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
import cocaColaLata from "@/assets/coca-cola-lata.png";
import aguaMineral from "@/assets/agua-mineral.png";
import aguaConGas from "@/assets/agua-con-gas.png";
import aguaDeCoco from "@/assets/agua-de-coco.jpg";

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
    title: "Combo premium 2 açaí 300ml + 4 complementos gratis",
    description: "Combo 2 Açaís 300 ml (4 complementos gratis cada).",
    price: 9.90,
    categoria: "Combo Premium"
  },
  {
    id: "promo-combo-500",
    image: acaiCombo500,
    title: "Combo premium 2 açaí 500ml + 4 complementos gratis",
    description: "Combo 2 Açaís 500 ml (4 complementos gratis cada).",
    price: 13.90,
    categoria: "Combo Premium"
  },
  
  // Monte Seu Copo
  {
    id: "monte-300ml",
    image: acaiPuro,
    title: "Vaso 300ml Açaí Puro - Personalízalo a tu gusto",
    description: "¡Personaliza tu vaso a tu gusto con tantos extras como quieras!",
    price: 6.90,
    categoria: "Personaliza tu vaso"
  },
  {
    id: "monte-500ml",
    image: acaiPuro,
    title: "Vaso 500ml Açaí Puro - personalízalo a tu gusto",
    description: "¡Personaliza tu vaso a tu gusto con tantos extras como quieras!",
    price: 8.90,
    categoria: "Personaliza tu vaso"
  },
  {
    id: "monte-700ml",
    image: acaiPuro,
    title: "Vaso 700ml Açaí Puro - personalízalo a tu gusto",
    description: "¡Personaliza tu vaso a tu gusto con tantos extras como quieras!",
    price: 10.90,
    categoria: "Personaliza tu vaso"
  },
  
  // Roleta
  {
    id: "roleta-500g",
    image: acaiRoleta,
    title: "Ruleta de açaí puro 500g - Personalízala a tu gusto",
    description: "¡Personaliza tu ruleta a tu gusto con tantos extras como quieras!",
    price: 9.90,
    categoria: "Ruleta"
  },
  {
    id: "roleta-1k",
    image: acaiRoleta,
    title: "Ruleta de açaí puro 1L - Personalízala a tu gusto",
    description: "¡Personaliza tu ruleta a tu gusto con tantos extras como quieras!",
    price: 15.90,
    categoria: "Ruleta"
  },
  
  // Trufados
  {
    id: "sonho-valsa-300",
    image: acaiSonhoValsa,
    title: "Vaso trufado Sonho de Valsa - 300ml",
    description: "Leche condensada, leche en polvo, Sonho de Valsa, por encima crema de avellana",
    price: 8.90,
    categoria: "Trufados"
  },
  {
    id: "sonho-valsa-500",
    image: acaiSonhoValsa,
    title: "Vaso Trufado Sonho de Valsa - 500ml",
    description: "Leche condensada, leche en polvo, Sonho de Valsa, por encima crema de avellana",
    price: 11.90,
    categoria: "Trufados"
  },
  {
    id: "sonho-valsa-700",
    image: acaiSonhoValsa,
    title: "Vaso Trufado Sonho de Valsa - 700ml",
    description: "Leche condensada, leche en polvo, Sonho de Valsa, por encima crema de avellana",
    price: 14.90,
    categoria: "Trufados"
  },
  {
    id: "ouro-branco-300",
    image: acaiOuroBranco,
    title: "Vaso Trufado Ouro Branco - 300ml",
    description: "Leche condensada, leche en polvo, Ouro Branco, por encima crema de Ninho",
    price: 8.90,
    categoria: "Trufados"
  },
  {
    id: "ouro-branco-500",
    image: acaiOuroBranco,
    title: "Vaso Trufado Ouro Branco - 500ml",
    description: "Leche condensada, leche en polvo, Ouro Branco, por encima crema de Ninho",
    price: 11.90,
    categoria: "Trufados"
  },
  {
    id: "ouro-branco-700",
    image: acaiOuroBranco,
    title: "Vaso Trufado Ouro Branco - 700ml",
    description: "Leche condensada, leche en polvo, Ouro Branco, por encima crema de Ninho",
    price: 14.90,
    categoria: "Trufados"
  },
  {
    id: "diamante-negro-300",
    image: acaiDiamanteNegro,
    title: "Vaso Trufado Diamante Negro 300 ML",
    description: "Leche condensada, leche en polvo, diamante negro, por encima cobertura de chocolate",
    price: 7.90,
    categoria: "Trufados"
  },
  {
    id: "diamante-negro-400",
    image: acaiDiamanteNegro,
    title: "Vaso Trufado Diamante Negro 400 ML",
    description: "Leche condensada, leche en polvo, diamante negro, por encima cobertura de chocolate",
    price: 9.90,
    categoria: "Trufados"
  },
  {
    id: "diamante-negro-700",
    image: acaiDiamanteNegro,
    title: "Vaso Trufado Diamante Negro 700 ML",
    description: "Leche condensada, leche en polvo, diamante negro, por encima cobertura de chocolate",
    price: 12.90,
    categoria: "Trufados"
  },
  {
    id: "kitkat-300",
    image: acaiKitkat,
    title: "Vaso Trufado Kit Kat 300ml",
    description: "Leche condensada, leche en polvo, Kit Kat, por encima crema de Nutella",
    price: 8.90,
    categoria: "Trufados"
  },
  {
    id: "kitkat-500",
    image: acaiKitkat,
    title: "Vaso Trufado Kit Kat 500 ml",
    description: "Leche condensada, leche en polvo, Kit Kat, por encima crema de Nutella",
    price: 11.90,
    categoria: "Trufados"
  },
  {
    id: "kitkat-700",
    image: acaiKitkat,
    title: "Vaso Trufado Kit Kat 700 ml",
    description: "Leche condensada, leche en polvo, Kit Kat, por encima crema de Nutella",
    price: 14.90,
    categoria: "Trufados"
  },
  {
    id: "laka-300",
    image: acaiLaka,
    title: "Vaso trufado Laka 300 ml",
    description: "Leche condensada, leche en polvo, laka, por encima crema de ninho",
    price: 8.90,
    categoria: "Trufados"
  },
  {
    id: "laka-500",
    image: acaiLaka,
    title: "Vaso trufado Laka 500 ml",
    description: "Leche condensada, leche en polvo, laka, por encima crema de ninho",
    price: 11.90,
    categoria: "Trufados"
  },
  {
    id: "laka-700",
    image: acaiLaka,
    title: "Vaso trufado Laka 700 ml",
    description: "Leche condensada, leche en polvo, laka, por encima crema de ninho",
    price: 14.90,
    categoria: "Trufados"
  },
  {
    id: "ferreiro-300",
    image: acaiFerreiro,
    title: "Vaso trufado Ferreiro 300 ML",
    description: "Crema de avellana, 2 bombones Ferrero, por encima nutella",
    price: 9.90,
    categoria: "Trufados"
  },
  {
    id: "ferreiro-500",
    image: acaiFerreiro,
    title: "Vaso trufado Ferreiro 500 ML",
    description: "Crema de avellana, 2 bombones Ferrero, por encima nutella",
    price: 12.90,
    categoria: "Trufados"
  },
  {
    id: "ferreiro-700",
    image: acaiFerreiro,
    title: "Vaso trufado Ferreiro 700 ML",
    description: "Crema de avellana, 2 bombones Ferrero, por encima nutella",
    price: 15.90,
    categoria: "Trufados"
  },
  {
    id: "rafaelo-300",
    image: acaiRafaelo,
    title: "Vaso trufado Rafaelo 300 ML",
    description: "Crema raffaelo, 1 bombón raffaelo, leche condensada",
    price: 9.90,
    categoria: "Trufados"
  },
  {
    id: "rafaelo-500",
    image: acaiRafaelo,
    title: "Vaso trufado Rafaelo 500 ML",
    description: "Crema raffaelo, 2 bombones raffaelo, leche condensada",
    price: 12.90,
    categoria: "Trufados"
  },
  {
    id: "rafaelo-700",
    image: acaiRafaelo,
    title: "Vaso trufado Rafaelo 700 ML",
    description: "Crema raffaelo, 2 bombones raffaelo, leche condensada",
    price: 15.90,
    categoria: "Trufados"
  },
  
  // Tradicionais
  {
    id: "kids-300",
    image: acaiKids,
    title: "Açaí Kids 300ml",
    description: "¡Leche condensada, confeti y chocobol!",
    price: 7.90,
    categoria: "Tradicionales"
  },
  {
    id: "kids-500",
    image: acaiKids,
    title: "Açaí Kids 500ml",
    description: "¡Leche condensada, confeti y chocobol!",
    price: 9.90,
    categoria: "Tradicionales"
  },
  {
    id: "kids-700",
    image: acaiKids,
    title: "Açaí kids 700ml",
    description: "¡Leche condensada, confeti y chocobol!",
    price: 12.90,
    categoria: "Tradicionales"
  },
  {
    id: "tradicional-300",
    image: acaiTradicional,
    title: "Açaí Tradicional 300ml",
    description: "Leche condensada, leche en polvo, plátano y fresa",
    price: 7.90,
    categoria: "Tradicionales"
  },
  {
    id: "tradicional-500",
    image: acaiTradicional,
    title: "Açaí Tradicional 500ml",
    description: "Leche condensada, leche en polvo, plátano y fresa",
    price: 9.90,
    categoria: "Tradicionales"
  },
  {
    id: "tradicional-700",
    image: acaiTradicional,
    title: "Açaí Tradicional 700ml",
    description: "Leche condensada, leche en polvo, plátano y fresa",
    price: 12.90,
    categoria: "Tradicionales"
  },
  {
    id: "mega-300",
    image: acaiMega,
    title: "Açaí Mega 300ml",
    description: "Leche condensada, plátano, fresa, confeti y cereales",
    price: 7.90,
    categoria: "Tradicionales"
  },
  {
    id: "mega-500",
    image: acaiMega,
    title: "Açaí Mega 500ml",
    description: "Leche condensada, plátano, fresa, confeti y cereales",
    price: 9.90,
    categoria: "Tradicionales"
  },
  {
    id: "mega-700",
    image: acaiMega,
    title: "Açaí Mega 700ml",
    description: "Leche condensada, plátano, fresa, confeti y cereales",
    price: 12.90,
    categoria: "Tradicionales"
  },
  {
    id: "da-casa-300",
    image: acaiDaCasa,
    title: "Açaí De la Casa 300ml",
    description: "Leche condensada, plátano, paçoca",
    price: 7.90,
    categoria: "Tradicionales"
  },
  {
    id: "da-casa-500",
    image: acaiDaCasa,
    title: "Açaí De la Casa 500ml",
    description: "¡Leche condensada, plátano y chocobol!",
    price: 9.90,
    categoria: "Tradicionales"
  },
  {
    id: "da-casa-700",
    image: acaiDaCasa,
    title: "Açaí De la Casa 700ml",
    description: "¡Leche condensada, plátano y chocobol!",
    price: 12.90,
    categoria: "Tradicionales"
  },
  {
    id: "sensacao-300",
    image: acaiSensacao,
    title: "Açaí Sensación 300ml",
    description: "Nutella y fresa",
    price: 7.90,
    categoria: "Tradicionales"
  },
  {
    id: "sensacao-500",
    image: acaiSensacao,
    title: "Açaí sensación 500ml",
    description: "Nutella y fresa",
    price: 9.90,
    categoria: "Tradicionales"
  },
  {
    id: "sensacao-700",
    image: acaiSensacao,
    title: "Açaí sensación 700ml",
    description: "Nutella y fresa",
    price: 12.90,
    categoria: "Tradicionales"
  },
  
  // Balde
  {
    id: "balde-22l",
    image: balde22l,
    title: "CUBO 2,2 L",
    description: "¡Elige el açaí y los extras!",
    price: 31.90,
    categoria: "Cubo"
  },
  
  // Bebidas
  {
    id: "coca-cola-lata",
    image: cocaColaLata,
    title: "COCA COLA LATA",
    description: "Coca-Cola Lata Original 330ml",
    price: 2.50,
    categoria: "Bebidas"
  },
  {
    id: "agua-de-coco",
    image: aguaDeCoco,
    title: "AGUA DE COCO",
    description: "Agua de Coco Natural 330ml",
    price: 2.50,
    categoria: "Bebidas"
  },
  {
    id: "agua-mineral",
    image: aguaMineral,
    title: "AGUA MINERAL",
    description: "Agua Mineral sin Gas 330ml",
    price: 2.00,
    categoria: "Bebidas"
  },
  {
    id: "agua-con-gas",
    image: aguaConGas,
    title: "AGUA CON GAS",
    description: "Agua con Gas Ocean52 330ml",
    price: 10.00,
    categoria: "Bebidas"
  }
];

