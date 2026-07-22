
-- =========================================
-- CATEGORIAS
-- =========================================
CREATE TABLE public.categorias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  ordem INTEGER NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.categorias TO service_role;
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categorias_no_public" ON public.categorias FOR ALL USING (false) WITH CHECK (false);

-- =========================================
-- PRODUTOS
-- =========================================
CREATE TABLE public.produtos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE,
  nome TEXT NOT NULL,
  descricao TEXT DEFAULT '',
  preco NUMERIC(10,2) NOT NULL DEFAULT 0,
  imagem TEXT,
  categoria_id UUID REFERENCES public.categorias(id) ON DELETE SET NULL,
  ordem INTEGER NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  com_borda BOOLEAN NOT NULL DEFAULT false,
  cor_borda TEXT DEFAULT '#F5E6D3',
  cor_fundo_card TEXT DEFAULT '#FFFFFF',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.produtos TO service_role;
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "produtos_no_public" ON public.produtos FOR ALL USING (false) WITH CHECK (false);

-- =========================================
-- SEÇÕES DE COMPLEMENTOS
-- =========================================
CREATE TABLE public.secoes_complementos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE,
  titulo TEXT NOT NULL,
  subtitulo TEXT DEFAULT '',
  tipo TEXT NOT NULL DEFAULT 'pago' CHECK (tipo IN ('gratis','pago')),
  max_itens INTEGER NOT NULL DEFAULT 15,
  ordem INTEGER NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.secoes_complementos TO service_role;
ALTER TABLE public.secoes_complementos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "secoes_no_public" ON public.secoes_complementos FOR ALL USING (false) WITH CHECK (false);

-- =========================================
-- COMPLEMENTOS
-- =========================================
CREATE TABLE public.complementos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  secao_id UUID NOT NULL REFERENCES public.secoes_complementos(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  preco NUMERIC(10,2),
  imagem TEXT,
  max_quantidade INTEGER NOT NULL DEFAULT 3,
  ordem INTEGER NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.complementos TO service_role;
ALTER TABLE public.complementos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "complementos_no_public" ON public.complementos FOR ALL USING (false) WITH CHECK (false);
CREATE INDEX idx_complementos_secao ON public.complementos(secao_id);

-- =========================================
-- PRODUTO ↔ SEÇÕES DE COMPLEMENTOS
-- =========================================
CREATE TABLE public.produto_secoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  produto_id UUID NOT NULL REFERENCES public.produtos(id) ON DELETE CASCADE,
  secao_id UUID NOT NULL REFERENCES public.secoes_complementos(id) ON DELETE CASCADE,
  ordem INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (produto_id, secao_id)
);
GRANT ALL ON public.produto_secoes TO service_role;
ALTER TABLE public.produto_secoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "produto_secoes_no_public" ON public.produto_secoes FOR ALL USING (false) WITH CHECK (false);

-- =========================================
-- BANNERS
-- =========================================
CREATE TABLE public.banners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  imagem TEXT NOT NULL,
  ordem INTEGER NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  acao_tipo TEXT NOT NULL DEFAULT 'nenhuma' CHECK (acao_tipo IN ('nenhuma','produto','categoria','url')),
  acao_valor TEXT,
  intervalo_segundos INTEGER NOT NULL DEFAULT 6,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.banners TO service_role;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "banners_no_public" ON public.banners FOR ALL USING (false) WITH CHECK (false);

-- =========================================
-- ORDER BUMPS
-- =========================================
CREATE TABLE public.order_bumps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT DEFAULT '',
  imagem TEXT,
  preco_original NUMERIC(10,2) NOT NULL DEFAULT 0,
  preco_promocional NUMERIC(10,2) NOT NULL DEFAULT 0,
  produto_vinculado_id UUID REFERENCES public.produtos(id) ON DELETE SET NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  ordem INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.order_bumps TO service_role;
ALTER TABLE public.order_bumps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "order_bumps_no_public" ON public.order_bumps FOR ALL USING (false) WITH CHECK (false);

-- =========================================
-- DOWNSELLS
-- =========================================
CREATE TABLE public.downsells (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT DEFAULT '',
  imagem TEXT,
  preco_original NUMERIC(10,2) NOT NULL DEFAULT 0,
  preco_promocional NUMERIC(10,2) NOT NULL DEFAULT 0,
  produto_vinculado_id UUID REFERENCES public.produtos(id) ON DELETE SET NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  ordem INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.downsells TO service_role;
ALTER TABLE public.downsells ENABLE ROW LEVEL SECURITY;
CREATE POLICY "downsells_no_public" ON public.downsells FOR ALL USING (false) WITH CHECK (false);

-- =========================================
-- CONFIGURAÇÕES: novas colunas
-- =========================================
ALTER TABLE public.configuracoes
  ADD COLUMN IF NOT EXISTS cor_fundo_site TEXT DEFAULT '#FFFFFF',
  ADD COLUMN IF NOT EXISTS cor_padrao_borda_produto TEXT DEFAULT '#F5E6D3',
  ADD COLUMN IF NOT EXISTS borda_produto_ativa BOOLEAN DEFAULT false;

-- =========================================
-- PEDIDO_ITENS: marcadores de origem
-- =========================================
ALTER TABLE public.pedido_itens
  ADD COLUMN IF NOT EXISTS origem TEXT DEFAULT 'produto',
  ADD COLUMN IF NOT EXISTS oferta_id UUID;

-- =========================================
-- Trigger updated_at reutilizável
-- =========================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_categorias_updated BEFORE UPDATE ON public.categorias FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_produtos_updated BEFORE UPDATE ON public.produtos FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_secoes_updated BEFORE UPDATE ON public.secoes_complementos FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_complementos_updated BEFORE UPDATE ON public.complementos FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_banners_updated BEFORE UPDATE ON public.banners FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_order_bumps_updated BEFORE UPDATE ON public.order_bumps FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_downsells_updated BEFORE UPDATE ON public.downsells FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
