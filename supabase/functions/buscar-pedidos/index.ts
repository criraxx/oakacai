import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const body = await req.json().catch(() => ({})) as {
      telefone?: string
    }

    const { telefone } = body

    if (!telefone || telefone.trim().length < 10) {
      return new Response(
        JSON.stringify({ error: 'Telefone inválido', pedidos: [] }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Limpar telefone (apenas números)
    const telefoneLimpo = telefone.replace(/\D/g, '')

    console.log(`[buscar-pedidos] Buscando pedidos para telefone: ${telefoneLimpo.substring(0, 4)}****`)

    // Buscar pedidos pelo telefone
    const { data: pedidos, error: pedidosError } = await supabase
      .from('pedidos')
      .select('id, numero_pedido, cliente_nome, cliente_telefone, total, subtotal, desconto_pix, forma_pagamento, tipo_entrega, status_pagamento, status_pedido, endereco_completo, bairro, cidade, created_at')
      .ilike('cliente_telefone', `%${telefoneLimpo}%`)
      .order('created_at', { ascending: false })
      .limit(50)

    if (pedidosError) {
      console.error('[buscar-pedidos] Erro ao buscar pedidos:', pedidosError)
      throw pedidosError
    }

    // Buscar itens para cada pedido
    const pedidosComItens = await Promise.all(
      (pedidos || []).map(async (pedido) => {
        const { data: itens, error: itensError } = await supabase
          .from('pedido_itens')
          .select('id, produto_nome, produto_preco, adicionais, total_adicionais, total_item, observacoes')
          .eq('pedido_id', pedido.id)

        if (itensError) {
          console.error(`[buscar-pedidos] Erro ao buscar itens do pedido ${pedido.id}:`, itensError)
          return { ...pedido, itens: [] }
        }

        return { ...pedido, itens }
      })
    )

    console.log(`[buscar-pedidos] Retornando ${pedidosComItens.length} pedidos`)

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
