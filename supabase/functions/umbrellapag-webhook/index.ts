import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    console.log('[umbrellapag-webhook] Received:', JSON.stringify(body));

    // UmbrellaPag envia: { data: { id, status, ... } } ou { id, status, ... }
    const paymentId = body.data?.id || body.id;
    const status = String(body.data?.status || body.status || '').toUpperCase();

    if (!paymentId) {
      console.log('[umbrellapag-webhook] paymentId não encontrado');
      return new Response(JSON.stringify({ success: false }), { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Verificar se pagamento foi aprovado
    if (status === 'PAID' || status === 'COMPLETED') {
      console.log('[umbrellapag-webhook] Pagamento confirmado:', paymentId);

      const { data, error } = await supabase
        .from('pedidos')
        .update({ status_pagamento: 'confirmado' })
        .eq('payment_id', String(paymentId))
        .select('id, numero_pedido')
        .maybeSingle();

      if (error) {
        console.error('[umbrellapag-webhook] Erro ao atualizar pedido:', error);
      } else if (data) {
        console.log('[umbrellapag-webhook] Pedido atualizado:', data.numero_pedido);
      } else {
        console.log('[umbrellapag-webhook] Pedido não encontrado para payment_id:', paymentId);
      }
    } else {
      console.log('[umbrellapag-webhook] Status não é pago:', status);
    }

    return new Response(JSON.stringify({ success: true }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('[umbrellapag-webhook] Erro:', errorMessage);
    
    return new Response(JSON.stringify({ success: false, error: errorMessage }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
