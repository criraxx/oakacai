import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { ArrowLeft, Search, X } from "lucide-react";
import { useBranding } from "@/hooks/useBranding";
import { secoesCombo, secoesMonteCopo, SecaoComplemento } from "@/data/complementosData";
import acaiCombo500 from "@/assets/acai-combo-500.jpg";
import acaiPuroAsset from "@/assets/acai-puro.jpg.asset.json";
const acaiPuro = acaiPuroAsset.url;
import ComplementSection from "@/components/ComplementSection";
import AddToCartModal from "@/components/AddToCartModal";
import { useCart, ItemCarrinho } from "@/contexts/CartContext";
import { trackViewContent, trackAddToCart } from "@/lib/metaPixel";
import { gaTrackAddToCart } from "@/lib/googleAnalytics";
import { toast } from "sonner";

// Mapeamento de produtos por ID
const produtosPorId: Record<string, { nome: string; preco: number; imagem: string; descricao: string }> = {
  "combo-500ml": {
    nome: "Combo premium 2 açaí 500ml + 4 complementos gratis",
    preco: 59.90,
    imagem: acaiCombo500,
    descricao: "Combo 2 Açaís 500 ml (4 complementos grátis cada)\nLeve 2 açaís de 500 ml com nossa base super cremosa e ainda ganhe 4 complementos grátis em cada copo."
  },
  "combo-300ml": {
    nome: "Combo premium 2 açaí 300ml + 4 complementos gratis",
    preco: 49.90,
    imagem: acaiCombo500,
    descricao: "Combo 2 Açaís 300 ml (4 complementos grátis cada)\nLeve 2 açaís de 300 ml com nossa base super cremosa e ainda ganhe 4 complementos grátis em cada copo."
  },
  "monte-300ml": {
    nome: "Copo 300ml Açaí Puro - Monte do seu jeito",
    preco: 25.90,
    imagem: acaiPuro,
    descricao: "Turbine seu copo do seu jeito com quantos adicionais quiser!"
  },
  "monte-500ml": {
    nome: "Copo 500ml Açaí Puro - monte do seu jeito",
    preco: 29.90,
    imagem: acaiPuro,
    descricao: "Turbine seu copo do seu jeito com quantos adicionais quiser!"
  },
  "monte-700ml": {
    nome: "Copo 700ml Açaí Puro - monte do seu jeito",
    preco: 34.90,
    imagem: acaiPuro,
    descricao: "Turbine seu copo do seu jeito com quantos adicionais quiser!"
  },
  // IDs usados na seção "Mais Pedidos"
  "copo-500ml-puro": {
    nome: "Copo 500ml Açaí Puro - monte do seu jeito",
    preco: 29.90,
    imagem: acaiPuro,
    descricao: "Turbine seu copo do seu jeito com quantos adicionais quiser!"
  },
  "copo-300ml-puro": {
    nome: "Copo 300ml Açaí Puro - Monte do seu jeito",
    preco: 25.90,
    imagem: acaiPuro,
    descricao: "Turbine seu copo do seu jeito com quantos adicionais quiser!"
  },
  "trufado-rafaelo-500": {
    nome: "Copo trufado Rafaelo 500 ML",
    preco: 39.99,
    imagem: acaiPuro,
    descricao: "Açaí trufado com Rafaelo"
  },
  "trufado-rafaelo-300": {
    nome: "Copo trufado Rafaelo 300 ML",
    preco: 34.99,
    imagem: acaiPuro,
    descricao: "Açaí trufado com Rafaelo"
  }
};

const ProductDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const { adicionarItem, temItemPromocional, getSubtotalSemPromocional } = useCart();
  const [quantidades, setQuantidades] = useState<Record<string, number>>({});
  const [observacoes, setObservacoes] = useState("");
  const [pesquisa, setPesquisa] = useState("");
  const [quantidadeProduto, setQuantidadeProduto] = useState(1);
  const [modalAberto, setModalAberto] = useState(false);
  const [imagemAmpliada, setImagemAmpliada] = useState(false);
  const { cor_borda_logo } = useBranding();
  const viewContentTracked = useRef(false);

  // Verificar se é um produto promocional
  const isPromocional = location.state?.produto?.isPromocional || false;

  // Dados do produto passados via state ou buscados por ID
  const getProdutoPadrao = () => {
    if (id && produtosPorId[id]) {
      return produtosPorId[id];
    }
    // Fallback baseado no ID da URL
    return {
      nome: id || "Produto",
      preco: 0,
      imagem: acaiPuro,
      descricao: ""
    };
  };
  
  const produto = location.state?.produto || getProdutoPadrao();

  // Determinar tipo de produto para exibir seções corretas
  const getTipoProduto = (): "combo" | "monte" | "pronto" => {
    const nome = produto.nome.toLowerCase();
    
    // Combo Premium (2 copos) - tem monte copo 1 e 2 + adicionais
    if (nome.includes("combo premium") || nome.includes("combo 2")) {
      return "combo";
    }
    
    // Picolés e Bebidas - produtos prontos, SEM complementos
    if (nome.includes("picolé") || nome.includes("picole") || 
        nome.includes("laka oreo") || nome.includes("morango com ninho") || nome.includes("choconinho") ||
        nome.includes("água") || nome.includes("agua") || 
        nome.includes("coca") || nome.includes("coca cola")) {
      return "pronto";
    }
    
    // Trufados e Tradicionais - produtos prontos, SEM complementos
    if (nome.includes("trufado") || nome.includes("kids") || nome.includes("tradicional") || 
        nome.includes("mega") || nome.includes("da casa") || nome.includes("sensação") ||
        nome.includes("sensacao")) {
      return "pronto";
    }
    
    // Balde - tem adicionais
    if (nome.includes("balde")) {
      return "monte";
    }
    
    // Monte do seu jeito e Roleta - 1 copo com adicionais
    if (nome.includes("monte") || nome.includes("seu copo") || nome.includes("seu jeito") || 
        nome.includes("roleta") || nome.includes("puro")) {
      return "monte";
    }
    
    // Default: produto pronto
    return "pronto";
  };

  const tipoProduto = getTipoProduto();
  
  // Selecionar seções baseado no tipo de produto
  const getSecoes = (): SecaoComplemento[] => {
    switch (tipoProduto) {
      case "combo":
        return secoesCombo;
      case "monte":
        return secoesMonteCopo;
      case "pronto":
        return []; // Sem complementos
      default:
        return [];
    }
  };

  const secoesProduto = getSecoes();
  const temComplementos = secoesProduto.length > 0;

  // Meta Pixel: ViewContent - Disparar apenas uma vez por visualização
  useEffect(() => {
    if (!viewContentTracked.current && produto.nome && produto.preco) {
      trackViewContent({
        content_ids: [id || 'produto'],
        content_name: produto.nome,
        content_type: 'product',
        value: produto.preco,
      });
      viewContentTracked.current = true;
    }
  }, [id, produto.nome, produto.preco]);


  const handleQuantidadeChange = (itemId: string, quantidade: number) => {
    setQuantidades((prev) => ({
      ...prev,
      [itemId]: quantidade,
    }));
  };

  // Calcular total dos adicionais
  const calcularTotal = () => {
    let total = 0;
    secoesProduto.forEach((secao) => {
      secao.itens.forEach((item) => {
        const qtd = quantidades[item.id] || 0;
        if (item.preco && qtd > 0) {
          total += item.preco * qtd;
        }
      });
    });
    return total;
  };

  const totalAdicionais = calcularTotal();

  // Filtrar seções baseado na pesquisa
  const secoesFiltradas = secoesProduto.map(secao => ({
    ...secao,
    itens: secao.itens.filter(item => 
      item.nome.toLowerCase().includes(pesquisa.toLowerCase())
    )
  })).filter(secao => secao.itens.length > 0 || pesquisa === "");

  const handleAdicionarAoCarrinho = () => {
    // Validações para itens promocionais
    if (isPromocional) {
      // Verificar se já tem item promocional
      if (temItemPromocional()) {
        toast.error("Você já adicionou 1 item promocional. Limite de 1 por pedido!");
        return;
      }
      
      // Verificar se ainda tem R$50+ no carrinho
      if (getSubtotalSemPromocional() < 50) {
        toast.error("O carrinho precisa ter R$50 ou mais para adicionar item promocional!");
        return;
      }
    }

    const valorTotal = (produto.preco + totalAdicionais) * quantidadeProduto;
    
    // Para itens promocionais, só permite adicionar 1
    const qtdAdicionar = isPromocional ? 1 : quantidadeProduto;
    
    for (let i = 0; i < qtdAdicionar; i++) {
      const novoItem: ItemCarrinho = {
        id: "",
        produtoId: id || "combo-500ml",
        produtoNome: produto.nome,
        produtoPreco: produto.preco,
        produtoImagem: produto.imagem,
        complementos: quantidades,
        observacoes: observacoes,
        totalAdicionais: totalAdicionais,
        isPromocional: isPromocional,
      };
      adicionarItem(novoItem);
    }
    
    // Meta Pixel: AddToCart - Valor final considera produto + complementos
    trackAddToCart({
      content_ids: [id || 'produto'],
      content_name: produto.nome,
      content_type: 'product',
      value: valorTotal,
      num_items: qtdAdicionar,
    });
    
    // Google Analytics: add_to_cart
    gaTrackAddToCart({
      item_id: id || 'produto',
      item_name: produto.nome,
      price: produto.preco + totalAdicionais,
      quantity: qtdAdicionar,
    });
    
    if (isPromocional) {
      toast.success("Item promocional adicionado com sucesso!");
    }
    
    setModalAberto(true);
  };

  return (
    <div className="min-h-screen bg-muted max-w-md mx-auto flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 flex items-center justify-center text-foreground hover:bg-muted rounded-full transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-foreground font-semibold text-base">
            {temComplementos ? "Personalize seu Açaí" : "Detalhes do Produto"}
          </h1>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="flex-1 pb-24">
        {/* Seção do Produto */}
        <div className="bg-background p-4 border-b border-border">
          {/* Badge promocional */}
          {isPromocional && (
            <div className="mb-3 flex items-center gap-2">
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold animate-pulse">
                🔥 -50% PROMOÇÃO
              </span>
              <span className="text-yellow-400 text-xs">
                (Limite: 1 por pedido)
              </span>
            </div>
          )}
          
          <div className="flex gap-4">
            {/* Imagem do Produto */}
            {produto.imagem && (
              <div className="flex-shrink-0 relative">
                <img 
                  src={produto.imagem} 
                  alt={produto.nome}
                  className="w-28 h-28 object-cover rounded-lg"
                />
                {isPromocional && (
                  <div className="absolute inset-0 bg-gradient-to-t from-green-500/40 to-transparent rounded-lg" />
                )}
              </div>
            )}
            {/* Informações do Produto */}
            <div className="flex-1">
              <h2 className="text-foreground font-bold text-lg leading-tight mb-1">
                {produto.nome}
              </h2>
              {isPromocional && produto.precoOriginal && (
                <p className="text-muted-foreground line-through text-sm">
                  R$ {produto.precoOriginal.toFixed(2).replace(".", ",")}
                </p>
              )}
              <p className={`font-semibold text-base mb-2 ${isPromocional ? "text-green-400" : "text-foreground"}`}>
                R$ {produto.preco.toFixed(2).replace(".", ",")}
              </p>
              <p className="text-foreground/80 text-sm leading-relaxed whitespace-pre-line">
                {produto.descricao}
              </p>
            </div>
          </div>
        </div>

        {/* Campo de Pesquisa - só mostra se tem complementos */}
        {temComplementos && (
          <div className="bg-background px-4 py-3 border-b border-border">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={pesquisa}
                onChange={(e) => setPesquisa(e.target.value)}
                placeholder="Pesquise pelo nome"
                className="w-full pl-10 pr-4 py-2 bg-muted border border-border rounded-lg text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-secondary"
              />
            </div>
          </div>
        )}

        {/* Seções de Complementos - só mostra se tem complementos */}
        {temComplementos && (pesquisa ? secoesFiltradas : secoesProduto).map((secao) => (
          <ComplementSection
            key={secao.id}
            secao={secao}
            quantidades={quantidades}
            onQuantidadeChange={handleQuantidadeChange}
          />
        ))}

        {/* Campo de Observações */}
        <div className="px-4 py-4 bg-background">
          <label className="block text-foreground text-sm font-medium mb-2">
            Observações
          </label>
          <textarea
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            placeholder="Alguma observação para o seu pedido?"
            className="w-full h-20 px-3 py-2 bg-muted border border-border rounded-lg text-foreground text-sm placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-secondary"
          />
        </div>
      </main>

      {/* Footer Fixo */}
      <footer className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-background border-t border-border p-4">
        <div className="flex items-center gap-3">
          {/* Seletor de Quantidade - esconde para itens promocionais */}
          {!isPromocional && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setQuantidadeProduto(Math.max(1, quantidadeProduto - 1))}
                className="w-8 h-8 flex items-center justify-center text-foreground hover:bg-muted rounded-full transition-colors border border-border"
              >
                −
              </button>
              <span className="w-6 text-center text-foreground font-medium">
                {quantidadeProduto}
              </span>
              <button
                onClick={() => setQuantidadeProduto(quantidadeProduto + 1)}
                className="w-8 h-8 flex items-center justify-center text-foreground hover:bg-muted rounded-full transition-colors border border-border"
              >
                +
              </button>
            </div>
          )}

          {/* Botão Adicionar */}
          <button
            onClick={handleAdicionarAoCarrinho}
            className={`flex-1 py-3 font-semibold rounded-lg transition-colors flex items-center justify-between px-4 ${
              isPromocional 
                ? "bg-green-500 text-white hover:bg-green-600" 
                : "bg-foreground text-background hover:bg-foreground/90"
            }`}
          >
            <span>{isPromocional ? "🔥 Adicionar Promoção" : "Adicionar"}</span>
            <span>
              R$ {((produto.preco + totalAdicionais) * (isPromocional ? 1 : quantidadeProduto)).toFixed(2).replace(".", ",")}
            </span>
          </button>
        </div>
      </footer>

      {/* Modal de confirmação */}
      <AddToCartModal
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        produto={{ nome: produto.nome, imagem: produto.imagem }}
      />
    </div>
  );
};

export default ProductDetail;
