-- Remover política de INSERT pública da tabela vales_presente
DROP POLICY IF EXISTS "Public can insert vales_presente with basic validation" ON public.vales_presente;

-- Bloquear INSERT direto na tabela vales_presente
-- Apenas edge functions com SERVICE_ROLE_KEY podem inserir
CREATE POLICY "Bloquear INSERT direto vales_presente"
ON public.vales_presente
FOR INSERT
WITH CHECK (false);