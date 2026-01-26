import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Gateway URLs
const UMBRELLAPAG_BASE_URL = 'https://api-gateway.umbrellapag.com/api';
const EVOPAY_URL = 'https://pix.evopay.cash/v1/pix';
const BLACKCAT_URL = 'https://api.blackcatpagamentos.online/api';

const getAdminClient = () => {
  const url = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!url || !serviceKey) {
    throw new Error('Backend não configurado (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)');
  }

  return createClient(url, serviceKey);
};

// Check UmbrellaPag status
async function checkUmbrellaPagStatus(paymentId: string): Promise<{ status: string; rawStatus: string }> {
  const UMBRELLAPAG_API_KEY = Deno.env.get('UMBRELLAPAG_API_KEY');
  
  if (!UMBRELLAPAG_API_KEY) {
    throw new Error('UMBRELLAPAG_API_KEY não configurada');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  const response = await fetch(`${UMBRELLAPAG_BASE_URL}/user/transactions/${paymentId}`, {
    method: 'GET',
    headers: {
      'x-api-key': UMBRELLAPAG_API_KEY,
      'User-Agent': 'UMBRELLAB2B/1.0',
    },
    signal: controller.signal,
  });

  clearTimeout(timeoutId);

  if (!response.ok) {
    throw new Error(`Erro API UmbrellaPag: ${response.status}`);
  }

  const data = await response.json();
  const rawStatus = data.data?.status || 'PENDING';
  
  let normalizedStatus = 'pending';
  if (rawStatus === 'PAID' || rawStatus === 'COMPLETED') {
    normalizedStatus = 'paid';
  } else if (rawStatus === 'REFUSED' || rawStatus === 'CANCELED' || rawStatus === 'EXPIRED') {
    normalizedStatus = 'expired';
  }

  return { status: normalizedStatus, rawStatus };
}

// Check EvoPay status
async function checkEvoPayStatus(paymentId: string): Promise<{ status: string; rawStatus: string }> {
  const EVOPAY_API_KEY = Deno.env.get('EVOPAY_API_KEY');
  
  if (!EVOPAY_API_KEY) {
    throw new Error('EVOPAY_API_KEY não configurada');
  }

  const response = await fetch(`${EVOPAY_URL}/${paymentId}`, {
    method: 'GET',
    headers: {
      'API-Key': EVOPAY_API_KEY,
    },
  });

  if (!response.ok) {
    throw new Error(`Erro API EvoPay: ${response.status}`);
  }

  const data = await response.json();
  const rawStatus = data.status || 'PENDING';
  
  let normalizedStatus = 'pending';
  if (rawStatus === 'PAID' || rawStatus === 'COMPLETED' || rawStatus === 'approved') {
    normalizedStatus = 'paid';
  } else if (rawStatus === 'REFUSED' || rawStatus === 'CANCELED' || rawStatus === 'EXPIRED' || rawStatus === 'expired') {
    normalizedStatus = 'expired';
  }

  return { status: normalizedStatus, rawStatus };
}

// Check BlackCat status
async function checkBlackCatStatus(paymentId: string): Promise<{ status: string; rawStatus: string }> {
  const BLACKCAT_API_KEY = Deno.env.get('BLACKCAT_API_KEY');
  
  if (!BLACKCAT_API_KEY) {
    throw new Error('BLACKCAT_API_KEY não configurada');
  }

  const response = await fetch(`${BLACKCAT_URL}/sales/${paymentId}/status`, {
    method: 'GET',
    headers: {
      'X-API-Key': BLACKCAT_API_KEY,
    },
  });

  if (!response.ok) {
    throw new Error(`Erro API BlackCat: ${response.status}`);
  }

  const data = await response.json();
  const rawStatus = data.data?.status || data.status || 'PENDING';
  
  let normalizedStatus = 'pending';
  if (rawStatus === 'PAID') {
    normalizedStatus = 'paid';
  } else if (rawStatus === 'CANCELLED' || rawStatus === 'REFUNDED') {
    normalizedStatus = 'expired';
  }

  return { status: normalizedStatus, rawStatus };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { paymentId } = await req.json();
    
    if (!paymentId) {
      return new Response(
        JSON.stringify({ success: false, error: 'paymentId é obrigatório', status: 'pending' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[check-payment-status] Verificando status para:', paymentId);

    const supabaseAdmin = getAdminClient();

    // Buscar configuração do gateway ativo
    const { data: config } = await supabaseAdmin
      .from('configuracoes')
      .select('gateway_pix')
      .eq('id', 'global')
      .maybeSingle();

    const gateway = config?.gateway_pix || 'umbrellapag';
    console.log('[check-payment-status] Gateway ativo:', gateway);

    let result: { status: string; rawStatus: string };
    
    try {
      if (gateway === 'evopay') {
        result = await checkEvoPayStatus(paymentId);
      } else if (gateway === 'blackcat') {
        result = await checkBlackCatStatus(paymentId);
      } else {
        result = await checkUmbrellaPagStatus(paymentId);
      }
    } catch (apiError) {
      console.error('[check-payment-status] Erro na API:', apiError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: apiError instanceof Error ? apiError.message : 'Erro API',
          status: 'pending' 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[check-payment-status] Status:', result);

    // Persistir no banco quando for pago
    if (result.status === 'paid') {
      try {
        const { data: updated, error: updateError } = await supabaseAdmin
          .from('pedidos')
          .update({ status_pagamento: 'confirmado' })
          .eq('payment_id', String(paymentId))
          .select('id')
          .limit(1)
          .maybeSingle();

        if (updateError) {
          console.error('[check-payment-status] Falha ao marcar pedido:', updateError);
        } else if (updated?.id) {
          console.log('[check-payment-status] Pedido confirmado:', updated.id);
        }
      } catch (e: unknown) {
        console.error('[check-payment-status] Erro ao persistir:', e);
      }
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        status: result.status,
        rawStatus: result.rawStatus,
        gateway,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('[check-payment-status] Erro:', errorMessage);
    
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
