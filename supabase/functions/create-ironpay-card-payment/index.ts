// Redeploy trigger: 2026-07-25T16:00Z (EUR->BRL conversion added)
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const IRONPAY_URL = 'https://api.ironpayapp.com.br/api/public/v1';
const TAXA_EUR_BRL_FALLBACK = 6.35;

// Busca cotação EUR->BRL em tempo real. Em caso de falha, usa fallback.
const fetchEurBrlRate = async (): Promise<number> => {
  try {
    const resp = await fetch('https://api.exchangerate-api.com/v4/latest/EUR');
    if (!resp.ok) throw new Error(`API cotação ${resp.status}`);
    const data = await resp.json();
    const rate = Number(data?.rates?.BRL);
    if (!rate || rate <= 0) throw new Error('taxa BRL inválida');
    console.log('[create-ironpay-card] cotação EUR->BRL:', rate);
    return rate;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log('[create-ironpay-card] fallback taxa EUR->BRL:', TAXA_EUR_BRL_FALLBACK, msg);
    return TAXA_EUR_BRL_FALLBACK;
  }
};

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
      regiao,
    } = await req.json();

    // Seleciona credenciais por região (BR ou ES). Fallback pros nomes antigos.
    const regionKey = (regiao || 'br').toString().toLowerCase() === 'es' ? 'ES' : 'BR';
    const IRONPAY_API_KEY =
      Deno.env.get(`IRONPAY_API_KEY_${regionKey}`) ||
      Deno.env.get('IRONPAY_API_KEY');
    const OFFER_HASH =
      Deno.env.get(`IRONPAY_OFFER_HASH_${regionKey}`) ||
      Deno.env.get('IRONPAY_OFFER_HASH') ||
      (regionKey === 'ES' ? 'lgcxrse19i' : 'megjvpfvcn');
    const PRODUCT_HASH =
      Deno.env.get(`IRONPAY_PRODUCT_HASH_${regionKey}`) ||
      Deno.env.get('IRONPAY_PRODUCT_HASH') ||
      OFFER_HASH;

    if (!IRONPAY_API_KEY) throw new Error(`IRONPAY_API_KEY_${regionKey} não configurada`);
    const _keyPrefix = IRONPAY_API_KEY.slice(0, 8);
    const _keyLen = IRONPAY_API_KEY.length;
    console.log('[create-ironpay-card] region:', regionKey, 'key_prefix:', _keyPrefix, 'key_len:', _keyLen, 'offer_hash:', OFFER_HASH);
    if (!card_token) throw new Error('card_token é obrigatório');
    if (!valor || valor <= 0) throw new Error('valor inválido');

    // IronPay espera amount em centavos de BRL. A loja ES vende em EUR, então converte.
    let valorParaIronPay = Number(valor);
    if (regionKey === 'ES') {
      const rate = await fetchEurBrlRate();
      valorParaIronPay = valorParaIronPay * rate;
    }
    const valorCentavos = Math.round(valorParaIronPay * 100);
    console.log('[create-ironpay-card] valor original:', valor, 'região:', regionKey, 'valor BRL para IronPay:', valorParaIronPay, 'centavos:', valorCentavos);

    const webhookUrl = `${supabaseUrl}/functions/v1/ironpay-webhook`;

    const payload = {
      api_token: IRONPAY_API_KEY,
      amount: valorCentavos,
      offer_hash: OFFER_HASH,
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
          product_hash: PRODUCT_HASH,
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
      let parsed: any = null;
      try { parsed = JSON.parse(responseText); } catch (_) {}

      // Registra o motivo da recusa no pedido para aparecer no admin
      const motivoBruto =
        parsed?.message ||
        parsed?.error ||
        parsed?.errors?.[0]?.message ||
        (typeof parsed?.errors === 'object' ? JSON.stringify(parsed.errors) : null) ||
        responseText?.slice(0, 300) ||
        'Recusado sem detalhe';
      const traduzir = (m: string): string => {
        const t = m.toLowerCase();
        if (t.includes('insufficient') || t.includes('saldo') || t.includes('funds')) return 'Cartão sem saldo / limite insuficiente';
        if (t.includes('expired')) return 'Cartão expirado';
        if (t.includes('cvv') || t.includes('cvc') || t.includes('security code')) return 'CVV inválido';
        if (t.includes('do not honor') || t.includes('declined') || t.includes('recusad')) return 'Recusado pelo emissor do cartão';
        if (t.includes('token')) return 'Token do cartão inválido/expirado (problema de integração)';
        if (t.includes('unauthorized') || t.includes('hash') || t.includes('api_token')) return 'Erro de credenciais/hash (problema de integração)';
        if (t.includes('fraud') || t.includes('risk')) return 'Bloqueado por antifraude';
        return m;
      };
      const motivo = `[${new Date().toISOString()}] Recusado (IronPay ${response.status}): ${traduzir(String(motivoBruto))} | detalhe: ${String(motivoBruto).slice(0, 200)}`;
      console.log('[create-ironpay-card] motivo recusa:', motivo);

      if (pedidoId) {
        try {
          await supabase
            .from('pedidos')
            .update({ observacoes: motivo, status_pagamento: 'recusado' })
            .eq('id', pedidoId);
        } catch (e) {
          console.error('[create-ironpay-card] falha ao gravar motivo:', e);
        }
      }

      return new Response(
        JSON.stringify({ success: false, status: response.status, error: `IronPay ${response.status}`, ironpay: parsed ?? responseText, debug: { region: regionKey, key_prefix: _keyPrefix, key_len: _keyLen, offer_hash: OFFER_HASH }, payload_sent: { ...payload, api_token: '***' } }),
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
