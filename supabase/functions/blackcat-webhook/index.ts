import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-event, x-webhook-source',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const webhookEvent = req.headers.get('X-Webhook-Event');
    const body = await req.json();
    console.log('[blackcat-webhook] Event:', webhookEvent, 'Body:', JSON.stringify(body));

    // BlackCat envia: { event, transactionId, status, amount, ... }
    const paymentId = body.transactionId;
    const status = String(body.status || '').toUpperCase();
    const event = body.event || webhookEvent;

    if (!paymentId) {
      console.log('[blackcat-webhook] transactionId não encontrado');
      return new Response(JSON.stringify({ success: false }), { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Verificar se pagamento foi aprovado
    if (event === 'transaction.paid' || status === 'PAID') {
      console.log('[blackcat-webhook] Pagamento confirmado:', paymentId);

      const { data, error } = await supabase
        .from('pedidos')
        .update({ status_pagamento: 'confirmado' })
        .eq('payment_id', String(paymentId))
        .select('id, numero_pedido')
        .maybeSingle();

      if (error) {
        console.error('[blackcat-webhook] Erro ao atualizar pedido:', error);
      } else if (data) {
        console.log('[blackcat-webhook] Pedido atualizado:', data.numero_pedido);
      } else {
        console.log('[blackcat-webhook] Pedido não encontrado para payment_id:', paymentId);
      }
    } else {
      console.log('[blackcat-webhook] Status não é pago:', status, 'Event:', event);
    }

    return new Response(JSON.stringify({ success: true }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('[blackcat-webhook] Erro:', errorMessage);
    
    return new Response(JSON.stringify({ success: false, error: errorMessage }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
