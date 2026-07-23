// Mapeamento de famílias de produtos com variações de tamanho.
// Quando o usuário entra em um produto que pertence a uma família,
// a página mostra chips com os outros tamanhos e permite trocar.

export interface Tamanho {
  id: string;           // id do produto correspondente (rota)
  label: string;        // "300ml", "1L"
  ml: number;
  preco: number;
}

export interface Familia {
  key: string;
  tamanhos: Tamanho[];
}

export const familiaAcaiPuro: Familia = {
  key: "acai-puro",
  tamanhos: [
    { id: "monte-300ml", label: "300ml", ml: 300, preco: 25.90 },
    { id: "monte-500ml", label: "500ml", ml: 500, preco: 29.90 },
    { id: "monte-700ml", label: "700ml", ml: 700, preco: 34.90 },
    { id: "monte-1l",    label: "1L",    ml: 1000, preco: 44.90 },
  ],
};

export const familiaCombo: Familia = {
  key: "combo-premium",
  tamanhos: [
    { id: "promo-combo-300", label: "300ml", ml: 300, preco: 49.90 },
    { id: "promo-combo-500", label: "500ml", ml: 500, preco: 59.90 },
  ],
};

export const familiaRoleta: Familia = {
  key: "roleta",
  tamanhos: [
    { id: "roleta-500g", label: "500g", ml: 500, preco: 32.90 },
    { id: "roleta-1k",   label: "1L",   ml: 1000, preco: 59.90 },
  ],
};

export const familiaSonhoValsa: Familia = {
  key: "trufado-sonho-valsa",
  tamanhos: [
    { id: "sonho-valsa-300", label: "300ml", ml: 300, preco: 32.90 },
    { id: "sonho-valsa-500", label: "500ml", ml: 500, preco: 37.90 },
    { id: "sonho-valsa-700", label: "700ml", ml: 700, preco: 42.90 },
  ],
};

export const familiaOuroBranco: Familia = {
  key: "trufado-ouro-branco",
  tamanhos: [
    { id: "ouro-branco-300", label: "300ml", ml: 300, preco: 32.90 },
    { id: "ouro-branco-500", label: "500ml", ml: 500, preco: 37.90 },
    { id: "ouro-branco-700", label: "700ml", ml: 700, preco: 42.90 },
  ],
};

export const familiaDiamanteNegro: Familia = {
  key: "trufado-diamante-negro",
  tamanhos: [
    { id: "diamante-negro-300", label: "300ml", ml: 300, preco: 24.00 },
    { id: "diamante-negro-400", label: "400ml", ml: 400, preco: 29.00 },
    { id: "diamante-negro-700", label: "700ml", ml: 700, preco: 35.00 },
  ],
};

export const familiaKitkat: Familia = {
  key: "trufado-kitkat",
  tamanhos: [
    { id: "kitkat-300", label: "300ml", ml: 300, preco: 33.90 },
    { id: "kitkat-500", label: "500ml", ml: 500, preco: 38.90 },
    { id: "kitkat-700", label: "700ml", ml: 700, preco: 43.90 },
  ],
};

export const familiaLaka: Familia = {
  key: "trufado-laka",
  tamanhos: [
    { id: "laka-300", label: "300ml", ml: 300, preco: 33.90 },
    { id: "laka-500", label: "500ml", ml: 500, preco: 38.90 },
    { id: "laka-700", label: "700ml", ml: 700, preco: 44.90 },
  ],
};

export const familiaFerreiro: Familia = {
  key: "trufado-ferreiro",
  tamanhos: [
    { id: "ferreiro-300", label: "300ml", ml: 300, preco: 34.99 },
    { id: "ferreiro-500", label: "500ml", ml: 500, preco: 39.99 },
    { id: "ferreiro-700", label: "700ml", ml: 700, preco: 44.99 },
  ],
};

export const familiaRafaelo: Familia = {
  key: "trufado-rafaelo",
  tamanhos: [
    { id: "rafaelo-300", label: "300ml", ml: 300, preco: 34.99 },
    { id: "rafaelo-500", label: "500ml", ml: 500, preco: 39.99 },
    { id: "rafaelo-700", label: "700ml", ml: 700, preco: 44.99 },
  ],
};

export const familiaKids: Familia = {
  key: "tradicional-kids",
  tamanhos: [
    { id: "kids-300", label: "300ml", ml: 300, preco: 29.90 },
    { id: "kids-500", label: "500ml", ml: 500, preco: 34.90 },
    { id: "kids-700", label: "700ml", ml: 700, preco: 39.90 },
  ],
};

export const familiaTradicional: Familia = {
  key: "tradicional-classico",
  tamanhos: [
    { id: "tradicional-300", label: "300ml", ml: 300, preco: 29.90 },
    { id: "tradicional-500", label: "500ml", ml: 500, preco: 34.90 },
    { id: "tradicional-700", label: "700ml", ml: 700, preco: 39.90 },
  ],
};

export const familiaMega: Familia = {
  key: "tradicional-mega",
  tamanhos: [
    { id: "mega-300", label: "300ml", ml: 300, preco: 29.90 },
    { id: "mega-500", label: "500ml", ml: 500, preco: 34.90 },
    { id: "mega-700", label: "700ml", ml: 700, preco: 39.90 },
  ],
};

export const familiaDaCasa: Familia = {
  key: "tradicional-da-casa",
  tamanhos: [
    { id: "da-casa-300", label: "300ml", ml: 300, preco: 29.90 },
    { id: "da-casa-500", label: "500ml", ml: 500, preco: 34.90 },
    { id: "da-casa-700", label: "700ml", ml: 700, preco: 39.90 },
  ],
};

export const familiaSensacao: Familia = {
  key: "tradicional-sensacao",
  tamanhos: [
    { id: "sensacao-300", label: "300ml", ml: 300, preco: 31.90 },
    { id: "sensacao-500", label: "500ml", ml: 500, preco: 36.90 },
    { id: "sensacao-700", label: "700ml", ml: 700, preco: 41.90 },
  ],
};

// Aliases: IDs alternativos (usados em "Mais pedidos", carrossel promo etc.)
// mapeados para o id canônico da família.
const aliases: Record<string, string> = {
  "copo-300ml-puro": "monte-300ml",
  "copo-500ml-puro": "monte-500ml",
  "copo-700ml-puro": "monte-700ml",
  "combo-300ml": "promo-combo-300",
  "combo-500ml": "promo-combo-500",
};

const familias: Familia[] = [
  familiaAcaiPuro,
  familiaCombo,
  familiaRoleta,
  familiaSonhoValsa,
  familiaOuroBranco,
  familiaDiamanteNegro,
  familiaKitkat,
  familiaLaka,
  familiaFerreiro,
  familiaRafaelo,
  familiaKids,
  familiaTradicional,
  familiaMega,
  familiaDaCasa,
  familiaSensacao,
];

export function resolveFamilia(produtoId: string): { familia: Familia; tamanhoAtual: Tamanho } | null {
  const canonical = aliases[produtoId] ?? produtoId;
  for (const fam of familias) {
    const t = fam.tamanhos.find((x) => x.id === canonical);
    if (t) return { familia: fam, tamanhoAtual: t };
  }
  return null;
}

export function precoMinimo(fam: Familia): number {
  return Math.min(...fam.tamanhos.map((t) => t.preco));
}
