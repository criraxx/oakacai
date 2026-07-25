import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const body = await req.json().catch(() => ({})) as { telefone?: string }
    const { telefone } = body

    const telefoneLimpo = (telefone || '').replace(/\D/g, '')

    if (telefoneLimpo.length < 6) {
      return new Response(
        JSON.stringify({ error: 'Teléfono inválido', pedidos: [] }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Busca pelos últimos 9 dígitos (ignora DDI 34/55 gravado no banco)
    const sufixo = telefoneLimpo.slice(-9)

    // Auto-cancelar pedidos pendentes com mais de 5 horas
    const cincoHorasAtras = new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
    const { error: cancelError } = await supabase
      .from('pedidos')
      .update({ status_pedido: 'cancelado', status_pagamento: 'cancelado' })
      .eq('status_pagamento', 'pendente')
      .neq('status_pedido', 'cancelado')
      .lt('created_at', cincoHorasAtras)
    if (cancelError) {
      console.error('[buscar-pedidos] Erro ao auto-cancelar:', cancelError)
    }

    const { data: pedidos, error: pedidosError } = await supabase
      .from('pedidos')
      .select('id, numero_pedido, cliente_nome, cliente_telefone, cliente_cpf, total, subtotal, desconto_pix, forma_pagamento, tipo_entrega, status_pagamento, status_pedido, endereco_completo, bairro, cidade, created_at, payment_id')
      .ilike('cliente_telefone', `%${telefoneLimpo}%`)
      .order('created_at', { ascending: false })
      .limit(50)

    if (pedidosError) throw pedidosError

    const pedidosComItens = await Promise.all(
      (pedidos || []).map(async (pedido) => {
        const { data: itens } = await supabase
          .from('pedido_itens')
          .select('id, produto_nome, produto_preco, quantidade, adicionais, total_adicionais, total_item, observacoes')
          .eq('pedido_id', pedido.id)
        return { ...pedido, itens: itens || [] }
      })
    )

    return new Response(
      JSON.stringify({ pedidos: pedidosComItens }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('[buscar-pedidos] Erro:', errorMessage)
    return new Response(
      JSON.stringify({ error: errorMessage, pedidos: [] }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
