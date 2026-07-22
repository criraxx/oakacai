import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type Entity = 'produtos' | 'categorias' | 'secoes_complementos' | 'complementos' | 'produto_secoes' | 'banners' | 'order_bumps' | 'downsells';

const ENTITIES: Entity[] = ['produtos','categorias','secoes_complementos','complementos','produto_secoes','banners','order_bumps','downsells'];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    const adminPassword = Deno.env.get('ADMIN_PASSWORD')!;

    const body = await req.json().catch(() => ({})) as {
      password?: string;
      action?: 'list' | 'create' | 'update' | 'delete';
      entity?: Entity;
      data?: Record<string, unknown>;
      id?: string;
    };

    if (body.password !== adminPassword) {
      return new Response(JSON.stringify({ error: 'Senha incorreta' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { action, entity, data, id } = body;
    if (!entity || !ENTITIES.includes(entity)) {
      return new Response(JSON.stringify({ error: 'Entidade inválida' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'list') {
      const { data: rows, error } = await supabase.from(entity).select('*').order('ordem', { ascending: true, nullsFirst: false });
      if (error) throw error;
      return new Response(JSON.stringify({ rows }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'create') {
      if (!data) throw new Error('data é obrigatório');
      const { data: row, error } = await supabase.from(entity).insert(data).select().single();
      if (error) throw error;
      return new Response(JSON.stringify({ row }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'update') {
      if (!id || !data) throw new Error('id e data são obrigatórios');
      const { data: row, error } = await supabase.from(entity).update(data).eq('id', id).select().single();
      if (error) throw error;
      return new Response(JSON.stringify({ row }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'delete') {
      if (!id) throw new Error('id é obrigatório');
      const { error } = await supabase.from(entity).delete().eq('id', id);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Ação inválida' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('[admin-catalogo]', msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
