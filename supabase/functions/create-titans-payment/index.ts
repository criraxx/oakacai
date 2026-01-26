import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TITANS_URL = 'https://api.titanshub.io/v1/transactions';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const publicKey = Deno.env.get('TITANS_PUBLIC_KEY');
    const secretKey = Deno.env.get('TITANS_SECRET_KEY');
    
    if (!publicKey || !secretKey) {
      console.error('TITANS_PUBLIC_KEY or TITANS_SECRET_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Chaves da API não configuradas' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { valor, descricao, nome, telefone, email, cpf, itens } = await req.json();

    console.log('Creating Titans Hub payment:', {
      valor,
      descricao,
      nome,
      telefone,
      email,
      cpf: cpf ? '***' : undefined,
      itensCount: itens?.length || 0
    });

    // Converter valor para centavos
    const amountInCents = Math.round(valor * 100);
    const randomId = Math.floor(Math.random() * 999999);

    // Limpar telefone (apenas números)
    const cleanPhone = telefone?.replace(/\D/g, '') || '';

    // Montar payload no formato correto da Titans Hub
    const payload = {
      amount: amountInCents,
      paymentMethod: 'pix',
      items: itens?.map((item: { nome: string; quantidade: number; valor: number }, index: number) => ({
        title: item.nome,
        quantity: item.quantidade || 1,
        tangible: false,
        unitPrice: Math.round(item.valor * 100),
        externalRef: `ACAI-${randomId}-${index}`
      })) || [{
        title: descricao || "Pedido Açaí",
        quantity: 1,
        tangible: false,
        unitPrice: amountInCents,
        externalRef: `ACAI-${randomId}`
      }],
      customer: {
        name: nome || "Cliente",
        email: email || `cliente${randomId}@temp.com`,
        document: { 
          type: "cpf", 
          number: cpf?.replace(/\D/g, '') || "00000000000"
        },
        phone: cleanPhone
      }
    };

    console.log('Titans Hub request payload:', JSON.stringify(payload));

    // Create Basic Auth Header
    const auth = 'Basic ' + btoa(publicKey + ':' + secretKey);

    const response = await fetch(TITANS_URL, {
      method: 'POST',
      headers: {
        'Authorization': auth,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    console.log('Titans Hub response status:', response.status);
    
    const responseText = await response.text();
    console.log('Titans Hub raw response:', responseText);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      console.error('Failed to parse response:', responseText);
      return new Response(
        JSON.stringify({ success: false, error: 'Resposta inválida do gateway' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Titans Hub parsed response:', data);

    if (!response.ok) {
      console.error('Titans Hub error:', data);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: data.message || data.error || 'Erro ao criar pagamento PIX' 
        }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extrair dados do PIX da resposta - múltiplos caminhos possíveis
    let pixCode = null;
    let secureUrl = null;
    let paymentId = null;

    // Caminho 1: Documentação Padrão (data.pix.qrcode)
    if (data?.data?.pix?.qrcode) {
      pixCode = data.data.pix.qrcode;
      secureUrl = data.data.secureUrl;
      paymentId = data.data.id || data.data.transactionId;
    } 
    // Caminho 2: Resposta Direta (pix.qrcode)
    else if (data?.pix?.qrcode) {
      pixCode = data.pix.qrcode;
      secureUrl = data.secureUrl;
      paymentId = data.id || data.transactionId;
    }
    // Caminho 3: Variação de nome 'qr_code'
    else if (data?.data?.pix?.qr_code) {
      pixCode = data.data.pix.qr_code;
      secureUrl = data.data.secureUrl || data.data.secure_url;
      paymentId = data.data.id || data.data.transaction_id;
    }
    // Caminho 4: Resposta direta com qr_code
    else if (data?.pix?.qr_code) {
      pixCode = data.pix.qr_code;
      secureUrl = data.secureUrl || data.secure_url;
      paymentId = data.id || data.transaction_id;
    }

    if (pixCode) {
      const pixResponse = {
        success: true,
        paymentId: paymentId || `titans-${randomId}`,
        pixCopiaECola: pixCode,
        secureUrl: secureUrl,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        status: 'pending',
      };

      console.log('Payment created successfully:', pixResponse);

      return new Response(
        JSON.stringify(pixResponse),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      console.error('QR Code not found in response. Debug:', data);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'QR Code não encontrado na resposta da operadora de pagamento' 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Error creating Titans Hub payment:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro interno do servidor' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
