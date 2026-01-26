import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const UMBRELLAPAG_BASE_URL = 'https://api-gateway.umbrellapag.com/api';

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { paymentId } = await req.json();
    
    if (!paymentId) {
      console.error('[check-umbrellapag-status] paymentId não fornecido');
      return new Response(
        JSON.stringify({ success: false, error: 'paymentId é obrigatório', status: 'pending' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[check-umbrellapag-status] Verificando status para:', paymentId);

    const UMBRELLAPAG_API_KEY = Deno.env.get('UMBRELLAPAG_API_KEY');
    
    if (!UMBRELLAPAG_API_KEY) {
      console.error('[check-umbrellapag-status] UMBRELLAPAG_API_KEY não configurada');
      return new Response(
        JSON.stringify({ success: false, error: 'Configuração inválida', status: 'pending' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Consultar status da transação
    const response = await fetch(`${UMBRELLAPAG_BASE_URL}/user/transactions/${paymentId}`, {
      method: 'GET',
      headers: {
        'x-api-key': UMBRELLAPAG_API_KEY,
        'User-Agent': 'UMBRELLAB2B/1.0',
      },
    });

    const responseText = await response.text();
    console.log('[check-umbrellapag-status] Resposta:', responseText);

    if (!response.ok) {
      console.error('[check-umbrellapag-status] Erro na API:', response.status);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Erro API: ${response.status}`,
          status: 'pending' 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = JSON.parse(responseText);
    const rawStatus = data.data?.status || 'PENDING';
    
    // Normalizar status: PAID, REFUSED, PENDING, etc.
    let normalizedStatus = 'pending';
    if (rawStatus === 'PAID' || rawStatus === 'COMPLETED') {
      normalizedStatus = 'paid';
    } else if (rawStatus === 'REFUSED' || rawStatus === 'CANCELED' || rawStatus === 'EXPIRED') {
      normalizedStatus = 'expired';
    }

    console.log('[check-umbrellapag-status] Status normalizado:', normalizedStatus);

    // Persistir no banco quando for pago
    if (normalizedStatus === 'paid') {
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const { data: updated, error: updateError } = await supabase
          .from('pedidos')
          .update({ status_pagamento: 'confirmado' })
          .eq('payment_id', String(paymentId))
          .select('id')
          .limit(1)
          .maybeSingle();

        if (updateError) {
          console.error('[check-umbrellapag-status] Falha ao marcar pedido como confirmado:', updateError);
        } else if (updated?.id) {
          console.log('[check-umbrellapag-status] Pedido marcado como confirmado:', updated.id);
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error('[check-umbrellapag-status] Erro ao persistir status pago:', msg);
      }
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        status: normalizedStatus,
        rawStatus: rawStatus,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('[check-umbrellapag-status] Erro:', errorMessage);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage,
        status: 'pending'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
