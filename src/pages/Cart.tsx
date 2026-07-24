import { useNavigate } from "react-router-dom";
import { ArrowLeft, Trash2, ShoppingBag, Plus, ArrowRight, Tag, Pencil } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { todasSecoes } from "@/data/complementosData";
import { useBranding } from "@/hooks/useBranding";
import BottomNavigation from "@/components/BottomNavigation";
import OrderBumpList from "@/components/OrderBumpList";
import DownsellModal from "@/components/DownsellModal";

import acaiPuro from "@/assets/acai-puro.jpg";
import acaiCombo300 from "@/assets/acai-combo-300.jpg";
import acaiRafaelo from "@/assets/acai-rafaelo.jpg";
import acaiDiamante from "@/assets/acai-diamante-negro.jpg";
import acaiSensacao from "@/assets/acai-sensacao.jpg";

const produtosSugeridos = [
  { id: "copo-300ml-puro", nome: "Vaso 300ml Açaí Puro", preco: 4.90, imagem: acaiPuro },
  { id: "combo-300ml", nome: "Combo Premium 300ml", preco: 7.90, imagem: acaiCombo300 },
  { id: "trufado-rafaelo-300", nome: "Trufado Rafaelo 300ml", preco: 5.99, imagem: acaiRafaelo },
  { id: "trufado-diamante-300", nome: "Diamante Negro 300ml", preco: 5.99, imagem: acaiDiamante },
  { id: "trufado-sensacao-300", nome: "Sensación 300ml", preco: 5.99, imagem: acaiSensacao },
];

const formatEUR = (v: number) => `${v.toFixed(2).replace(".", ",")} €`;

const Cart = () => {
  const navigate = useNavigate();
  const { cor_borda_logo } = useBranding();
  const accent = cor_borda_logo || "#F5E6D3";
  const { itens, removerItem, limparCarrinho, adicionarItem, incrementarQuantidade, decrementarQuantidade, getSubtotal, getTotal, getDescontoMetadePreco } = useCart();

  const getNomeComplemento = (complementoId: string): string => {
    for (const secao of todasSecoes) {
      const item = secao.itens.find((i) => i.id === complementoId);
      if (item) return item.nome;
    }
    return complementoId;
  };

  const sugestoesFiltradas = produtosSugeridos.filter(
    (prod) => !itens.some((item) => item.produtoId === prod.id),
  );

  const adicionarProdutoSugerido = (produto: typeof produtosSugeridos[0]) => {
    adicionarItem({
      id: `item-${Date.now()}`,
      produtoId: produto.id,
      produtoNome: produto.nome,
      produtoPreco: produto.preco,
      produtoImagem: produto.imagem,
      complementos: {},
      observacoes: "",
      totalAdicionais: 0,
    });
  };

  if (itens.length === 0) {
    return (
      <div className="min-h-screen bg-background max-w-md mx-auto flex flex-col page-enter">
        <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
          <div className="flex items-center gap-3 px-4 py-3">
            <button
              onClick={() => navigate(-1)}
              className="w-9 h-9 flex items-center justify-center text-foreground hover:bg-muted rounded-full transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-foreground font-semibold text-lg">Mi carrito</h1>
          </div>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
          <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-5">
            <ShoppingBag size={44} className="text-muted-foreground" />
          </div>
          <h2 className="text-foreground font-semibold text-xl mb-2">Tu carrito está vacío</h2>
          <p className="text-muted-foreground text-sm text-center mb-8 max-w-xs">
            ¿Y si eliges un açaí delicioso ahora mismo?
          </p>
          <button
            onClick={() => navigate("/")}
            className="px-8 py-3.5 text-white font-semibold rounded-full press-effect hover:opacity-90 transition-opacity shadow-md"
            style={{ backgroundColor: cor_borda_logo }}
          >
            Ver carta
          </button>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  const subtotal = getSubtotal();
  const descontoMetade = getDescontoMetadePreco();
  const subtotalComMetade = subtotal - descontoMetade;
  const descontoPix = subtotalComMetade * 0.06;
  const total = subtotalComMetade - descontoPix;


  return (
    <div className="min-h-screen bg-muted/30 max-w-md mx-auto flex flex-col page-enter pb-20">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-9 h-9 flex items-center justify-center text-foreground hover:bg-muted rounded-full transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-foreground font-semibold text-lg leading-tight">Mi carrito</h1>
              <p className="text-muted-foreground text-xs">
                {itens.reduce((acc, item) => acc + (item.quantidade ?? 1), 0)} {itens.reduce((acc, item) => acc + (item.quantidade ?? 1), 0) === 1 ? "artículo" : "artículos"}
              </p>
            </div>
          </div>
          <button
            onClick={limparCarrinho}
            className="text-destructive text-xs font-medium hover:underline flex items-center gap-1"
          >
            <Trash2 size={14} /> Vaciar
          </button>
        </div>
      </header>

      <main className="flex-1 pt-3">
        {/* Card: Resumen del pedido */}
        <section className="mx-4 mb-4 bg-background rounded-2xl border border-border overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h2 className="text-foreground font-semibold text-sm">Tu pedido</h2>
            <button
              onClick={() => navigate("/")}
              className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
            >
              <Plus size={12} /> Añadir más
            </button>
          </div>

          <ul className="divide-y divide-border">
            {itens.map((item) => {
              const complementosSelecionados = Object.entries(item.complementos).filter(
                ([_, qtd]) => qtd > 0,
              );
              return (
                <li key={item.id} className="p-3 flex gap-3">
                  <img
                    src={item.produtoImagem}
                    alt={item.produtoNome}
                    className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-foreground font-medium text-sm leading-snug line-clamp-2">
                        {item.produtoNome}
                      </h3>
                      <div className="flex items-center gap-1 -mt-0.5">
                        <button
                          onClick={() =>
                            navigate(`/produto/${item.produtoId}`, {
                              state: {
                                editandoItem: item,
                                produto: {
                                  nome: item.produtoNome,
                                  preco: item.produtoPreco,
                                  imagem: item.produtoImagem,
                                  descricao: "",
                                },
                              },
                            })
                          }
                          aria-label="Editar artículo"
                          className="text-muted-foreground hover:text-primary transition-colors p-1"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => removerItem(item.id)}
                          aria-label="Eliminar artículo"
                          className="text-muted-foreground hover:text-destructive transition-colors p-1"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {complementosSelecionados.length > 0 && (
                      <div className="mt-1 space-y-0.5">
                        {complementosSelecionados.slice(0, 2).map(([id, qtd]) => (
                          <p key={id} className="text-muted-foreground text-xs truncate">
                            <span className="text-foreground/70 font-medium">{qtd}x</span>{" "}
                            {getNomeComplemento(id)}
                          </p>
                        ))}
                        {complementosSelecionados.length > 2 && (
                          <p className="text-muted-foreground text-xs">
                            +{complementosSelecionados.length - 2} extras
                          </p>
                        )}
                      </div>
                    )}

                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => decrementarQuantidade(item.id)}
                          aria-label="Reducir cantidad"
                          className="w-7 h-7 flex items-center justify-center rounded-full border border-border bg-muted text-foreground hover:bg-muted/80 active:scale-95 transition-all"
                        >
                          −
                        </button>
                        <span className="w-5 text-center text-sm font-semibold text-foreground">
                          {item.quantidade ?? 1}
                        </span>
                        <button
                          onClick={() => incrementarQuantidade(item.id)}
                          aria-label="Aumentar cantidad"
                          className="w-7 h-7 flex items-center justify-center rounded-full bg-primary text-primary-foreground hover:opacity-90 active:scale-95 transition-all"
                        >
                          +
                        </button>
                      </div>
                      <p className="text-foreground font-bold text-sm">
                        {formatEUR((item.produtoPreco + item.totalAdicionais) * (item.quantidade ?? 1))}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Order Bumps dinámicos */}
        <OrderBumpList gatilho="carrinho" />

        {/* Añade también */}
        {sugestoesFiltradas.length > 0 && (
          <section className="mb-4">
            <h3 className="text-foreground font-semibold text-sm px-4 mb-2">Añade también</h3>
            <div className="flex gap-3 overflow-x-auto pb-2 px-4 scrollbar-hide">
              {sugestoesFiltradas.map((produto) => (
                <div
                  key={produto.id}
                  className="flex-shrink-0 w-32 bg-background rounded-xl border border-border overflow-hidden shadow-sm"
                >
                  <img
                    src={produto.imagem}
                    alt={produto.nome}
                    className="w-full h-24 object-cover"
                  />
                  <div className="p-2">
                    <p className="text-foreground text-xs font-medium leading-tight line-clamp-2 mb-1 h-8">
                      {produto.nome}
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="text-foreground font-bold text-xs">
                        {formatEUR(produto.preco)}
                      </p>
                      <button
                        onClick={() => adicionarProdutoSugerido(produto)}
                        aria-label={`Añadir ${produto.nome}`}
                        className="w-7 h-7 flex items-center justify-center bg-primary text-primary-foreground rounded-full press-effect"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Card: Resumen de importes */}
        <section className="mx-4 mb-4 bg-background rounded-2xl border border-border p-4 shadow-sm">
          <h3 className="text-foreground font-semibold text-sm mb-3">Resumen</h3>
          <div className="space-y-1.5 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="text-foreground font-medium">{formatEUR(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Gastos de envío</span>
              <span className="text-green-500 font-medium">Gratis</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-1">
                <Tag size={12} /> Descuento pago online (6%)
              </span>
              <span className="text-green-500 font-medium">- {formatEUR(descontoPix)}</span>
            </div>
            <div className="border-t border-border my-2" />
            <div className="flex items-center justify-between">
              <span className="text-foreground font-semibold">Total</span>
              <span className="text-foreground font-bold text-lg">{formatEUR(total)}</span>
            </div>
          </div>
        </section>

        {/* Aviso pago online */}
        <div className="mx-4 mb-4 p-3 bg-accent/10 rounded-xl border border-accent/30 flex items-center gap-2">
          <Tag size={16} className="text-accent flex-shrink-0" />
          <p className="text-accent text-xs font-medium">
            ¡Paga online y consigue un <strong>6% de descuento</strong> automático!
          </p>
        </div>
        {/* Botón Continuar inline */}
        <div className="mx-4 mb-4">
          <button
            onClick={() => navigate("/identificacao")}
            className="w-full rounded-2xl flex items-center justify-between px-5 py-4 active:scale-[0.98] transition-all"
            style={{ background: accent, color: "#000" }}
          >
            <div className="flex flex-col items-start">
              <span className="text-xs opacity-70">Total</span>
              <span className="font-bold text-lg leading-none">{formatEUR(total)}</span>
            </div>
            <div className="flex items-center gap-2 font-semibold">
              Continuar <ArrowRight size={18} />
            </div>
          </button>
        </div>
      </main>

      <BottomNavigation />
      <DownsellModal posicao="saida" />
    </div>
  );
};

export default Cart;
