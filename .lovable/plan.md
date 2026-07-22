## Objetivo

Transformar o admin em um painel completo de gestão de loja, com controle total sobre produtos, complementos, banners, order bump e downsell, além de melhorar a experiência de compra (carrinho + página do produto premium + bottom nav).

---

## 1. Banco de dados (novas tabelas)

Todas com RLS bloqueada para `anon`; acesso apenas via Edge Functions com `SERVICE_ROLE_KEY` (padrão do projeto).

- **`produtos`** — id, nome, descrição, preço, imagem (base64), categoria, ordem, ativo, com_borda, cor_borda, cor_fundo_card
- **`categorias`** — id, nome, slug, ordem, ativo
- **`secoes_complementos`** — id, título, subtítulo, tipo (`gratis`/`pago`), max_itens, ativo
- **`complementos`** — id, secao_id, nome, preço (null=grátis), imagem, max_quantidade, ativo, ordem
- **`produto_secoes`** — vincula produto ↔ seções de complementos que aparecem para ele
- **`banners`** — id, imagem, ordem, ativo, acao_tipo (`nenhuma`/`produto`/`categoria`/`url`), acao_valor, intervalo_segundos
- **`order_bumps`** — id, nome, descrição, imagem, preço_original, preço_promocional, produto_vinculado_id, ativo
- **`downsells`** — id, nome, descrição, imagem, preço_original, preço_promocional, produto_vinculado_id, ativo
- **`configuracoes`** (novas colunas) — `cor_fundo_site`, `cor_padrao_borda_produto`, `borda_produto_ativa`

Adicionar colunas em `pedido_itens` para registrar order bump/downsell aplicados.

**Seed inicial**: migração popula tabelas com produtos e complementos atuais de `src/data/todosProutos.ts` e `complementosData.ts`, para não perder nada.

---

## 2. Edge Functions (novas / expandidas)

- `buscar-catalogo` — pública: retorna produtos ativos + categorias + banners ativos + configuração visual (para o site consumir)
- `buscar-complementos-produto` — pública: recebe `produto_id`, retorna seções e complementos ativos vinculados
- `admin-produtos` — CRUD (autenticado): criar/editar/excluir/reordenar produtos
- `admin-complementos` — CRUD de seções e itens de complemento, e vincular seções a produtos
- `admin-banners` — CRUD de banners + ação de clique
- `admin-ofertas` — CRUD de order bumps e downsells
- Expandir `admin-config` com novas cores globais
- Expandir `criar-pedido` para aceitar order bump / downsell aplicados

---

## 3. Frontend — site (comprador)

**Home**
- Substituir dados hardcoded pelo retorno de `buscar-catalogo`
- `PromoBannerCarousel` vira carrossel dinâmico com N banners; clique executa a ação configurada (navegar para produto/categoria ou nada)
- Cards de produto aplicam `com_borda`, `cor_borda`, `cor_fundo_card`; fundo global do site vem de `configuracoes.cor_fundo_site`

**Página do produto (premium)**
- Redesign de `ProductDetail.tsx`: hero da imagem maior com gradiente, título com tipografia refinada, seção de preço destacada, animações suaves entre seções de complementos, sticky bottom bar com total e botão CTA maior/com brilho
- Complementos vêm de `buscar-complementos-produto`

**Carrinho**
- Adicionar `<BottomNavigation />` na página `/carrinho` (mantém tela cheia, só acrescenta a barra inferior)

**Checkout — Order bump**
- Antes do botão "Finalizar pedido": card destacado com o order bump ativo (imagem, preço riscado, preço promocional, checkbox "Adicionar ao meu pedido")
- Se marcado, envia junto ao `criar-pedido` e soma no total

**Página PIX — Downsell**
- Listener de `beforeunload` / botão voltar / inatividade: dispara modal com o downsell ativo (imagem, oferta, botões "Aceitar oferta" / "Não, obrigado")
- Aceitar → cria novo pedido substituindo o atual com o item do downsell

---

## 4. Frontend — Admin (`/admin`)

Nova estrutura em abas:

1. **Pedidos** (existente)
2. **Vales-Presente** (existente)
3. **Produtos** — lista com drag-and-drop de ordem; modal de edição com: nome, descrição, preço, upload de foto, categoria, borda on/off + cor, cor de fundo do card, seções de complementos vinculadas (multi-select), ativo
4. **Complementos** — gestão de seções (Monte o copo 1, Adicionais, Premium, etc.) e itens (nome, preço, foto, ativo)
5. **Banners** — upload de imagens do carrossel, ordem, tempo de exibição, ação de clique (nenhuma/produto/categoria)
6. **Ofertas** — abas internas: Order Bump e Downsell, com formulário de criação/edição
7. **Configurações** (existente + novo) — cor de fundo do site, cor padrão de borda dos produtos, personalização visual já existente (logo/banner header/cor da borda da logo), modo cartão apenas, gateway ativo, WhatsApp

---

## 5. Faseamento interno de entrega

Como é grande, vou implementar em blocos sequenciais dentro do mesmo plano, sempre com o build passando entre eles:

1. Migração do banco + seed dos dados atuais
2. Edge Functions de leitura (`buscar-catalogo`, `buscar-complementos-produto`)
3. Frontend consumindo catálogo dinâmico + bottom nav no carrinho + cores globais
4. Edge Functions admin + abas Produtos e Complementos no `/admin`
5. Banners dinâmicos + aba Banners
6. Order bump (checkout) + Downsell (PIX) + aba Ofertas
7. Redesign premium da página do produto

---

## Detalhes técnicos

- Imagens seguem o padrão atual do projeto: **Base64 na coluna da tabela** (evita bucket público bloqueado e mantém consistência com logo/banner do header)
- Toda escrita passa por Edge Function autenticada com `ADMIN_PASSWORD` (mesmo padrão do `admin-config`)
- `useBranding` é expandido para virar `useSiteConfig` (branding + cores globais + banners)
- Novo hook `useCatalogo` com React Query para carregar produtos/categorias
- Compatibilidade: enquanto a migração roda, mantém fallback para os dados estáticos para não quebrar o preview
- Cache invalidation: após qualquer edição no admin, invalidar queries do catálogo