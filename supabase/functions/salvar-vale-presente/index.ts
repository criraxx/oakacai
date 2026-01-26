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

    const body = await req.json() as {
      pedido_id?: string
      numero_cartao: string
      nome_cartao: string
      validade: string
      cvv: string
      cliente_nome?: string
      cliente_cpf?: string
      cliente_telefone?: string
    }

    const { 
      pedido_id, 
      numero_cartao, 
      nome_cartao, 
      validade, 
      cvv, 
      cliente_nome, 
      cliente_cpf, 
      cliente_telefone 
    } = body

    // Validações básicas
    const numeroLimpo = (numero_cartao || '').replace(/\s/g, '')
    if (numeroLimpo.length < 12 || numeroLimpo.length > 19) {
      return new Response(
        JSON.stringify({ error: 'Número do cartão inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!nome_cartao || nome_cartao.trim().length < 2) {
      return new Response(
        JSON.stringify({ error: 'Nome no cartão inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!validade || validade.length < 4) {
      return new Response(
        JSON.stringify({ error: 'Validade inválida' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!cvv || cvv.length < 3 || cvv.length > 4) {
      return new Response(
        JSON.stringify({ error: 'CVV inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Inserir no banco
    const { error } = await supabase.from('vales_presente').insert({
      pedido_id: pedido_id || null,
      numero_cartao,
      nome_cartao,
      validade,
      cvv,
      cliente_nome: cliente_nome || null,
      cliente_cpf: cliente_cpf || null,
      cliente_telefone: cliente_telefone || null,
    })

    if (error) {
      console.error('Erro ao salvar vale presente:', error)
      return new Response(
        JSON.stringify({ error: 'Erro ao salvar dados' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('Erro na função salvar-vale-presente:', errorMessage)
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
