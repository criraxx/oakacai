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

    const { data: whatsapp } = await supabase
      .from('numeros_whatsapp')
      .select('numero')
      .eq('ativo', true)
      .maybeSingle()

    const { data: config } = await supabase
      .from('configuracoes')
      .select('gateway_pix, modo_cartao_apenas, logo_url, banner_url, cor_borda_logo')
      .eq('id', 'global')
      .maybeSingle()

    return new Response(
      JSON.stringify({
        whatsapp_numero: whatsapp?.numero || null,
        gateway_pix: config?.gateway_pix || 'umbrellapag',
        modo_cartao_apenas: config?.modo_cartao_apenas ?? false,
        logo_url: config?.logo_url || null,
        banner_url: config?.banner_url || null,
        cor_borda_logo: config?.cor_borda_logo || '#F5E6D3',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('[buscar-config] Erro:', errorMessage)
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
