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
const BRGATEWAY_URL = 'https://api.brgateway.com.br/api/public/v1';

interface CreatePixRequest {
  valor: number;
  descricao: string;
  nome: string;
  telefone: string;
  cpf: string;
  email?: string;
  pedidoId?: string;
}

// Função para sanitizar nome (EvoPay só aceita A-Z e espaços)
const sanitizeName = (name: string): string => {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim() || 'Cliente';
};

// Gera um CPF válido aleatoriamente (para gateways que exigem CPF)
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

const ensureCPF = (cpf: string): string => {
  const clean = (cpf || '').replace(/\D/g, '');
  return clean.length === 11 ? clean : generateValidCPF();
};

// Criar PIX via UmbrellaPag
// deno-lint-ignore no-explicit-any
async function createUmbrellaPagPix(body: CreatePixRequest, supabase: any, supabaseUrl: string) {
  const UMBRELLAPAG_API_KEY = Deno.env.get('UMBRELLAPAG_API_KEY');
  
  if (!UMBRELLAPAG_API_KEY) {
    throw new Error('UMBRELLAPAG_API_KEY não configurada');
  }

  const { valor, descricao, nome, telefone, cpf, email, pedidoId } = body;
  const valorCentavos = Math.round(valor * 100);

  const webhookUrl = `${supabaseUrl}/functions/v1/umbrellapag-webhook`;

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
          title: 'Acesso Liberado',
          unitPrice: valorCentavos,
          quantity: 1,
          tangible: false,
          externalRef: pedidoId || `pedido-${Date.now()}`,
        },
      ],
      pix: {
        expiresInDays: 1,
      },
      postbackUrl: webhookUrl,
      metadata: JSON.stringify({ pedidoId }),
      traceable: true,
    }),
  });

  const transactionText = await transactionResponse.text();
  console.log('[create-pix-payment] UmbrellaPag response:', transactionText);

  if (!transactionResponse.ok) {
    throw new Error(`Erro UmbrellaPag: ${transactionResponse.status} - ${transactionText}`);
  }

  const transactionData = JSON.parse(transactionText);
  const transactionId = transactionData.data?.id || transactionData.id;
  const pixCopiaECola = transactionData.data?.pix?.qrcode || 
                        transactionData.data?.qrCode ||
                        transactionData.data?.pix?.qrCode;
  const expiresAt = transactionData.data?.pix?.expirationDate || 
                    transactionData.data?.expiresAt || 
                    new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  if (!pixCopiaECola) {
    throw new Error('QR Code PIX não retornado pela API UmbrellaPag');
  }

  // Atualizar pedido com payment_id
  if (pedidoId) {
    await supabase
      .from('pedidos')
      .update({ payment_id: transactionId, forma_pagamento: 'pix' })
      .eq('id', pedidoId);
  }

  return {
    success: true,
    paymentId: transactionId,
    pixCopiaECola,
    expiresAt,
    gateway: 'umbrellapag',
  };
}

// Criar PIX via EvoPay
// deno-lint-ignore no-explicit-any
async function createEvoPayPix(body: CreatePixRequest, supabase: any) {
  const EVOPAY_API_KEY = Deno.env.get('EVOPAY_API_KEY');
  
  if (!EVOPAY_API_KEY) {
    throw new Error('EVOPAY_API_KEY não configurada');
  }

  const { valor, nome, cpf, pedidoId } = body;
  const cleanName = sanitizeName(nome);
  const cleanCpf = cpf?.replace(/\D/g, '') || '';
  const randomId = Math.floor(Math.random() * 999999);
  const tempEmail = `cliente${randomId}@moraiaacai.com.br`;

  const response = await fetch(EVOPAY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'API-Key': EVOPAY_API_KEY,
    },
    body: JSON.stringify({
      amount: valor,
      callbackUrl: `${Deno.env.get('SUPABASE_URL')}/functions/v1/evopay-webhook`,
      payerName: cleanName,
      payerDocument: cleanCpf,
      payerEmail: tempEmail,
    }),
  });

  const responseText = await response.text();
  console.log('[create-pix-payment] EvoPay response:', responseText);

  if (!response.ok) {
    throw new Error(`Erro EvoPay: ${response.status} - ${responseText}`);
  }

  const data = JSON.parse(responseText);
  const pixCode = data.qrCodeText;
  const paymentId = data.id;

  if (!pixCode || !paymentId) {
    throw new Error('Código PIX não encontrado na resposta EvoPay');
  }

  // Atualizar pedido com payment_id
  if (pedidoId) {
    await supabase
      .from('pedidos')
      .update({ payment_id: String(paymentId), forma_pagamento: 'pix' })
      .eq('id', pedidoId);
  }

  return {
    success: true,
    paymentId: String(paymentId),
    pixCopiaECola: pixCode,
    qrCodeBase64: data.qrCodeBase64,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    gateway: 'evopay',
  };
}

// Descrição fixa para BlackCat
const BLACKCAT_PRODUCT_NAME = 'Acesso Liberado';

// Criar PIX via BlackCat
// deno-lint-ignore no-explicit-any
async function createBlackCatPix(body: CreatePixRequest, supabase: any, supabaseUrl: string) {
  const BLACKCAT_API_KEY = Deno.env.get('BLACKCAT_API_KEY');
  
  if (!BLACKCAT_API_KEY) {
    throw new Error('BLACKCAT_API_KEY não configurada');
  }

  const { valor, descricao, nome, telefone, cpf, email, pedidoId } = body;
  const valorCentavos = Math.round(valor * 100);
  const webhookUrl = `${supabaseUrl}/functions/v1/blackcat-webhook`;

  // Usar nome fake de produto para BlackCat
  const fakeProductName = BLACKCAT_PRODUCT_NAME;

  const response = await fetch(`${BLACKCAT_URL}/sales/create-sale`, {
    method: 'POST',
    headers: {
      'X-API-Key': BLACKCAT_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: valorCentavos,
      paymentMethod: 'pix',
      items: [
        {
          title: fakeProductName,
          unitPrice: valorCentavos,
          quantity: 1,
          tangible: false,
        },
      ],
      customer: {
        name: nome,
        email: email || `${telefone.replace(/\D/g, '')}@cliente.local`,
        phone: telefone.replace(/\D/g, ''),
        document: {
          number: cpf.replace(/\D/g, ''),
          type: 'CPF',
        },
      },
      postbackUrl: webhookUrl,
      externalReference: pedidoId || `pedido-${Date.now()}`,
    }),
  });

  const responseText = await response.text();
  console.log('[create-pix-payment] BlackCat response:', responseText);

  if (!response.ok) {
    throw new Error(`Erro BlackCat: ${response.status} - ${responseText}`);
  }

  const data = JSON.parse(responseText);
  const transactionId = data.data?.transactionId;
  const pixCopiaECola = data.data?.paymentData?.copyPaste || data.data?.paymentData?.qrCode;
  const expiresAt = data.data?.paymentData?.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  if (!pixCopiaECola) {
    throw new Error('QR Code PIX não retornado pela API BlackCat');
  }

  // Atualizar pedido com payment_id
  if (pedidoId) {
    await supabase
      .from('pedidos')
      .update({ payment_id: transactionId, forma_pagamento: 'pix' })
      .eq('id', pedidoId);
  }

  return {
    success: true,
    paymentId: transactionId,
    pixCopiaECola,
    qrCodeBase64: data.data?.paymentData?.qrCodeBase64,
    expiresAt,
    gateway: 'blackcat',
  };
}

// Criar PIX via IronPay
// deno-lint-ignore no-explicit-any
async function createIronPayPix(body: CreatePixRequest, supabase: any, supabaseUrl: string) {
  const IRONPAY_API_KEY = Deno.env.get('IRONPAY_API_KEY');
  
  if (!IRONPAY_API_KEY) {
    throw new Error('IRONPAY_API_KEY não configurada');
  }

  const { valor, nome, telefone, cpf, email, pedidoId } = body;
  const valorCentavos = Math.round(valor * 100);
  const webhookUrl = `${supabaseUrl}/functions/v1/ironpay-webhook`;

  const response = await fetch(`${IRONPAY_URL}/transactions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      api_token: IRONPAY_API_KEY,
      amount: valorCentavos,
      offer_hash: 'megjvpfvcn',
      payment_method: 'pix',
      postback_url: webhookUrl,
      customer: {
        name: nome,
        email: email || `${telefone.replace(/\D/g, '')}@cliente.local`,
        phone_number: telefone.replace(/\D/g, ''),
        document: ensureCPF(cpf),
      },
      cart: [
        {
          product_hash: 'megjvpfvcn',
          title: 'Pedido Acai',
          price: valorCentavos,
          quantity: 1,
          operation_type: 1,
          tangible: false,
        },
      ],
    }),
  });

  const responseText = await response.text();
  console.log('[create-pix-payment] IronPay response:', responseText);

  if (!response.ok) {
    throw new Error(`Erro IronPay: ${response.status} - ${responseText}`);
  }

  const data = JSON.parse(responseText);
  
  // Extrair dados do PIX da resposta IronPay
  const transactionHash = data.hash || data.transaction_hash || data.id;
  const pixCopiaECola = data.pix?.pix_qr_code || data.pix?.qrcode || data.pix?.qr_code || data.pix?.copy_paste;
  const expiresAt = data.pix?.expires_at || new Date(Date.now() + 30 * 60 * 1000).toISOString();

  if (!pixCopiaECola) {
    console.error('[create-pix-payment] IronPay - QR Code não encontrado:', data);
    throw new Error('QR Code PIX não retornado pela API IronPay');
  }

  // Atualizar pedido com payment_id
  if (pedidoId) {
    await supabase
      .from('pedidos')
      .update({ payment_id: transactionHash, forma_pagamento: 'pix' })
      .eq('id', pedidoId);
  }

  return {
    success: true,
    paymentId: transactionHash,
    pixCopiaECola,
    expiresAt,
    gateway: 'ironpay',
  };
}

// Criar PIX via BRGateway
// deno-lint-ignore no-explicit-any
async function createBRGatewayPix(body: CreatePixRequest, supabase: any, supabaseUrl: string) {
  const BRGATEWAY_API_KEY = Deno.env.get('BRGATEWAY_API_KEY');
  
  if (!BRGATEWAY_API_KEY) {
    throw new Error('BRGATEWAY_API_KEY não configurada');
  }

  const { valor, nome, telefone, cpf, email, pedidoId } = body;
  const valorCentavos = Math.round(valor * 100);
  const webhookUrl = `${supabaseUrl}/functions/v1/brgateway-webhook`;

  const response = await fetch(`${BRGATEWAY_URL}/transactions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      api_token: BRGATEWAY_API_KEY,
      amount: valorCentavos,
      offer_hash: 'qfq2djocl5',
      payment_method: 'pix',
      postback_url: webhookUrl,
      customer: {
        name: nome,
        email: email || `${telefone.replace(/\D/g, '')}@cliente.local`,
        phone_number: telefone.replace(/\D/g, ''),
        document: ensureCPF(cpf),
      },
      cart: [
        {
          product_hash: 'qfq2djocl5',
          title: 'Pedido Acai',
          price: valorCentavos,
          quantity: 1,
          operation_type: 1,
          tangible: false,
        },
      ],
    }),
  });

  const responseText = await response.text();
  console.log('[create-pix-payment] BRGateway response:', responseText);

  if (!response.ok) {
    throw new Error(`Erro BRGateway: ${response.status} - ${responseText}`);
  }

  const data = JSON.parse(responseText);
  
  const transactionHash = data.hash || data.transaction_hash || data.id;
  const pixCopiaECola = data.pix?.pix_qr_code || data.pix?.qrcode || data.pix?.qr_code || data.pix?.copy_paste;
  const expiresAt = data.pix?.expires_at || new Date(Date.now() + 30 * 60 * 1000).toISOString();

  if (!pixCopiaECola) {
    console.error('[create-pix-payment] BRGateway - QR Code não encontrado:', data);
    throw new Error('QR Code PIX não retornado pela API BRGateway');
  }

  if (pedidoId) {
    await supabase
      .from('pedidos')
      .update({ payment_id: transactionHash, forma_pagamento: 'pix' })
      .eq('id', pedidoId);
  }

  return {
    success: true,
    paymentId: transactionHash,
    pixCopiaECola,
    expiresAt,
    gateway: 'brgateway',
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: CreatePixRequest = await req.json();
    console.log('[create-pix-payment] Request:', { ...body, cpf: '***' });

    // Buscar configuração do gateway ativo
    const { data: config, error: configError } = await supabase
      .from('configuracoes')
      .select('gateway_pix')
      .eq('id', 'global')
      .maybeSingle();

    if (configError) {
      console.error('[create-pix-payment] Erro ao buscar config:', configError);
    }

    const gateway = config?.gateway_pix || 'umbrellapag';
    console.log('[create-pix-payment] Gateway ativo:', gateway);

    let result;
    if (gateway === 'evopay') {
      result = await createEvoPayPix(body, supabase);
    } else if (gateway === 'blackcat') {
      result = await createBlackCatPix(body, supabase, supabaseUrl);
    } else if (gateway === 'ironpay') {
      result = await createIronPayPix(body, supabase, supabaseUrl);
    } else if (gateway === 'brgateway') {
      result = await createBRGatewayPix(body, supabase, supabaseUrl);
    } else {
      result = await createUmbrellaPagPix(body, supabase, supabaseUrl);
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('[create-pix-payment] Erro:', errorMessage);
    
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
