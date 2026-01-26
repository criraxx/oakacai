import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Gateway URLs
const UMBRELLAPAG_BASE_URL = 'https://api-gateway.umbrellapag.com/api'
const EVOPAY_URL = 'https://pix.evopay.cash/v1/pix'
const BLACKCAT_URL = 'https://api.blackcatpagamentos.online/api'

type ConcurrencyMapper<T, R> = (item: T) => Promise<R>

async function mapWithConcurrency<T, R>(items: T[], limit: number, mapper: ConcurrencyMapper<T, R>) {
  const results: R[] = new Array(items.length)
  let index = 0

  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (index < items.length) {
      const currentIndex = index++
      results[currentIndex] = await mapper(items[currentIndex])
    }
  })

  await Promise.all(workers)
  return results
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const adminPassword = Deno.env.get('ADMIN_PASSWORD')!
    const umbrellapagApiKey = Deno.env.get('UMBRELLAPAG_API_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const body = await req.json().catch(() => ({})) as {
      action?: string
      password?: string
      pedidoId?: string
      novoStatus?: string
      days?: number
    }

    const { action, password, pedidoId, novoStatus } = body

    // Verificar senha do admin
    if (password !== adminPassword) {
      console.log('Tentativa de acesso com senha incorreta')
      return new Response(
        JSON.stringify({ error: 'Senha incorreta' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'listar') {
      console.log('Buscando todos os pedidos...')
      
      // Buscar pedidos com seus itens
      const { data: pedidos, error: pedidosError } = await supabase
        .from('pedidos')
        .select('*')
        .order('created_at', { ascending: false })

      if (pedidosError) {
        console.error('Erro ao buscar pedidos:', pedidosError)
        throw pedidosError
      }

      // Buscar itens para cada pedido
      const pedidosComItens = await Promise.all(
        pedidos.map(async (pedido) => {
          const { data: itens, error: itensError } = await supabase
            .from('pedido_itens')
            .select('*')
            .eq('pedido_id', pedido.id)

          if (itensError) {
            console.error(`Erro ao buscar itens do pedido ${pedido.id}:`, itensError)
            return { ...pedido, itens: [] }
          }

          return { ...pedido, itens }
        })
      )

      console.log(`Retornando ${pedidosComItens.length} pedidos`)
      return new Response(
        JSON.stringify({ pedidos: pedidosComItens }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'atualizar_status') {
      if (!pedidoId || !novoStatus) {
        return new Response(
          JSON.stringify({ error: 'pedidoId e novoStatus são obrigatórios' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log(`Atualizando status do pedido ${pedidoId} para ${novoStatus}`)

      const { error: updateError } = await supabase
        .from('pedidos')
        .update({ status_pedido: novoStatus })
        .eq('id', pedidoId)

      if (updateError) {
        console.error('Erro ao atualizar status:', updateError)
        throw updateError
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'reconciliar_pagamentos') {
      // Obs: password já foi validada acima
      const days = Number.isFinite(body.days) ? Math.max(1, Math.min(30, Number(body.days))) : 7
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

      console.log(`[reconciliar_pagamentos] Buscando pedidos PIX pendentes desde ${since} (últimos ${days} dias)`) 

      // Buscar gateway ativo
      const { data: config } = await supabase
        .from('configuracoes')
        .select('gateway_pix')
        .eq('id', 'global')
        .maybeSingle()

      const gateway = config?.gateway_pix || 'umbrellapag'
      console.log(`[reconciliar_pagamentos] Gateway ativo: ${gateway}`)

      const evopayApiKey = Deno.env.get('EVOPAY_API_KEY')
      const blackcatApiKey = Deno.env.get('BLACKCAT_API_KEY')

      const { data: pedidos, error: pedidosError } = await supabase
        .from('pedidos')
        .select('id, payment_id, status_pagamento, created_at')
        .eq('forma_pagamento', 'pix')
        .eq('status_pagamento', 'pendente')
        .not('payment_id', 'is', null)
        .gte('created_at', since)
        .order('created_at', { ascending: false })

      if (pedidosError) {
        console.error('[reconciliar_pagamentos] Erro ao buscar pedidos:', pedidosError)
        throw pedidosError
      }

      const lista = (pedidos || []).filter((p) => !!p.payment_id) as Array<{ id: string; payment_id: string; created_at: string }>
      console.log(`[reconciliar_pagamentos] ${lista.length} pedido(s) para verificar`) 

      let checked = 0
      let paid = 0
      let updated = 0
      const updatedPedidoIds: string[] = []
      const errors: Array<{ pedidoId: string; paymentId: string; error: string }> = []

      await mapWithConcurrency(lista, 5, async (pedido) => {
        checked++
        const paymentId = String(pedido.payment_id)

        try {
          let status = ''

          if (gateway === 'evopay' && evopayApiKey) {
            // EvoPay: GET /v1/pix/{id}
            const resp = await fetch(`${EVOPAY_URL}/${paymentId}`, {
              method: 'GET',
              headers: {
                'API-Key': evopayApiKey,
              },
            })

            const text = await resp.text()
            if (!resp.ok) {
              throw new Error(`HTTP ${resp.status} - ${text}`)
            }

            const data = JSON.parse(text) as { status?: string }
            status = String(data?.status || '').toUpperCase()
            
            // EvoPay uses different status values
            if (status === 'APPROVED' || status === 'PAID' || status === 'COMPLETED') {
              status = 'PAID'
            }
          } else if (gateway === 'blackcat' && blackcatApiKey) {
            // BlackCat: GET /sales/{transactionId}/status
            const resp = await fetch(`${BLACKCAT_URL}/sales/${paymentId}/status`, {
              method: 'GET',
              headers: {
                'X-API-Key': blackcatApiKey,
              },
            })

            const text = await resp.text()
            if (!resp.ok) {
              throw new Error(`HTTP ${resp.status} - ${text}`)
            }

            const data = JSON.parse(text) as { data?: { status?: string }; status?: string }
            status = String(data?.data?.status || data?.status || '').toUpperCase()
          } else {
            // UmbrellaPag: GET /api/user/transactions/{transactionId}
            const resp = await fetch(`${UMBRELLAPAG_BASE_URL}/user/transactions/${paymentId}`, {
              method: 'GET',
              headers: {
                'x-api-key': umbrellapagApiKey,
                'User-Agent': 'UMBRELLAB2B/1.0',
              },
            })

            const text = await resp.text()
            if (!resp.ok) {
              throw new Error(`HTTP ${resp.status} - ${text}`)
            }

            const data = JSON.parse(text) as { data?: { status?: string } }
            status = String(data?.data?.status || '').toUpperCase()
          }

          if (status === 'PAID' || status === 'COMPLETED') {
            paid++
            const { error: updateError } = await supabase
              .from('pedidos')
              .update({ status_pagamento: 'confirmado' })
              .eq('id', pedido.id)

            if (updateError) {
              throw new Error(updateError.message)
            }
            updated++
            updatedPedidoIds.push(pedido.id)
          }
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : String(e)
          console.error(`[reconciliar_pagamentos] Erro no pedido ${pedido.id} (payment_id=${paymentId}):`, msg)
          errors.push({ pedidoId: pedido.id, paymentId, error: msg })
        }
      })

      return new Response(
        JSON.stringify({
          success: true,
          days,
          checked,
          paid,
          updated,
          updatedPedidoIds,
          errors,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Ação não reconhecida' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('Erro na função admin-pedidos:', errorMessage)
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
