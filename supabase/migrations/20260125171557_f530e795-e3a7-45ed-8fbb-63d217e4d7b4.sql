-- Tabela para configurações globais do sistema
CREATE TABLE public.configuracoes (
  id TEXT PRIMARY KEY DEFAULT 'global',
  gateway_pix TEXT NOT NULL DEFAULT 'umbrellapag',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Inserir configuração padrão
INSERT INTO public.configuracoes (id, gateway_pix) VALUES ('global', 'umbrellapag');

-- Enable RLS
ALTER TABLE public.configuracoes ENABLE ROW LEVEL SECURITY;

-- Permitir leitura pública (para o frontend saber qual gateway usar)
CREATE POLICY "Permitir leitura pública de configuracoes" 
ON public.configuracoes 
FOR SELECT 
USING (true);

-- Permitir atualização pública (admin usa senha para verificar)
CREATE POLICY "Permitir atualização pública de configuracoes" 
ON public.configuracoes 
FOR UPDATE 
USING (true)
WITH CHECK (true);