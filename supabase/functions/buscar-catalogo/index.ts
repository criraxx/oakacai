import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const [categorias, produtos, banners, config, secoes, complementos, produtoSecoes, orderBumps, downsells] = await Promise.all([
      supabase.from('categorias').select('*').eq('ativo', true).order('ordem'),
      supabase.from('produtos').select('*').eq('ativo', true).order('ordem'),
      supabase.from('banners').select('*').eq('ativo', true).order('ordem'),
      supabase.from('configuracoes').select('*').eq('id', 'global').maybeSingle(),
      supabase.from('secoes_complementos').select('*').eq('ativo', true).order('ordem'),
      supabase.from('complementos').select('*').eq('ativo', true).order('ordem'),
      supabase.from('produto_secoes').select('*'),
      supabase.from('order_bumps').select('*').eq('ativo', true).order('ordem').limit(1),
      supabase.from('downsells').select('*').eq('ativo', true).order('ordem').limit(1),
    ]);

    return new Response(
      JSON.stringify({
        categorias: categorias.data || [],
        produtos: produtos.data || [],
        banners: banners.data || [],
        secoes: secoes.data || [],
        complementos: complementos.data || [],
        produto_secoes: produtoSecoes.data || [],
        order_bump: orderBumps.data?.[0] || null,
        downsell: downsells.data?.[0] || null,
        config: config.data || null,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('[buscar-catalogo]', msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
