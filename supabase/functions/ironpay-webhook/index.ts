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
    console.log('[ironpay-webhook] Payload recebido:', JSON.stringify(body));

    const transactionHash = body.transaction_hash || body.hash;
    const status = body.status;

    if (!transactionHash) {
      console.error('[ironpay-webhook] transaction_hash não encontrado');
      return new Response(
        JSON.stringify({ error: 'transaction_hash não encontrado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[ironpay-webhook] Transaction: ${transactionHash}, Status: ${status}`);

    // Se o status for "paid" ou "approved", marcar como confirmado
    if (status === 'paid' || status === 'approved') {
      const { data: pedido, error: findError } = await supabase
        .from('pedidos')
        .select('id, status_pagamento')
        .eq('payment_id', transactionHash)
        .maybeSingle();

      if (findError) {
        console.error('[ironpay-webhook] Erro ao buscar pedido:', findError);
      }

      if (pedido && pedido.status_pagamento !== 'confirmado') {
        const { error: updateError } = await supabase
          .from('pedidos')
          .update({ status_pagamento: 'confirmado' })
          .eq('id', pedido.id);

        if (updateError) {
          console.error('[ironpay-webhook] Erro ao atualizar pedido:', updateError);
        } else {
          console.log(`[ironpay-webhook] Pedido ${pedido.id} marcado como confirmado`);
        }
      } else if (!pedido) {
        console.warn(`[ironpay-webhook] Pedido não encontrado para payment_id: ${transactionHash}`);
      }
    }

    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('[ironpay-webhook] Erro:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
