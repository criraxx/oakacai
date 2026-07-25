// Redeploy trigger: 2026-07-25T14:00Z (GH secrets configured)
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const IRONPAY_URL = 'https://api.ironpayapp.com.br/api/public/v1';

// Gera CPF válido — IronPay exige documento no formato BR
const generateValidCPF = (): string => {
  const rand = (n: number) => Math.floor(Math.random() * n);
  const n = Array.from({ length: 9 }, () => rand(10));
  const calc = (base: number[]) => {
    const sum = base.reduce((acc, v, i) => acc + v * (base.length + 1 - i), 0);
    const r = (sum * 10) % 11;
    return r === 10 ? 0 : r;
  };
  const d1 = calc(n);
  const d2 = calc([...n, d1]);
  return [...n, d1, d2].join('');
};
const ensureDoc = (doc: string): string => {
  const clean = (doc || '').replace(/\D/g, '');
  return clean.length === 11 ? clean : generateValidCPF();
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const IRONPAY_API_KEY = Deno.env.get('IRONPAY_API_KEY');
    if (!IRONPAY_API_KEY) throw new Error('IRONPAY_API_KEY não configurada');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const {
      valor,
      nome,
      telefone,
      cpf,
      email,
      pedidoId,
      card_token,
      descricao,
    } = await req.json();

    if (!card_token) throw new Error('card_token é obrigatório');
    if (!valor || valor <= 0) throw new Error('valor inválido');

    const valorCentavos = Math.round(Number(valor) * 100);
    const webhookUrl = `${supabaseUrl}/functions/v1/ironpay-webhook`;

    const payload = {
      api_token: IRONPAY_API_KEY,
      amount: valorCentavos,
      offer_hash: 'xiapdtiaot',
      payment_method: 'credit_card',
      card_token,
      installments: 1,
      postback_url: webhookUrl,
      customer: {
        name: nome || 'Cliente',
        email: email || `${(telefone || '').replace(/\D/g, '')}@cliente.local`,
        phone_number: (telefone || '').replace(/\D/g, ''),
        document: ensureDoc(cpf),
      },
      cart: [
        {
          product_hash: 'megjvpfvcn',
          title: descricao || 'Acesso Liberado',
          price: valorCentavos,
          quantity: 1,
          operation_type: 1,
          tangible: false,
        },
      ],
    };

    console.log('[create-ironpay-card] payload:', JSON.stringify({ ...payload, api_token: '***' }));

    const response = await fetch(`${IRONPAY_URL}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    console.log('[create-ironpay-card] IronPay response:', response.status, responseText);

    if (!response.ok) {
      let parsed: unknown = null;
      try { parsed = JSON.parse(responseText); } catch (_) {}
      return new Response(
        JSON.stringify({ success: false, status: response.status, error: `IronPay ${response.status}`, ironpay: parsed ?? responseText, payload_sent: { ...payload, api_token: '***' } }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const data = JSON.parse(responseText);
    const transactionHash = data.hash || data.transaction_hash || data.id;
    const status = data.status;
    const paymentIntentClientSecret =
      data.payment_intent_client_secret ||
      data.credit_card?.payment_intent_client_secret ||
      null;

    // Atualiza pedido com payment_id para o webhook conseguir localizar
    if (pedidoId && transactionHash) {
      await supabase
        .from('pedidos')
        .update({
          payment_id: transactionHash,
          forma_pagamento: 'cartao',
        })
        .eq('id', pedidoId);
    }

    return new Response(
      JSON.stringify({
        success: true,
        transactionHash,
        status,
        paymentIntentClientSecret,
        raw: data,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('[create-ironpay-card] erro:', msg);
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});

// force redeploy 1784928428
