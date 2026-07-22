
# Plano — Experiência Premium do Catálogo Oak Açaí

O trabalho é grande, então proponho executar em **6 fases sequenciais**. Cada fase é entregável isoladamente e pode ser aprovada/revisada antes de seguir para a próxima.

---

## Fase 1 — Banco de dados: personalização, order bump e downsell completos

Uma única migração que estende o modelo atual para suportar tudo que foi pedido.

**`categorias`** — novos campos:
- `cor_fundo_card`, `cor_borda`, `com_borda` (padrão visual da categoria)

**`produtos`** — os campos `cor_fundo_card`, `cor_borda`, `com_borda` já existem; passam a **sobrescrever** o padrão da categoria quando preenchidos (NULL = herda da categoria).

**`order_bumps`** — substituir a tabela atual por versão completa:
- título, descrição, imagem, preço, `produto_ofertado_id`, `posicao` (`carrinho` | `checkout` | `pos_pagamento`), `ativo`, `ordem`
- nova tabela `order_bump_produtos_gatilho(order_bump_id, produto_id)` para definir em quais produtos do carrinho o bump aparece (vazio = todos)

**`downsells`** — estender:
- título, descrição, imagem, `produto_ofertado_id`, `preco_promocional`, `preco_original`, `ativo`, `max_exibicoes` (por sessão), `gatilho` (`sair_pix` | `fechar_checkout` | `ambos`)

**`produto_secoes`** — já existe; será a única fonte da verdade para "quais complementos aparecem em cada produto". A lógica hardcoded em `ProductDetail.tsx` (função `getTipoProduto`) será removida.

Todas as tabelas mantêm RLS bloqueado para `anon`; leitura via `buscar-catalogo` e escrita via `admin-catalogo`.

## Fase 2 — Migração das imagens para o CDN (assets)

Hoje os produtos usam imports estáticos (`src/assets/acai-*.jpg`) espalhados no código. Vou:

1. Rodar o skill **migrate-to-assets** para subir todas as imagens de `src/assets/` para o CDN Lovable e substituir por `.asset.json`.
2. Popular a coluna `produtos.imagem` no banco com a URL CDN correta de cada produto (script SQL de seed baseado no mapeamento atual `todosProutos.ts`).
3. Atualizar `CatalogoAdmin` para que o upload de foto do produto suba direto para o CDN via `lovable-assets` (opcional — se preferir, mantemos base64 no banco como está hoje; me diga na revisão).

Resultado: cada produto tem sua imagem vinculada no banco, sem depender de assets locais.

## Fase 3 — Página do produto premium (redesign completo)

Reescrever `src/pages/ProductDetail.tsx`:

- Abertura como **rota animada** (`framer-motion` já é o padrão do stack shadcn — vou adicionar via `motion/react`): entrada com `fade + scale + slide-up`, saída inversa.
- **Hero image full-width** no topo (16:9), com parallax leve no scroll e badge de promoção sobreposto quando aplicável.
- Header sticky translúcido que ganha fundo ao rolar.
- Título grande, preço destacado, descrição completa.
- Seções de complementos vindas do banco via `produto_secoes` (não mais lista hardcoded).
- Campo de observações sempre disponível.
- Footer sticky com botão "Adicionar" que faz uma micro-animação (bounce + flying image até o ícone do carrinho no `BottomNavigation`).
- Loading skeleton enquanto o catálogo carrega.

## Fase 4 — Personalização visual por produto/categoria no admin

Em `CatalogoAdmin.tsx`:

**Aba Categorias (nova)** — CRUD com color pickers para `cor_fundo_card`, `cor_borda`, `com_borda` (defaults da categoria).

**Aba Produtos** — no editor de cada produto, os campos de cor/borda passam a mostrar "Herdar da categoria" como opção (NULL). Preview ao vivo do card com as cores aplicadas.

**Aba Complementos por Produto** — dentro do editor do produto, seletor com checkbox de todas as seções de complementos disponíveis + reordenação por drag. Remover um complemento de um produto **não** apaga do sistema, só desvincula.

**Aba Order Bump** (reformulada) — múltiplos bumps, cada um com: título, descrição, imagem, preço, produto ofertado, posição de exibição, produtos-gatilho (multi-select) e toggle ativo.

**Aba Downsell** (reformulada) — mesma estrutura + `max_exibicoes` e regra de gatilho.

## Fase 5 — Order Bump e Downsell funcionais no fluxo

- **Order Bump**: componente `<OrderBumpCard>` que aparece no `Cart.tsx` (posição `carrinho`) e/ou `Checkout.tsx` (`checkout`), filtrando bumps ativos cujo `produtos_gatilho` bate com itens do carrinho.
- **Downsell**: hook `useDownsell()` que:
  - Escuta `beforeunload` e o botão voltar em `PagamentoPix` / `Checkout`.
  - Verifica `max_exibicoes` (contador em `sessionStorage`).
  - Abre modal animado com a oferta configurada.
  - Ao aceitar, substitui o item pelo `produto_ofertado_id` com o `preco_promocional`.

## Fase 6 — Microinterações e polimento global

Adicionar `motion/react` e aplicar transições em:

- **Categorias** (`CategoryTabs`): underline animado ao trocar (`layoutId`).
- **Cards de produto**: `hover:scale-[1.02]`, `tap:scale-98`, sombra suave. Aplicar as cores por produto/categoria vindas do banco.
- **Banners** (`PromoBannerCarousel`): fade cross entre slides.
- **Carrinho**: entrada dos itens em stagger; remoção com `AnimatePresence` slide-out; badge do carrinho anima ao adicionar.
- **Complementos**: `+`/`-` com bounce; total anima com `<AnimatePresence mode="popLayout">`.
- **Botões globais**: variant `premium` no shadcn com scale/tap feedback.
- **Bottom navigation**: indicador ativo animado.

Todas as cores continuam via tokens semânticos do `index.css` (nada de `text-white`/`bg-black` hardcoded).

---

## Detalhes técnicos

- **Nova dep**: `motion` (sucessor do `framer-motion`, ~30KB gz).
- **Rotas**: não muda; ProductDetail continua em `/produto/:id`, mas envolvida em `<AnimatePresence>` no `App.tsx` para transições entre rotas.
- **Edge functions**: `buscar-catalogo` passa a devolver `order_bumps[]` (com produtos-gatilho) e `downsells[]` completos. `admin-catalogo` ganha ações para as novas tabelas/campos.
- **Retrocompatibilidade**: se o produto/categoria não tiver cor definida, cai no default do design system (bg `card`, sem borda) — nada quebra.
- **Escopo intencionalmente fora**: refatorar o `Index.tsx` para consumir 100% do `useCatalogo` (algumas seções ainda usam `todosProutos.ts`). Isso pode ser feito junto se você quiser; por padrão, faço apenas o necessário para produto/carrinho/checkout consumirem dados do banco.

---

## Ordem de entrega sugerida

1. **Fase 1** (migração DB) — bloqueia tudo, começo por aqui.
2. **Fase 2** (imagens para CDN) — pode rodar em paralelo mental, mas executo depois.
3. **Fase 3** (ProductDetail premium) — impacto visual imediato.
4. **Fase 4** (admin de personalização).
5. **Fase 5** (bump + downsell no fluxo).
6. **Fase 6** (microinterações finais).

Se aprovar, começo executando Fase 1 + Fase 2 juntas (banco e assets), depois volto para revisão antes das fases visuais.
