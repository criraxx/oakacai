import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// EvoPay API
const EVOPAY_URL = 'https://pix.evopay.cash/v1/pix';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { valor, descricao, nome, telefone, cpf, itens } = await req.json();

    const EVOPAY_API_KEY = Deno.env.get('EVOPAY_API_KEY');
    
    if (!EVOPAY_API_KEY) {
      console.error('[EvoPay] EVOPAY_API_KEY não configurada');
      return new Response(
        JSON.stringify({ success: false, error: 'Chave API não configurada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[EvoPay] Creating PIX payment:', {
      valor,
      descricao,
      nome,
      telefone,
      cpf: cpf ? '***' : undefined,
      itensCount: itens?.length || 0
    });

    // Limpar CPF (apenas números)
    const cleanCpf = cpf?.replace(/\D/g, '') || '';

    // Sanitizar nome - remover acentos e caracteres especiais (EvoPay só aceita A-Z e espaços)
    const sanitizeName = (name: string): string => {
      return name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .replace(/[^a-zA-Z\s]/g, '') // Remove caracteres especiais
        .replace(/\s+/g, ' ') // Normaliza espaços
        .trim() || 'Cliente';
    };
    const cleanName = sanitizeName(nome || 'Cliente');
    // Gerar email temporário
    const randomId = Math.floor(Math.random() * 999999);
    const tempEmail = `cliente${randomId}@moraiaacai.com.br`;

    // Payload para EvoPay API - valor em float (reais)
    const payload = {
      amount: valor,
      callbackUrl: 'https://oplvbpntmrxwrfhrkmld.supabase.co/functions/v1/primecash-webhook',
      payerName: cleanName,
      payerDocument: cleanCpf,
      payerEmail: tempEmail
    };

    console.log('[EvoPay] Request payload:', JSON.stringify(payload));

    const response = await fetch(EVOPAY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'API-Key': EVOPAY_API_KEY,
      },
      body: JSON.stringify(payload),
    });

    console.log('[EvoPay] Response status:', response.status);
    
    const responseText = await response.text();
    console.log('[EvoPay] Raw response:', responseText);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      console.error('[EvoPay] Failed to parse response:', responseText);
      return new Response(
        JSON.stringify({ success: false, error: 'Resposta inválida do gateway' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[EvoPay] Parsed response:', data);

    // Verificar se houve erro na resposta
    if (!response.ok || data.error) {
      console.error('[EvoPay] Error:', data);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: data.message || data.error || 'Erro ao criar pagamento PIX' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extrair código PIX da resposta EvoPay
    // Resposta esperada: { id, status, amount, qrCodeText, qrCodeBase64, qrCodeUrl }
    const pixCode = data.qrCodeText;
    const paymentId = data.id;

    if (pixCode && paymentId) {
      const pixResponse = {
        success: true,
        paymentId: String(paymentId),
        pixCopiaECola: pixCode,
        qrCodeBase64: data.qrCodeBase64,
        qrCodeUrl: data.qrCodeUrl,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        status: 'pending',
      };

      console.log('[EvoPay] Payment created successfully:', pixResponse);

      return new Response(
        JSON.stringify(pixResponse),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      console.error('[EvoPay] PIX code not found in response. Full response:', data);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Código PIX não encontrado na resposta',
          debug: data
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('[EvoPay] Error creating payment:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro interno do servidor' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
