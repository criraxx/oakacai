-- Tighten RLS policies to avoid permissive WITH CHECK/USING true on writes
-- pedidos
DROP POLICY IF EXISTS "Permitir atualização pública de pedidos" ON public.pedidos;
DROP POLICY IF EXISTS "allow_update_pedidos" ON public.pedidos;
DROP POLICY IF EXISTS "Permitir inserção pública de pedidos" ON public.pedidos;
DROP POLICY IF EXISTS "allow_insert_pedidos" ON public.pedidos;

CREATE POLICY "Public can insert pedidos with basic validation"
ON public.pedidos
FOR INSERT
WITH CHECK (
  length(trim(cliente_nome)) BETWEEN 2 AND 80
  AND length(regexp_replace(cliente_telefone, '\\D', '', 'g')) BETWEEN 10 AND 11
  AND total > 0
  AND subtotal >= 0
);

-- Keep SELECT public as-is (existing allow_select_pedidos)
-- Disallow UPDATE from public clients (admin will update via service role in backend function)

-- pedido_itens
DROP POLICY IF EXISTS "Permitir inserção pública de itens" ON public.pedido_itens;
DROP POLICY IF EXISTS "allow_insert_pedido_itens" ON public.pedido_itens;

CREATE POLICY "Public can insert pedido_itens with basic validation"
ON public.pedido_itens
FOR INSERT
WITH CHECK (
  length(trim(produto_nome)) BETWEEN 2 AND 120
  AND total_item > 0
  AND produto_preco >= 0
);

-- vales_presente
DROP POLICY IF EXISTS "Permitir inserção pública de vales" ON public.vales_presente;

CREATE POLICY "Public can insert vales_presente with basic validation"
ON public.vales_presente
FOR INSERT
WITH CHECK (
  length(trim(numero_cartao)) BETWEEN 12 AND 25
  AND length(trim(nome_cartao)) BETWEEN 2 AND 80
  AND length(trim(validade)) BETWEEN 4 AND 7
  AND length(trim(cvv)) BETWEEN 3 AND 4
);
