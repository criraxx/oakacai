-- Add PIX fields to pedidos so we can reuse/regenerate QR codes and show them in admin
ALTER TABLE public.pedidos
ADD COLUMN IF NOT EXISTS pix_copia_e_cola text,
ADD COLUMN IF NOT EXISTS pix_checkout_url text,
ADD COLUMN IF NOT EXISTS pix_expires_at timestamptz,
ADD COLUMN IF NOT EXISTS pix_last_created_at timestamptz;

-- Helpful index for querying pending PIX that may need regeneration
CREATE INDEX IF NOT EXISTS idx_pedidos_pix_pending
ON public.pedidos (status_pagamento, forma_pagamento);
