import { useNavigate } from "react-router-dom";
import { ArrowLeft, Trash2, ShoppingBag, Plus, ArrowRight, Tag } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { todasSecoes } from "@/data/complementosData";
import BottomNavigation from "@/components/BottomNavigation";
import OrderBumpList from "@/components/OrderBumpList";
import DownsellModal from "@/components/DownsellModal";

import acaiPuroAsset from "@/assets/acai-puro.jpg.asset.json";
import acaiCombo300Asset from "@/assets/acai-combo-300.jpg.asset.json";
import acaiRafaeloAsset from "@/assets/acai-rafaelo.jpg.asset.json";
import acaiDiamanteAsset from "@/assets/acai-diamante-negro.jpg.asset.json";
import acaiSensacaoAsset from "@/assets/acai-sensacao.jpg.asset.json";

const produtosSugeridos = [
  { id: "copo-300ml-puro", nome: "Copo 300ml Açaí Puro", preco: 25.9, imagem: acaiPuroAsset.url },
  { id: "combo-300ml", nome: "Combo Premium 300ml", preco: 49.9, imagem: acaiCombo300Asset.url },
  { id: "trufado-rafaelo-300", nome: "Trufado Rafaelo 300ml", preco: 34.99, imagem: acaiRafaeloAsset.url },
  { id: "trufado-diamante-300", nome: "Diamante Negro 300ml", preco: 34.99, imagem: acaiDiamanteAsset.url },
  { id: "trufado-sensacao-300", nome: "Sensação 300ml", preco: 34.99, imagem: acaiSensacaoAsset.url },
];

const formatBRL = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;

const Cart = () => {
  const navigate = useNavigate();
  const { itens, removerItem, limparCarrinho, adicionarItem, getSubtotal, getTotal } = useCart();

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
            <h1 className="text-foreground font-semibold text-lg">Meu carrinho</h1>
          </div>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
          <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-5">
            <ShoppingBag size={44} className="text-muted-foreground" />
          </div>
          <h2 className="text-foreground font-semibold text-xl mb-2">Seu carrinho está vazio</h2>
          <p className="text-muted-foreground text-sm text-center mb-8 max-w-xs">
            Que tal escolher um açaí delicioso agora mesmo?
          </p>
          <button
            onClick={() => navigate("/")}
            className="px-8 py-3.5 bg-primary text-primary-foreground font-semibold rounded-full press-effect hover:opacity-90 transition-opacity"
          >
            Ver cardápio
          </button>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  const subtotal = getSubtotal();
  const total = getTotal();
  const descontoPix = subtotal * 0.06;

  return (
    <div className="min-h-screen bg-muted/30 max-w-md mx-auto flex flex-col page-enter">
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
              <h1 className="text-foreground font-semibold text-lg leading-tight">Meu carrinho</h1>
              <p className="text-muted-foreground text-xs">
                {itens.length} {itens.length === 1 ? "item" : "itens"}
              </p>
            </div>
          </div>
          <button
            onClick={limparCarrinho}
            className="text-destructive text-xs font-medium hover:underline flex items-center gap-1"
          >
            <Trash2 size={14} /> Limpar
          </button>
        </div>
      </header>

      <main className="flex-1 pb-40 pt-3">
        {/* Card: Resumo do pedido */}
        <section className="mx-4 mb-4 bg-background rounded-2xl border border-border overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h2 className="text-foreground font-semibold text-sm">Seu pedido</h2>
            <button
              onClick={() => navigate("/")}
              className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
            >
              <Plus size={12} /> Adicionar mais
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
                      <button
                        onClick={() => removerItem(item.id)}
                        aria-label="Remover item"
                        className="text-muted-foreground hover:text-destructive transition-colors -mt-0.5"
                      >
                        <Trash2 size={16} />
                      </button>
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
                            +{complementosSelecionados.length - 2} adicionais
                          </p>
                        )}
                      </div>
                    )}

                    <div className="mt-2 flex items-center justify-between">
                      <button
                        onClick={() => navigate(`/produto/${item.produtoId}`)}
                        className="text-xs text-primary font-medium hover:underline"
                      >
                        Editar
                      </button>
                      <p className="text-foreground font-bold text-sm">
                        {formatBRL(item.produtoPreco + item.totalAdicionais)}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Order Bumps dinâmicos */}
        <OrderBumpList gatilho="carrinho" />

        {/* Peça também */}
        {sugestoesFiltradas.length > 0 && (
          <section className="mb-4">
            <h3 className="text-foreground font-semibold text-sm px-4 mb-2">Peça também</h3>
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
                        {formatBRL(produto.preco)}
                      </p>
                      <button
                        onClick={() => adicionarProdutoSugerido(produto)}
                        aria-label={`Adicionar ${produto.nome}`}
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

        {/* Card: Resumo de valores */}
        <section className="mx-4 mb-4 bg-background rounded-2xl border border-border p-4 shadow-sm">
          <h3 className="text-foreground font-semibold text-sm mb-3">Resumo</h3>
          <div className="space-y-1.5 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="text-foreground font-medium">{formatBRL(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Taxa de entrega</span>
              <span className="text-green-500 font-medium">Grátis</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-1">
                <Tag size={12} /> Desconto no PIX (6%)
              </span>
              <span className="text-green-500 font-medium">- {formatBRL(descontoPix)}</span>
            </div>
            <div className="border-t border-border my-2" />
            <div className="flex items-center justify-between">
              <span className="text-foreground font-semibold">Total</span>
              <span className="text-foreground font-bold text-lg">{formatBRL(total)}</span>
            </div>
          </div>
        </section>

        {/* Aviso PIX */}
        <div className="mx-4 mb-4 p-3 bg-accent/10 rounded-xl border border-accent/30 flex items-center gap-2">
          <Tag size={16} className="text-accent flex-shrink-0" />
          <p className="text-accent text-xs font-medium">
            Pague com PIX e ganhe <strong>6% de desconto</strong> automático!
          </p>
        </div>
      </main>

      {/* Footer fixo elegante */}
      <footer className="fixed bottom-14 left-0 right-0 max-w-md mx-auto px-4 pb-3 z-40">
        <button
          onClick={() => navigate("/identificacao")}
          className="w-full bg-primary text-primary-foreground rounded-2xl shadow-lg press-effect flex items-center justify-between px-5 py-4 hover:opacity-95 transition-opacity"
        >
          <div className="flex flex-col items-start">
            <span className="text-xs opacity-80">Total</span>
            <span className="font-bold text-lg leading-none">{formatBRL(total)}</span>
          </div>
          <div className="flex items-center gap-2 font-semibold">
            Avançar <ArrowRight size={18} />
          </div>
        </button>
      </footer>

      <BottomNavigation />
      <DownsellModal posicao="saida" />
    </div>
  );
};

export default Cart;
