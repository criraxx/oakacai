import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const UMBRELLAPAG_BASE_URL = 'https://api-gateway.umbrellapag.com/api';

interface CreatePixRequest {
  valor: number;
  descricao: string;
  nome: string;
  telefone: string;
  cpf: string;
  email: string;
  pedidoId?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const UMBRELLAPAG_API_KEY = Deno.env.get('UMBRELLAPAG_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!UMBRELLAPAG_API_KEY) {
      console.error('[create-umbrellapag-pix] UMBRELLAPAG_API_KEY não configurada');
      return new Response(
        JSON.stringify({ success: false, error: 'API Key não configurada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: CreatePixRequest = await req.json();
    const { valor, descricao, nome, telefone, cpf, email, pedidoId } = body;

    console.log('[create-umbrellapag-pix] Criando pagamento PIX:', { valor, descricao, nome });

    // Converter valor para centavos
    const valorCentavos = Math.round(valor * 100);

    // Criar transação direta via /api/user/transactions
    console.log('[create-umbrellapag-pix] Criando transação PIX direta...');
    
    const transactionResponse = await fetch(`${UMBRELLAPAG_BASE_URL}/user/transactions`, {
      method: 'POST',
      headers: {
        'x-api-key': UMBRELLAPAG_API_KEY,
        'User-Agent': 'AtivoB2B/1.0',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: valorCentavos,
        currency: 'BRL',
        paymentMethod: 'pix',
        installments: 1,
        customer: {
          name: nome,
          email: email || `${telefone.replace(/\D/g, '')}@cliente.local`,
          document: {
            number: cpf.replace(/\D/g, ''),
            type: 'CPF',
          },
          phone: telefone.replace(/\D/g, ''),
          address: {
            street: 'Rua não informada',
            streetNumber: '0',
            complement: '',
            zipCode: '00000000',
            neighborhood: 'Centro',
            city: 'São Paulo',
            state: 'SP',
            country: 'BR',
          },
        },
        items: [
          {
            title: descricao || 'Pedido Vibe Açaí',
            unitPrice: valorCentavos,
            quantity: 1,
            tangible: false,
            externalRef: pedidoId || `pedido-${Date.now()}`,
          },
        ],
        pix: {
          expiresInDays: 1,
        },
        metadata: JSON.stringify({ pedidoId }),
        traceable: true,
      }),
    });

    const transactionText = await transactionResponse.text();
    console.log('[create-umbrellapag-pix] Resposta transação:', transactionText);

    if (!transactionResponse.ok) {
      throw new Error(`Erro ao criar transação: ${transactionResponse.status} - ${transactionText}`);
    }

    const transactionData = JSON.parse(transactionText);
    
    // Extrair dados do PIX da resposta - baseado na estrutura real da API
    const transactionId = transactionData.data?.id || transactionData.id;
    
    // O QR Code vem em data.pix.qrcode (minúsculo) ou data.qrCode
    const pixCopiaECola = transactionData.data?.pix?.qrcode || 
                          transactionData.data?.qrCode ||
                          transactionData.data?.pix?.qrCode;
    
    // Data de expiração vem em data.pix.expirationDate
    const expiresAt = transactionData.data?.pix?.expirationDate || 
                      transactionData.data?.expiresAt || 
                      new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    console.log('[create-umbrellapag-pix] Transação criada:', { 
      transactionId, 
      pixCopiaECola: pixCopiaECola?.substring(0, 50),
      expiresAt,
      fullResponse: transactionData 
    });

    if (!pixCopiaECola) {
      console.error('[create-umbrellapag-pix] QR Code não encontrado na resposta:', transactionData);
      throw new Error('QR Code PIX não retornado pela API');
    }

    // Atualizar pedido no banco com payment_id
    if (pedidoId) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      const { error: updateError } = await supabase
        .from('pedidos')
        .update({
          payment_id: transactionId,
          forma_pagamento: 'pix',
        })
        .eq('id', pedidoId);

      if (updateError) {
        console.error('[create-umbrellapag-pix] Erro ao atualizar pedido:', updateError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        paymentId: transactionId,
        pixCopiaECola: pixCopiaECola,
        expiresAt: expiresAt,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('[create-umbrellapag-pix] Erro:', errorMessage);
    
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
