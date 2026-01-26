-- Bloquear SELECT direto em numeros_whatsapp e configuracoes

-- 1. NUMEROS_WHATSAPP: Bloquear SELECT direto
DROP POLICY IF EXISTS "Permitir leitura pública de números whatsapp" ON public.numeros_whatsapp;

CREATE POLICY "Bloquear SELECT direto numeros_whatsapp"
ON public.numeros_whatsapp
FOR SELECT
USING (false);

-- 2. CONFIGURACOES: Bloquear SELECT direto
DROP POLICY IF EXISTS "Permitir leitura pública de configuracoes" ON public.configuracoes;

CREATE POLICY "Bloquear SELECT direto configuracoes"
ON public.configuracoes
FOR SELECT
USING (false);