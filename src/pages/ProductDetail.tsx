import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { ArrowLeft, Search, X } from "lucide-react";
import { useBranding } from "@/hooks/useBranding";
import { secoesCombo, secoesMonteCopo, SecaoComplemento } from "@/data/complementosData";
import { resolveFamilia, Tamanho } from "@/data/tamanhosData";
import acaiCombo500Asset from "@/assets/acai-combo-500.jpg.asset.json";
const acaiCombo500 = acaiCombo500Asset.url;
import acaiPuroAsset from "@/assets/acai-puro.jpg.asset.json";
const acaiPuro = acaiPuroAsset.url;
import acaiRafaeloAsset from "@/assets/acai-rafaelo.jpg.asset.json";
const acaiRafaelo = acaiRafaeloAsset.url;
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
  "monte-1l": {
    nome: "Copo 1 Litro Açaí Puro - monte do seu jeito",
    preco: 44.90,
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
    imagem: acaiRafaelo,
    descricao: "Açaí trufado com Rafaelo"
  },
  "trufado-rafaelo-300": {
    nome: "Copo trufado Rafaelo 300 ML",
    preco: 34.99,
    imagem: acaiRafaelo,
    descricao: "Açaí trufado com Rafaelo"
  },
  "trufado-rafaelo-700": {
    nome: "Copo trufado Rafaelo 700 ML",
    preco: 46.99,
    imagem: acaiRafaelo,
    descricao: "Açaí trufado com Rafaelo"
  }
};

const ProductDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const { adicionarItem, atualizarItem, temItemPromocional, getSubtotalSemPromocional } = useCart();
  const itemEdicao: ItemCarrinho | undefined = location.state?.editandoItem;
  const modoEdicao = !!itemEdicao;
  const [quantidades, setQuantidades] = useState<Record<string, number>>(itemEdicao?.complementos ?? {});
  const [observacoes, setObservacoes] = useState(itemEdicao?.observacoes ?? "");
  const [pesquisa, setPesquisa] = useState("");
  const [quantidadeProduto, setQuantidadeProduto] = useState(itemEdicao?.quantidade ?? 1);
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
  
  const produtoBase = location.state?.produto || getProdutoPadrao();

  // Seletor de tamanho: se o produto pertence a uma família, oferece chips
  const familiaInfo = useMemo(() => (id ? resolveFamilia(id) : null), [id]);
  const [tamanhoSelecionado, setTamanhoSelecionado] = useState<Tamanho | null>(
    familiaInfo?.tamanhoAtual ?? null
  );

  // Ao trocar de tamanho, sobrescreve nome/preço do produto exibido
  const produto = useMemo(() => {
    if (tamanhoSelecionado && familiaInfo) {
      const alvo = produtosPorId[tamanhoSelecionado.id];
      if (alvo) {
        return {
          ...produtoBase,
          nome: alvo.nome,
          preco: alvo.preco,
          imagem: alvo.imagem || produtoBase.imagem,
          descricao: alvo.descricao || produtoBase.descricao,
        };
      }
      return { ...produtoBase, preco: tamanhoSelecionado.preco };
    }
    return produtoBase;
  }, [tamanhoSelecionado, familiaInfo, produtoBase]);
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
    const valorTotal = (produto.preco + totalAdicionais) * quantidadeProduto;

    if (modoEdicao && itemEdicao) {
      atualizarItem(itemEdicao.id, {
        complementos: quantidades,
        observacoes,
        totalAdicionais,
        quantidade: quantidadeProduto,
      });
      toast.success("Item atualizado!");
      navigate("/carrinho");
      return;
    }

    // Validações para itens promocionais
    if (isPromocional) {
      if (temItemPromocional()) {
        toast.error("Você já adicionou 1 item promocional. Limite de 1 por pedido!");
        return;
      }
      if (getSubtotalSemPromocional() < 50) {
        toast.error("O carrinho precisa ter R$50 ou mais para adicionar item promocional!");
        return;
      }
    }

    // Para itens promocionais, só permite adicionar 1
    const qtdAdicionar = isPromocional ? 1 : quantidadeProduto;
    
    const produtoIdFinal = tamanhoSelecionado?.id || id || "combo-500ml";
    const novoItem: ItemCarrinho = {
      id: "",
      produtoId: produtoIdFinal,
      produtoNome: produto.nome,
      produtoPreco: produto.preco,
      produtoImagem: produto.imagem,
      complementos: quantidades,
      observacoes: observacoes,
      totalAdicionais: totalAdicionais,
      isPromocional: isPromocional,
      quantidade: qtdAdicionar,
    };
    adicionarItem(novoItem);
    
    trackAddToCart({
      content_ids: [id || 'produto'],
      content_name: produto.nome,
      content_type: 'product',
      value: valorTotal,
      num_items: qtdAdicionar,
    });
    
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


  // Cor de destaque: usa a cor da borda da logo; se for a padrão (bege) ou vazia, cai no verde
  const DEFAULT_BEIGE = "#F5E6D3";
  const brandAccent =
    cor_borda_logo && cor_borda_logo.toUpperCase() !== DEFAULT_BEIGE.toUpperCase()
      ? cor_borda_logo
      : "#22c55e";

  return (
    <div
      className="min-h-screen bg-muted max-w-md mx-auto flex flex-col"
      style={{ ["--brand-accent" as any]: brandAccent }}
    >
      {/* Header transparente sobre a imagem */}
      <header className="absolute top-0 left-0 right-0 z-20 max-w-md mx-auto">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            aria-label="Voltar"
            className="w-10 h-10 flex items-center justify-center bg-black/50 backdrop-blur-md text-white rounded-full transition-transform hover:scale-105 active:scale-95 shadow-lg"
          >
            <ArrowLeft size={20} />
          </button>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="flex-1 pb-28">
        {/* Hero Image Premium */}
        {produto.imagem && (
          <div className="relative w-full aspect-square bg-background overflow-hidden">
            <img
              src={produto.imagem}
              alt={produto.nome}
              onClick={() => setImagemAmpliada(true)}
              className="w-full h-full object-cover cursor-zoom-in"
            />
            {/* Gradiente sutil para legibilidade do header */}
            <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/40 to-transparent pointer-events-none" />
            {isPromocional && (
              <div className="absolute top-4 right-4">
                <span className="bg-red-500 text-white text-xs px-3 py-1.5 rounded-full font-bold shadow-lg animate-pulse">
                  🔥 -50% PROMOÇÃO
                </span>
              </div>
            )}
          </div>
        )}

        {/* Card de informações do produto (elevado sobre a imagem) */}
        <div className="relative -mt-6 bg-background rounded-t-3xl px-5 pt-6 pb-5 shadow-[0_-8px_24px_rgba(0,0,0,0.06)]">
          <h2 className="text-foreground font-bold text-2xl leading-tight tracking-tight mb-2">
            {produto.nome}
          </h2>

          <div className="flex items-baseline gap-3 mb-3">
            <p
              className="font-bold text-2xl"
              style={{ color: brandAccent }}
            >
              R$ {produto.preco.toFixed(2).replace(".", ",")}
            </p>
            {isPromocional && produto.precoOriginal && (
              <p className="text-muted-foreground line-through text-base">
                R$ {produto.precoOriginal.toFixed(2).replace(".", ",")}
              </p>
            )}
          </div>

          <p className="text-foreground/75 text-sm leading-relaxed whitespace-pre-line">
            {produto.descricao}
          </p>

          {isPromocional && (
            <p className="mt-3 text-xs text-muted-foreground italic">
              Limite: 1 por pedido
            </p>
          )}
        </div>

        {/* Título de seção de personalização */}
        {temComplementos && (
          <div className="px-5 pt-5 pb-2 bg-background">
            <h3 className="text-foreground font-semibold text-base">
              Personalize seu pedido
            </h3>
          </div>
        )}

        {/* Campo de Pesquisa */}
        {temComplementos && (
          <div className="bg-background px-4 py-3">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={pesquisa}
                onChange={(e) => setPesquisa(e.target.value)}
                placeholder="Pesquise pelo nome"
                className="w-full pl-10 pr-4 py-2.5 bg-muted border border-border rounded-xl text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2"
                style={{ ["--tw-ring-color" as any]: brandAccent }}
              />
            </div>
          </div>
        )}

        {/* Seções de Complementos */}
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
            className="w-full h-20 px-3 py-2 bg-muted border border-border rounded-xl text-foreground text-sm placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2"
            style={{ ["--tw-ring-color" as any]: brandAccent }}
          />
        </div>
      </main>

      {/* Footer Fixo Premium */}
      <footer className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-background/95 backdrop-blur-md border-t border-border p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="flex items-center gap-3">
          {!isPromocional && (
            <div className="flex items-center gap-1 bg-muted rounded-full p-1">
              <button
                onClick={() => setQuantidadeProduto(Math.max(1, quantidadeProduto - 1))}
                className="w-9 h-9 flex items-center justify-center text-foreground rounded-full hover:bg-background transition-colors"
                aria-label="Diminuir"
              >
                −
              </button>
              <span className="w-6 text-center text-foreground font-semibold">
                {quantidadeProduto}
              </span>
              <button
                onClick={() => setQuantidadeProduto(quantidadeProduto + 1)}
                className="w-9 h-9 flex items-center justify-center text-foreground rounded-full hover:bg-background transition-colors"
                aria-label="Aumentar"
                style={{ backgroundColor: brandAccent, color: "#0a0a0a" }}
              >
                +
              </button>
            </div>
          )}

          <button
            onClick={handleAdicionarAoCarrinho}
            style={{ backgroundColor: brandAccent, color: "#0a0a0a" }}
            className="flex-1 py-3.5 font-bold rounded-full transition-transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-between px-5 shadow-lg"
          >
            <span className="text-sm">
              {modoEdicao ? "Salvar alterações" : isPromocional ? "Adicionar Promoção" : "Adicionar"}
            </span>
            <span className="text-sm font-extrabold">
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

      {/* Lightbox da imagem ampliada */}
      {imagemAmpliada && produto.imagem && (
        <div
          onClick={() => setImagemAmpliada(false)}
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <button
            onClick={(e) => { e.stopPropagation(); setImagemAmpliada(false); }}
            aria-label="Fechar"
            className="absolute top-4 right-4 w-11 h-11 rounded-full flex items-center justify-center shadow-lg press-effect"
            style={{ backgroundColor: cor_borda_logo, color: "#000" }}
          >
            <X size={24} strokeWidth={2.5} />
          </button>
          <img
            src={produto.imagem}
            alt={produto.nome}
            onClick={(e) => e.stopPropagation()}
            className="max-w-full max-h-full object-contain rounded-lg"
            style={{ border: `4px solid ${cor_borda_logo}` }}
          />
        </div>
      )}
    </div>
  );
};

export default ProductDetail;
