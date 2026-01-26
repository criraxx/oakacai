-- Criar tabela para números de WhatsApp
CREATE TABLE public.numeros_whatsapp (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero TEXT NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.numeros_whatsapp ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso público
CREATE POLICY "Permitir leitura pública de números whatsapp" 
ON public.numeros_whatsapp 
FOR SELECT 
USING (true);

CREATE POLICY "Permitir inserção pública de números whatsapp" 
ON public.numeros_whatsapp 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Permitir atualização pública de números whatsapp" 
ON public.numeros_whatsapp 
FOR UPDATE 
USING (true);

CREATE POLICY "Permitir exclusão pública de números whatsapp" 
ON public.numeros_whatsapp 
FOR DELETE 
USING (true);

-- Função para garantir que apenas um número fique ativo por vez
CREATE OR REPLACE FUNCTION public.set_numero_whatsapp_ativo()
RETURNS TRIGGER AS $$
BEGIN
  -- Se o novo registro está sendo marcado como ativo
  IF NEW.ativo = true THEN
    -- Desativar todos os outros números
    UPDATE public.numeros_whatsapp 
    SET ativo = false 
    WHERE id != NEW.id AND ativo = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para executar a função antes de inserir ou atualizar
CREATE TRIGGER trigger_set_numero_whatsapp_ativo
BEFORE INSERT OR UPDATE ON public.numeros_whatsapp
FOR EACH ROW
EXECUTE FUNCTION public.set_numero_whatsapp_ativo();