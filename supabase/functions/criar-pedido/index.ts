import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PedidoItem {
  produto_nome: string;
  produto_preco: number;
  adicionais: Record<string, number>;
  total_adicionais: number;
  total_item: number;
  observacoes: string;
}

interface PedidoData {
  numero_pedido: string;
  cliente_nome: string;
  cliente_telefone: string;
  cliente_cpf: string;
  endereco_completo: string;
  bairro: string;
  cidade: string;
  cep: string;
  tipo_entrega: string;
  forma_pagamento: string;
  status_pagamento: string;
  status_pedido: string;
  subtotal: number;
  desconto_pix: number;
  total: number;
  payment_id: string | null;
  pix_copia_e_cola: string | null;
  pix_expires_at: string | null;
  observacoes: string | null;
  itens: PedidoItem[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const body = await req.json() as PedidoData

    // Validação básica
    if (!body.cliente_nome || body.cliente_nome.trim().length < 2) {
      return new Response(
        JSON.stringify({ success: false, error: 'Nome do cliente inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!body.cliente_telefone || body.cliente_telefone.replace(/\D/g, '').length < 10) {
      return new Response(
        JSON.stringify({ success: false, error: 'Telefone inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!body.total || body.total <= 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Total inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('[criar-pedido] Criando pedido:', body.numero_pedido)

    // Inserir pedido
    const { data: pedido, error: pedidoError } = await supabase
      .from('pedidos')
      .insert({
        numero_pedido: body.numero_pedido,
        cliente_nome: body.cliente_nome.trim(),
        cliente_telefone: body.cliente_telefone.replace(/\D/g, ''),
        cliente_cpf: body.cliente_cpf?.replace(/\D/g, '') || null,
        endereco_completo: body.endereco_completo || null,
        bairro: body.bairro || null,
        cidade: body.cidade || null,
        cep: body.cep?.replace(/\D/g, '') || null,
        tipo_entrega: body.tipo_entrega,
        forma_pagamento: body.forma_pagamento,
        status_pagamento: body.status_pagamento || 'pendente',
        status_pedido: body.status_pedido || 'pendente',
        subtotal: body.subtotal,
        desconto_pix: body.desconto_pix || 0,
        total: body.total,
        payment_id: body.payment_id || null,
        pix_copia_e_cola: body.pix_copia_e_cola || null,
        pix_expires_at: body.pix_expires_at || null,
        observacoes: body.observacoes || null,
      })
      .select()
      .single()

    if (pedidoError) {
      console.error('[criar-pedido] Erro ao inserir pedido:', pedidoError)
      throw new Error(pedidoError.message)
    }

    console.log('[criar-pedido] Pedido criado:', pedido.id)

    // Inserir itens do pedido
    if (body.itens && body.itens.length > 0) {
      const itensParaInserir = body.itens.map(item => ({
        pedido_id: pedido.id,
        produto_nome: item.produto_nome,
        produto_preco: item.produto_preco,
        adicionais: item.adicionais || {},
        total_adicionais: item.total_adicionais || 0,
        total_item: item.total_item,
        observacoes: item.observacoes || null,
      }))

      const { error: itensError } = await supabase
        .from('pedido_itens')
        .insert(itensParaInserir)

      if (itensError) {
        console.error('[criar-pedido] Erro ao inserir itens:', itensError)
        // Não falhar o pedido por causa dos itens
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        pedido: {
          id: pedido.id,
          numero_pedido: pedido.numero_pedido,
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('[criar-pedido] Erro:', errorMessage)
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
