import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Gateway URLs
const UMBRELLAPAG_BASE_URL = 'https://api-gateway.umbrellapag.com/api';
const EVOPAY_URL = 'https://pix.evopay.cash/v1/pix';
const BLACKCAT_URL = 'https://api.blackcatoficial.com/api';
const IRONPAY_URL = 'https://api.ironpayapp.com.br/api/public/v1';

async function checkIronPayStatus(paymentId: string, regiao?: string): Promise<{ status: string; rawStatus: string }> {
  const regionKey = (regiao || 'br').toLowerCase() === 'es' ? 'ES' : 'BR';
  const apiKey =
    Deno.env.get(`IRONPAY_API_KEY_${regionKey}`) || Deno.env.get('IRONPAY_API_KEY');
  if (!apiKey) throw new Error(`IRONPAY_API_KEY_${regionKey} não configurada`);

  const resp = await fetch(`${IRONPAY_URL}/transactions/${paymentId}?api_token=${apiKey}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });
  const text = await resp.text();
  if (!resp.ok) throw new Error(`IronPay ${resp.status}: ${text}`);
  const data = JSON.parse(text);
  const rawStatus = String(data.status || data.data?.status || 'pending').toLowerCase();

  let normalizedStatus = 'pending';
  if (['paid', 'approved', 'authorized', 'captured'].includes(rawStatus)) {
    normalizedStatus = 'paid';
  } else if (['refused', 'declined', 'cancelled', 'canceled', 'chargeback', 'refunded', 'expired', 'failed'].includes(rawStatus)) {
    normalizedStatus = 'expired';
  }
  return { status: normalizedStatus, rawStatus };
}


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
    const { paymentId, gateway: gatewayOverride, regiao } = await req.json();
    
    if (!paymentId) {
      return new Response(
        JSON.stringify({ success: false, error: 'paymentId é obrigatório', status: 'pending' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[check-payment-status] Verificando status para:', paymentId, 'gateway override:', gatewayOverride);

    const supabaseAdmin = getAdminClient();

    let gateway = gatewayOverride as string | undefined;
    if (!gateway) {
      const { data: config } = await supabaseAdmin
        .from('configuracoes')
        .select('gateway_pix')
        .eq('id', 'global')
        .maybeSingle();
      gateway = config?.gateway_pix || 'umbrellapag';
    }
    console.log('[check-payment-status] Gateway ativo:', gateway);

    // Verificação prévia no banco: se o admin já aprovou ou o pagamento já foi confirmado, retornar como pago
    try {
      const { data: pedidoDb } = await supabaseAdmin
        .from('pedidos')
        .select('status_pagamento, status_pedido')
        .eq('payment_id', String(paymentId))
        .limit(1)
        .maybeSingle();

      if (pedidoDb && (pedidoDb.status_pagamento === 'confirmado' || pedidoDb.status_pedido === 'aprovado')) {
        console.log('[check-payment-status] Pedido já aprovado/confirmado no banco');
        return new Response(
          JSON.stringify({ success: true, status: 'paid', rawStatus: 'ADMIN_APPROVED', gateway }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } catch (e) {
      console.error('[check-payment-status] Erro consulta prévia:', e);
    }

    let result: { status: string; rawStatus: string };
    
    try {
      if (gateway === 'ironpay') {
        result = await checkIronPayStatus(paymentId, regiao);
      } else if (gateway === 'evopay') {
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
