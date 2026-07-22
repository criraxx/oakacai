
-- ============ CATEGORIAS: padrão visual ============
ALTER TABLE public.categorias
  ADD COLUMN IF NOT EXISTS cor_fundo_card TEXT,
  ADD COLUMN IF NOT EXISTS cor_borda TEXT,
  ADD COLUMN IF NOT EXISTS com_borda BOOLEAN NOT NULL DEFAULT false;

-- ============ ORDER BUMPS: reformulada ============
ALTER TABLE public.order_bumps
  ADD COLUMN IF NOT EXISTS titulo TEXT,
  ADD COLUMN IF NOT EXISTS descricao TEXT,
  ADD COLUMN IF NOT EXISTS imagem TEXT,
  ADD COLUMN IF NOT EXISTS preco_promocional NUMERIC,
  ADD COLUMN IF NOT EXISTS preco_original NUMERIC,
  ADD COLUMN IF NOT EXISTS produto_ofertado_id UUID REFERENCES public.produtos(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS posicao TEXT NOT NULL DEFAULT 'carrinho';

-- Constraint para posicao válida
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'order_bumps_posicao_chk') THEN
    ALTER TABLE public.order_bumps
      ADD CONSTRAINT order_bumps_posicao_chk CHECK (posicao IN ('carrinho', 'checkout', 'pos_pagamento'));
  END IF;
END $$;

-- ============ Tabela de gatilhos (produtos que disparam o bump) ============
CREATE TABLE IF NOT EXISTS public.order_bump_produtos_gatilho (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_bump_id UUID NOT NULL REFERENCES public.order_bumps(id) ON DELETE CASCADE,
  produto_id UUID NOT NULL REFERENCES public.produtos(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (order_bump_id, produto_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_bump_produtos_gatilho TO authenticated;
GRANT ALL ON public.order_bump_produtos_gatilho TO service_role;

ALTER TABLE public.order_bump_produtos_gatilho ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Bloquear acesso publico order_bump_produtos_gatilho"
  ON public.order_bump_produtos_gatilho FOR ALL
  USING (false)
  WITH CHECK (false);

-- ============ DOWNSELLS: reformulada ============
ALTER TABLE public.downsells
  ADD COLUMN IF NOT EXISTS titulo TEXT,
  ADD COLUMN IF NOT EXISTS produto_ofertado_id UUID REFERENCES public.produtos(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS max_exibicoes INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS gatilho TEXT NOT NULL DEFAULT 'sair_pix';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'downsells_gatilho_chk') THEN
    ALTER TABLE public.downsells
      ADD CONSTRAINT downsells_gatilho_chk CHECK (gatilho IN ('sair_pix', 'fechar_checkout', 'ambos'));
  END IF;
END $$;
