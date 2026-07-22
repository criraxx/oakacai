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
    const adminPassword = Deno.env.get('ADMIN_PASSWORD')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const body = await req.json().catch(() => ({})) as {
      action?: string
      password?: string
      gateway_pix?: string
      numero?: string
      numero_id?: string
      modo_cartao_apenas?: boolean
      logo_url?: string | null
      banner_url?: string | null
      cor_borda_logo?: string
    }

    const { action, password, gateway_pix, numero, numero_id, modo_cartao_apenas, logo_url, banner_url, cor_borda_logo } = body

    // Verificar senha do admin
    if (password !== adminPassword) {
      return new Response(
        JSON.stringify({ error: 'Senha incorreta' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Listar configurações e números
    if (action === 'listar') {
      const { data: config } = await supabase
        .from('configuracoes')
        .select('gateway_pix, modo_cartao_apenas, logo_url, banner_url, cor_borda_logo')
        .eq('id', 'global')
        .maybeSingle()

      const { data: numeros } = await supabase
        .from('numeros_whatsapp')
        .select('*')
        .order('created_at', { ascending: false })

      return new Response(
        JSON.stringify({
          gateway_pix: config?.gateway_pix || 'umbrellapag',
          modo_cartao_apenas: config?.modo_cartao_apenas ?? false,
          logo_url: config?.logo_url || null,
          banner_url: config?.banner_url || null,
          cor_borda_logo: config?.cor_borda_logo || '#F5E6D3',
          numeros_whatsapp: numeros || [],
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Atualizar branding (logo, banner, cor da borda)
    if (action === 'atualizar_branding') {
      const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
      if (typeof logo_url !== 'undefined') updates.logo_url = logo_url
      if (typeof banner_url !== 'undefined') updates.banner_url = banner_url
      if (typeof cor_borda_logo === 'string' && /^#[0-9a-fA-F]{6}$/.test(cor_borda_logo)) {
        updates.cor_borda_logo = cor_borda_logo
      }

      const { error } = await supabase
        .from('configuracoes')
        .update(updates)
        .eq('id', 'global')

      if (error) throw error

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }


    // Atualizar modo cartão apenas
    if (action === 'atualizar_modo_cartao_apenas') {
      if (typeof modo_cartao_apenas !== 'boolean') {
        return new Response(
          JSON.stringify({ error: 'modo_cartao_apenas deve ser boolean' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { error } = await supabase
        .from('configuracoes')
        .update({ modo_cartao_apenas, updated_at: new Date().toISOString() })
        .eq('id', 'global')

      if (error) throw error

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Atualizar gateway
    if (action === 'atualizar_gateway') {
      if (!gateway_pix) {
        return new Response(
          JSON.stringify({ error: 'gateway_pix é obrigatório' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { error } = await supabase
        .from('configuracoes')
        .update({ gateway_pix, updated_at: new Date().toISOString() })
        .eq('id', 'global')

      if (error) throw error

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Adicionar número WhatsApp
    if (action === 'adicionar_numero') {
      if (!numero || numero.length < 10) {
        return new Response(
          JSON.stringify({ error: 'Número inválido' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { error } = await supabase
        .from('numeros_whatsapp')
        .insert({ numero, ativo: false })

      if (error) throw error

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Ativar número WhatsApp
    if (action === 'ativar_numero') {
      if (!numero_id) {
        return new Response(
          JSON.stringify({ error: 'numero_id é obrigatório' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { error } = await supabase
        .from('numeros_whatsapp')
        .update({ ativo: true })
        .eq('id', numero_id)

      if (error) throw error

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Excluir número WhatsApp
    if (action === 'excluir_numero') {
      if (!numero_id) {
        return new Response(
          JSON.stringify({ error: 'numero_id é obrigatório' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { error } = await supabase
        .from('numeros_whatsapp')
        .delete()
        .eq('id', numero_id)

      if (error) throw error

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Ação não reconhecida' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('[admin-config] Erro:', errorMessage)
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
