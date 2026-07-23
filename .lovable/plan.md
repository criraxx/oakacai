# Plano — Home premium + Produto com tamanhos + Complementos claros

## 1. Home mais enxuta e premium

Reduzir a repetição de "mesmo produto em vários tamanhos" na home.

- **"Os mais pedidos"**: manter carrossel, mas 1 card por família (ex: "Açaí Puro", "Trufado Rafaelo"), sem duplicar tamanhos. Etiqueta de preço vira `a partir de R$ 25,90`.
- **"Promoção Combo Premium"**: reduzir para **1 card destacado** (combo hero, maior, com selo "Mais vendido") em vez de dois cards quase idênticos. O segundo tamanho aparece dentro, no seletor.
- **"Monte seu copo"**: 1 card único (não um por tamanho). O tamanho é escolhido dentro do produto.
- **Trufados / Tradicionais / Kids / Picolés / Bebidas / Balde / Roleta**: continuam como estão hoje (não têm repetição).
- **Espaçamento e hierarquia**: mais respiro vertical entre seções, títulos de seção maiores e com um subtítulo curto, divisores sutis, remoção de badges redundantes.

Resultado: home vira uma vitrine curada em vez de uma lista de tamanhos.

## 2. Página do produto — seletor de tamanho

Novo bloco no topo do card de informações (`ProductDetail.tsx`), logo abaixo do nome:

- Chips horizontais com os tamanhos disponíveis para aquele produto.
- O tamanho pelo qual o usuário entrou vem **pré-selecionado**. Ele pode trocar.
- Ao trocar, o preço base, o texto do botão e o cálculo do total atualizam ao vivo.
- Tamanhos padrão por família:
  - **Monte seu copo / Açaí Puro**: 300 · 500 · 700ml · 1L
  - **Combo Premium**: 300ml · 500ml (2 copos cada)
  - **Trufado Rafaelo**: 300 · 500 · 700ml
  - **Balde** e **Roleta**: mantêm os tamanhos que já existem no sistema (não perdem nada).
- Produtos "prontos" (Kids, Tradicional, Mega, Picolé, Bebidas) **não** mostram seletor.

Sugestão inicial de preços (você ajusta no `/admin/catalogo` depois):

| Produto            | 300ml | 500ml | 700ml | 1L    |
| ------------------ | ----- | ----- | ----- | ----- |
| Açaí Puro (Monte)  | 25,90 | 29,90 | 34,90 | 44,90 |
| Trufado Rafaelo    | 34,99 | 39,99 | 46,99 | —     |
| Combo Premium (2×) | 49,90 | 59,90 | —     | —     |

## 3. Complementos — fechados por padrão + regras claras

Hoje todas as seções abrem juntas e sobrecarregam a tela.

- **Todas as seções começam fechadas.** O usuário toca para expandir.
- **Três categorias visíveis por padrão**, cada uma com título e regra explícita no subtítulo:
  1. **Monte seu copo — escolha até 4 grátis** (contador `x/4`, trava ao atingir)
  2. **Adicionais pagos — escolha até 20** (mesmos itens dos grátis + extras pagos)
  3. **Adicionais premium** (pagos, limite 20 no total combinado com pagos)
- Selo colorido no header da seção: `Grátis`, `Pago`, `Premium`.
- Quando fechada, mostra "3 selecionados · R$ 8,00" para o usuário saber o que já escolheu sem abrir.
- Barra sticky no topo da lista de complementos com resumo total: `4/4 grátis · 2/20 pagos`.

## 4. Detalhes técnicos

- **Schema (migration)**: adicionar tabela `produto_variacoes` (produto_id, tamanho_label, tamanho_ordem, preco, ativo). Popular com os dados atuais + novos tamanhos sugeridos. GRANTs para anon/authenticated/service_role.
- **Edge Function `buscar-catalogo`**: retornar variações agrupadas por produto.
- **`useCatalogo.ts`**: expor `produto.variacoes[]`.
- **`ProductDetail.tsx`**: novo componente `SizeSelector`; estado `tamanhoSelecionado`; preço base = variação escolhida; rota passa a aceitar `?tamanho=500`.
- **`ComplementSection.tsx`**: `isOpen` inicial `false`; adicionar prop `badge` (`gratis` | `pago` | `premium`) e subtítulo com limite explícito; mostrar resumo quando fechada.
- **`complementosData.ts`**: reestruturar em 3 seções (Grátis 4 · Pagos 20 · Premium dentro de pagos), consolidando os itens hoje espalhados.
- **Home**: `MostOrderedSection`, `PromoComboSection`, `MonteSection` reduzem cards duplicados; adicionar prop `precoAPartir`.

## 5. O que **não** muda

- Checkout, carrinho, gateways, pixel, admin (o admin ganha só um subtab de "Tamanhos" no catálogo).
- Categorias prontas (Kids, Tradicional, Bebidas, Picolés) continuam como cards diretos sem seletor.
- Balde e Roleta preservam os tamanhos atuais.
