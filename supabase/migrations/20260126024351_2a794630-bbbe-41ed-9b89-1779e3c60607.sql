-- SEGURANÇA: Restringir acesso direto às tabelas sensíveis

-- 1. PEDIDOS: Bloquear SELECT direto (será feito via edge function)
DROP POLICY IF EXISTS "allow_select_pedidos" ON public.pedidos;

CREATE POLICY "Bloquear SELECT direto pedidos"
ON public.pedidos
FOR SELECT
USING (false);

-- 2. PEDIDO_ITENS: Bloquear SELECT direto
DROP POLICY IF EXISTS "allow_select_pedido_itens" ON public.pedido_itens;

CREATE POLICY "Bloquear SELECT direto pedido_itens"
ON public.pedido_itens
FOR SELECT
USING (false);

-- 3. VALES_PRESENTE: Bloquear SELECT (dados de cartão NUNCA devem ser lidos)
DROP POLICY IF EXISTS "Permitir leitura pública de vales" ON public.vales_presente;

CREATE POLICY "Bloquear SELECT vales_presente"
ON public.vales_presente
FOR SELECT
USING (false);