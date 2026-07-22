import { useNavigate } from "react-router-dom";
import { ArrowLeft, Trash2, ShoppingBag, Plus } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { todasSecoes } from "@/data/complementosData";
import BottomNavigation from "@/components/BottomNavigation";

// Produtos para sugestão (Order Bump)
import acaiPuroAsset from "@/assets/acai-puro.jpg.asset.json";
const acaiPuro = acaiPuroAsset.url;
import acaiCombo300 from "@/assets/acai-combo-300.jpg";
import acaiRafaelo from "@/assets/acai-rafaelo.png";
import acaiDiamante from "@/assets/acai-diamante-negro.png";
import acaiSensacao from "@/assets/acai-sensacao.jpg";

const produtosSugeridos = [
  {
    id: "copo-300ml-puro",
    nome: "Copo 300ml Açaí Puro",
    preco: 25.90,
    imagem: acaiPuro,
  },
  {
    id: "combo-300ml",
    nome: "Combo Premium 300ml",
    preco: 49.90,
    imagem: acaiCombo300,
  },
  {
    id: "trufado-rafaelo-300",
    nome: "Trufado Rafaelo 300ml",
    preco: 34.99,
    imagem: acaiRafaelo,
  },
  {
    id: "trufado-diamante-300",
    nome: "Diamante Negro 300ml",
    preco: 34.99,
    imagem: acaiDiamante,
  },
  {
    id: "trufado-sensacao-300",
    nome: "Sensação 300ml",
    preco: 34.99,
    imagem: acaiSensacao,
  },
];

const Cart = () => {
  const navigate = useNavigate();
  const { itens, removerItem, limparCarrinho, adicionarItem, getSubtotal, getTotal, getSubtotalSemPromocional, temItemPromocional } = useCart();

  const subtotalSemPromo = getSubtotalSemPromocional();
  const temPromo = temItemPromocional();
  
  // Verificar se precisa remover item promocional (carrinho caiu abaixo de R$50)
  const itemPromocional = itens.find(item => item.isPromocional);
  const deveRemoverPromocional = temPromo && subtotalSemPromo < 50;

  // Função para obter nome do complemento pelo ID
  const getNomeComplemento = (complementoId: string): string => {
    for (const secao of todasSecoes) {
      const item = secao.itens.find((i) => i.id === complementoId);
      if (item) return item.nome;
    }
    return complementoId;
  };

  // Filtrar sugestões para não mostrar produtos já no carrinho
  const sugestoesFiltradas = produtosSugeridos.filter(
    (prod) => !itens.some((item) => item.produtoId === prod.id)
  );

  // Adicionar produto sugerido ao carrinho
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
      <div className="min-h-screen bg-background max-w-md mx-auto flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-background border-b border-border">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="w-8 h-8 flex items-center justify-center text-foreground hover:bg-muted rounded-full transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <h1 className="text-foreground font-semibold text-lg">Carrinho</h1>
            </div>
          </div>
        </header>

        {/* Carrinho Vazio */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
            <ShoppingBag size={40} className="text-muted-foreground" />
          </div>
          <h2 className="text-foreground font-semibold text-lg mb-2">Carrinho vazio</h2>
          <p className="text-muted-foreground text-sm text-center mb-6">
            Adicione itens ao seu carrinho para continuar
          </p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-3 bg-card text-card-foreground font-semibold rounded-lg hover:opacity-90 transition-opacity"
          >
            Ver cardápio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background max-w-md mx-auto flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-8 h-8 flex items-center justify-center text-foreground hover:bg-muted rounded-full transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-foreground font-semibold text-lg">Carrinho</h1>
          </div>
          <button
            onClick={limparCarrinho}
            className="text-destructive text-sm font-medium hover:underline"
          >
            Limpar
          </button>
        </div>
      </header>

      {/* Lista de Itens */}
      <main className="flex-1 pb-44">
        {/* Aviso sobre item promocional que será removido */}
        {deveRemoverPromocional && itemPromocional && (
          <div className="mx-4 my-3 p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
            <p className="text-red-400 text-xs text-center font-medium">
              ⚠️ O item promocional "{itemPromocional.produtoNome}" será removido se você continuar com menos de R$50 em itens regulares.
            </p>
            <button
              onClick={() => removerItem(itemPromocional.id)}
              className="mt-2 w-full py-2 bg-red-500 text-white text-xs font-medium rounded-lg"
            >
              Remover item promocional
            </button>
          </div>
        )}

        {/* Barra de progresso para promoção */}
        {!temPromo && subtotalSemPromo < 50 && (
          <div className="mx-4 my-3 p-3 bg-promo/25 border border-promo/60 rounded-lg">
            <p className="text-promo-foreground text-xs text-center font-medium mb-2">
              💥 Faltam R$ {(50 - subtotalSemPromo).toFixed(2).replace(".", ",")} para desbloquear 1 produto pela METADE DO PREÇO!
            </p>
            <div className="w-full bg-promo/20 rounded-full h-2">
              <div 
                className="bg-promo h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min((subtotalSemPromo / 50) * 100, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Badge de promoção desbloqueada */}
        {!temPromo && subtotalSemPromo >= 50 && (
          <div className="mx-4 my-3 p-3 bg-green-500/20 border border-green-500/50 rounded-lg">
            <p className="text-green-400 text-xs text-center font-medium">
              🔥 PROMOÇÃO DESBLOQUEADA! Volte ao cardápio e escolha 1 produto pela METADE DO PREÇO!
            </p>
            <button
              onClick={() => navigate("/?categoria=metade-preco")}
              className="mt-2 w-full py-2 bg-green-500 text-white text-xs font-medium rounded-lg"
            >
              Escolher item promocional
            </button>
          </div>
        )}

        <div className="divide-y divide-border">
          {itens.map((item) => (
            <div 
              key={item.id} 
              className={`p-4 bg-background ${item.isPromocional ? "border-l-4 border-green-500" : ""}`}
            >
              <div className="flex gap-3">
                {/* Imagem */}
                <div className="relative">
                  <img
                    src={item.produtoImagem}
                    alt={item.produtoNome}
                    className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                  />
                  {item.isPromocional && (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-t from-green-500/40 to-transparent rounded-lg" />
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] px-1 py-0.5 rounded-full font-bold">
                        -50%
                      </span>
                    </>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-foreground font-medium text-sm leading-tight mb-1">
                    {item.produtoNome}
                  </h3>
                  
                  {item.isPromocional && (
                    <span className="inline-block bg-green-500/20 text-green-400 text-[10px] px-1.5 py-0.5 rounded mb-1">
                      🔥 Item Promocional
                    </span>
                  )}

                  {/* Complementos selecionados */}
                  <div className="mb-2">
                    {Object.entries(item.complementos)
                      .filter(([_, qtd]) => qtd > 0)
                      .slice(0, 2)
                      .map(([complementoId, qtd]) => (
                        <p key={complementoId} className="text-muted-foreground text-xs">
                          {qtd}x {getNomeComplemento(complementoId)}
                        </p>
                      ))}
                    {Object.entries(item.complementos).filter(([_, qtd]) => qtd > 0).length > 2 && (
                      <p className="text-muted-foreground text-xs">
                        +{Object.entries(item.complementos).filter(([_, qtd]) => qtd > 0).length - 2} itens
                      </p>
                    )}
                  </div>

                  {/* Preço */}
                  <p className={`font-bold text-sm ${item.isPromocional ? "text-green-400" : "text-foreground"}`}>
                    R$ {(item.produtoPreco + item.totalAdicionais).toFixed(2).replace(".", ",")}
                  </p>
                </div>

                {/* Controles de quantidade */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => removerItem(item.id)}
                    className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors border border-border"
                  >
                    <Trash2 size={16} />
                  </button>
                  <span className="w-8 text-center text-foreground font-medium">1</span>
                  {!item.isPromocional && (
                    <button
                      onClick={() => navigate(`/produto/${item.produtoId}`)}
                      className="w-8 h-8 flex items-center justify-center bg-card text-card-foreground rounded-lg transition-colors"
                    >
                      <Plus size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Seção Peça Também (Order Bump) */}
        {sugestoesFiltradas.length > 0 && (
          <div className="mt-4 px-4">
            <h3 className="text-foreground font-semibold text-sm mb-3">Peça também</h3>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {sugestoesFiltradas.map((produto) => (
                <div
                  key={produto.id}
                  className="flex-shrink-0 w-28 bg-muted rounded-xl overflow-hidden"
                >
                  <img
                    src={produto.imagem}
                    alt={produto.nome}
                    className="w-full h-20 object-cover"
                  />
                  <div className="p-2">
                    <p className="text-foreground text-xs font-medium leading-tight line-clamp-2 mb-1 h-8">
                      {produto.nome}
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="text-foreground font-bold text-xs">
                        R$ {produto.preco.toFixed(2).replace(".", ",")}
                      </p>
                      <button
                        onClick={() => adicionarProdutoSugerido(produto)}
                        className="w-6 h-6 flex items-center justify-center bg-card text-card-foreground rounded-full"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Adicionar mais itens */}
        <div className="p-4">
          <button
            onClick={() => navigate("/")}
            className="w-full py-3 border-2 border-dashed border-border text-muted-foreground font-medium rounded-lg hover:border-card hover:text-foreground transition-colors"
          >
            + Adicionar mais itens
          </button>
        </div>

        {/* Desconto PIX */}
        <div className="mx-4 p-3 bg-accent/10 rounded-lg border border-accent/30">
          <p className="text-accent text-sm font-medium text-center">
            Pague com PIX e ganhe 6% de desconto!
          </p>
        </div>
      </main>

      {/* Footer Fixo */}
      <footer className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-card">
        <div className="p-4 flex items-center justify-between">
          <button
            onClick={() => navigate("/identificacao")}
            className="flex-1 text-card-foreground font-semibold text-base"
          >
            Avançar
          </button>
          <span className="text-card-foreground font-bold text-lg">
            R$ {getTotal().toFixed(2).replace(".", ",")}
          </span>
        </div>
      </footer>
    </div>
  );
};

export default Cart;
