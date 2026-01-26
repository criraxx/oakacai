-- Remover política de UPDATE pública insegura da tabela configuracoes
DROP POLICY IF EXISTS "Permitir atualização pública de configuracoes" ON public.configuracoes;

-- Criar política que bloqueia UPDATE para usuários anônimos
-- Apenas a edge function com SERVICE_ROLE_KEY pode atualizar
CREATE POLICY "Bloquear UPDATE direto configuracoes"
ON public.configuracoes
FOR UPDATE
USING (false)
WITH CHECK (false);