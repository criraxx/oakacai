import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { resolveImageUrl } from "@/lib/resolveImageUrl";

export interface CatalogoCategoria {
  id: string;
  nome: string;
  slug: string;
  ordem: number;
  ativo: boolean;
}

export interface CatalogoProduto {
  id: string;
  slug: string | null;
  nome: string;
  descricao: string | null;
  preco: number;
  imagem: string | null;
  categoria_id: string | null;
  ordem: number;
  ativo: boolean;
  com_borda: boolean;
  cor_borda: string | null;
  cor_fundo_card: string | null;
}

export interface CatalogoSecao {
  id: string;
  slug: string | null;
  titulo: string;
  subtitulo: string | null;
  tipo: 'gratis' | 'pago';
  max_itens: number;
  ordem: number;
}

export interface CatalogoComplemento {
  id: string;
  secao_id: string;
  nome: string;
  preco: number | null;
  imagem: string | null;
  max_quantidade: number;
  ordem: number;
}

export interface CatalogoBanner {
  id: string;
  imagem: string;
  ordem: number;
  acao_tipo: 'nenhuma' | 'produto' | 'categoria' | 'url';
  acao_valor: string | null;
  intervalo_segundos: number;
}

export interface CatalogoOrderBump {
  id: string;
  titulo: string | null;
  nome: string;
  descricao: string | null;
  imagem: string | null;
  preco_original: number;
  preco_promocional: number;
  produto_ofertado_id: string | null;
  produto_vinculado_id: string | null;
  gatilho: 'carrinho' | 'checkout' | null;
  max_exibicoes: number | null;
}

export interface CatalogoDownsell {
  id: string;
  titulo: string | null;
  nome: string;
  descricao: string | null;
  imagem: string | null;
  preco_original: number;
  preco_promocional: number;
  produto_ofertado_id: string | null;
  produto_vinculado_id: string | null;
  posicao: 'checkout' | 'saida' | null;
}

export interface CatalogoData {
  categorias: CatalogoCategoria[];
  produtos: CatalogoProduto[];
  banners: CatalogoBanner[];
  secoes: CatalogoSecao[];
  complementos: CatalogoComplemento[];
  produto_secoes: { produto_id: string; secao_id: string; ordem: number }[];
  order_bumps: CatalogoOrderBump[];
  downsells: CatalogoDownsell[];
  order_bump_gatilhos: { order_bump_id: string; produto_id: string }[];
  config: Record<string, unknown> | null;
}

export function useCatalogo() {
  return useQuery<CatalogoData>({
    queryKey: ['catalogo'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('buscar-catalogo');
      if (error) throw error;
      const catalogo = data as CatalogoData;
      catalogo.produtos = catalogo.produtos.map((p) => ({ ...p, imagem: resolveImageUrl(p.imagem) }));
      catalogo.complementos = catalogo.complementos.map((c) => ({ ...c, imagem: resolveImageUrl(c.imagem) }));
      catalogo.banners = catalogo.banners.map((b) => ({ ...b, imagem: resolveImageUrl(b.imagem) }));
      catalogo.order_bumps = catalogo.order_bumps.map((b) => ({ ...b, imagem: resolveImageUrl(b.imagem) }));
      catalogo.downsells = catalogo.downsells.map((d) => ({ ...d, imagem: resolveImageUrl(d.imagem) }));
      return catalogo;
    },
    staleTime: 60_000,
  });
}
