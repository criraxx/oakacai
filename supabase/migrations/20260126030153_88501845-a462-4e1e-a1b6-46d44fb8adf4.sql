-- Remover políticas permissivas da tabela numeros_whatsapp
DROP POLICY IF EXISTS "Permitir atualização pública de números whatsapp" ON public.numeros_whatsapp;
DROP POLICY IF EXISTS "Permitir exclusão pública de números whatsapp" ON public.numeros_whatsapp;
DROP POLICY IF EXISTS "Permitir inserção pública de números whatsapp" ON public.numeros_whatsapp;

-- Criar políticas restritivas que bloqueiam acesso direto
-- Apenas a edge function admin-config com SERVICE_ROLE_KEY pode modificar

CREATE POLICY "Bloquear UPDATE direto numeros_whatsapp"
ON public.numeros_whatsapp
FOR UPDATE
USING (false);

CREATE POLICY "Bloquear DELETE direto numeros_whatsapp"
ON public.numeros_whatsapp
FOR DELETE
USING (false);

CREATE POLICY "Bloquear INSERT direto numeros_whatsapp"
ON public.numeros_whatsapp
FOR INSERT
WITH CHECK (false);