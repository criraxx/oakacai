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
    { id: "combo-300ml", label: "300ml", ml: 300, preco: 49.90 },
    { id: "combo-500ml", label: "500ml", ml: 500, preco: 59.90 },
  ],
};

export const familiaTrufadoRafaelo: Familia = {
  key: "trufado-rafaelo",
  tamanhos: [
    { id: "trufado-rafaelo-300", label: "300ml", ml: 300, preco: 34.99 },
    { id: "trufado-rafaelo-500", label: "500ml", ml: 500, preco: 39.99 },
    { id: "trufado-rafaelo-700", label: "700ml", ml: 700, preco: 46.99 },
  ],
};

// Aliases: IDs alternativos (usados em "Mais pedidos", carrossel promo etc.)
// mapeados para o id canônico da família.
const aliases: Record<string, string> = {
  "copo-300ml-puro": "monte-300ml",
  "copo-500ml-puro": "monte-500ml",
  "copo-700ml-puro": "monte-700ml",
  "promo-combo-300": "combo-300ml",
  "promo-combo-500": "combo-500ml",
};

const familias: Familia[] = [familiaAcaiPuro, familiaCombo, familiaTrufadoRafaelo];

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
