-- Remover políticas de INSERT públicas das tabelas pedidos e pedido_itens
DROP POLICY IF EXISTS "Public can insert pedidos with basic validation" ON public.pedidos;
DROP POLICY IF EXISTS "Public can insert pedido_itens with basic validation" ON public.pedido_itens;

-- Bloquear INSERT direto na tabela pedidos
-- Apenas a edge function criar-pedido com SERVICE_ROLE_KEY pode inserir
CREATE POLICY "Bloquear INSERT direto pedidos"
ON public.pedidos
FOR INSERT
WITH CHECK (false);

-- Bloquear INSERT direto na tabela pedido_itens
-- Apenas a edge function criar-pedido com SERVICE_ROLE_KEY pode inserir
CREATE POLICY "Bloquear INSERT direto pedido_itens"
ON public.pedido_itens
FOR INSERT
WITH CHECK (false);