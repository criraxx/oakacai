import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { ArrowLeft, Search, Sparkles, Plus, Minus, Flame } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
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

// Mapeamento de produtos por ID (fallback)
const produtosPorId: Record<string, { nome: string; preco: number; imagem: string; descricao: string }> = {
  "combo-500ml": {
    nome: "Combo premium 2 açaí 500ml + 4 complementos gratis",
    preco: 59.9,
    imagem: acaiCombo500,
    descricao:
      "Combo 2 Açaís 500 ml (4 complementos grátis cada)\nLeve 2 açaís de 500 ml com nossa base super cremosa e ainda ganhe 4 complementos grátis em cada copo.",
  },
  "combo-300ml": {
    nome: "Combo premium 2 açaí 300ml + 4 complementos gratis",
    preco: 49.9,
    imagem: acaiCombo500,
    descricao:
      "Combo 2 Açaís 300 ml (4 complementos grátis cada)\nLeve 2 açaís de 300 ml com nossa base super cremosa e ainda ganhe 4 complementos grátis em cada copo.",
  },
  "monte-300ml": {
    nome: "Copo 300ml Açaí Puro - Monte do seu jeito",
    preco: 25.9,
    imagem: acaiPuro,
    descricao: "Turbine seu copo do seu jeito com quantos adicionais quiser!",
  },
  "monte-500ml": {
    nome: "Copo 500ml Açaí Puro - monte do seu jeito",
    preco: 29.9,
    imagem: acaiPuro,
    descricao: "Turbine seu copo do seu jeito com quantos adicionais quiser!",
  },
  "monte-700ml": {
    nome: "Copo 700ml Açaí Puro - monte do seu jeito",
    preco: 34.9,
    imagem: acaiPuro,
    descricao: "Turbine seu copo do seu jeito com quantos adicionais quiser!",
  },
  "copo-500ml-puro": {
    nome: "Copo 500ml Açaí Puro - monte do seu jeito",
    preco: 29.9,
    imagem: acaiPuro,
    descricao: "Turbine seu copo do seu jeito com quantos adicionais quiser!",
  },
  "copo-300ml-puro": {
    nome: "Copo 300ml Açaí Puro - Monte do seu jeito",
    preco: 25.9,
    imagem: acaiPuro,
    descricao: "Turbine seu copo do seu jeito com quantos adicionais quiser!",
  },
  "trufado-rafaelo-500": {
    nome: "Copo trufado Rafaelo 500 ML",
    preco: 39.99,
    imagem: acaiPuro,
    descricao: "Açaí trufado com Rafaelo",
  },
  "trufado-rafaelo-300": {
    nome: "Copo trufado Rafaelo 300 ML",
    preco: 34.99,
    imagem: acaiPuro,
    descricao: "Açaí trufado com Rafaelo",
  },
};

const brl = (n: number) => `R$ ${n.toFixed(2).replace(".", ",")}`;

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
  const viewContentTracked = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { scrollY } = useScroll({ container: scrollRef });
  const heroScale = useTransform(scrollY, [0, 320], [1.08, 1.28]);
  const heroY = useTransform(scrollY, [0, 320], [0, -40]);
  const heroOpacity = useTransform(scrollY, [0, 260], [1, 0.35]);
  const titleY = useTransform(scrollY, [0, 260], [0, -30]);

  const isPromocional = location.state?.produto?.isPromocional || false;

  const getProdutoPadrao = () => {
    if (id && produtosPorId[id]) return produtosPorId[id];
    return { nome: id || "Produto", preco: 0, imagem: acaiPuro, descricao: "" };
  };
  const produto = location.state?.produto || getProdutoPadrao();

  const getTipoProduto = (): "combo" | "monte" | "pronto" => {
    const nome = produto.nome.toLowerCase();
    if (nome.includes("combo premium") || nome.includes("combo 2")) return "combo";
    if (
      nome.includes("picolé") ||
      nome.includes("picole") ||
      nome.includes("laka oreo") ||
      nome.includes("morango com ninho") ||
      nome.includes("choconinho") ||
      nome.includes("água") ||
      nome.includes("agua") ||
      nome.includes("coca") ||
      nome.includes("coca cola")
    )
      return "pronto";
    if (
      nome.includes("trufado") ||
      nome.includes("kids") ||
      nome.includes("tradicional") ||
      nome.includes("mega") ||
      nome.includes("da casa") ||
      nome.includes("sensação") ||
      nome.includes("sensacao")
    )
      return "pronto";
    if (nome.includes("balde")) return "monte";
    if (
      nome.includes("monte") ||
      nome.includes("seu copo") ||
      nome.includes("seu jeito") ||
      nome.includes("roleta") ||
      nome.includes("puro")
    )
      return "monte";
    return "pronto";
  };

  const tipoProduto = getTipoProduto();

  const getSecoes = (): SecaoComplemento[] => {
    switch (tipoProduto) {
      case "combo":
        return secoesCombo;
      case "monte":
        return secoesMonteCopo;
      default:
        return [];
    }
  };

  const secoesProduto = getSecoes();
  const temComplementos = secoesProduto.length > 0;

  useEffect(() => {
    if (!viewContentTracked.current && produto.nome && produto.preco) {
      trackViewContent({
        content_ids: [id || "produto"],
        content_name: produto.nome,
        content_type: "product",
        value: produto.preco,
      });
      viewContentTracked.current = true;
    }
  }, [id, produto.nome, produto.preco]);

  const handleQuantidadeChange = (itemId: string, quantidade: number) => {
    setQuantidades((prev) => ({ ...prev, [itemId]: quantidade }));
  };

  const calcularTotal = () => {
    let total = 0;
    secoesProduto.forEach((secao) => {
      secao.itens.forEach((item) => {
        const qtd = quantidades[item.id] || 0;
        if (item.preco && qtd > 0) total += item.preco * qtd;
      });
    });
    return total;
  };

  const totalAdicionais = calcularTotal();

  const secoesFiltradas = secoesProduto
    .map((secao) => ({
      ...secao,
      itens: secao.itens.filter((item) =>
        item.nome.toLowerCase().includes(pesquisa.toLowerCase())
      ),
    }))
    .filter((secao) => secao.itens.length > 0 || pesquisa === "");

  const handleAdicionarAoCarrinho = () => {
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

    const valorTotal = (produto.preco + totalAdicionais) * quantidadeProduto;
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

    trackAddToCart({
      content_ids: [id || "produto"],
      content_name: produto.nome,
      content_type: "product",
      value: valorTotal,
      num_items: qtdAdicionar,
    });
    gaTrackAddToCart({
      item_id: id || "produto",
      item_name: produto.nome,
      price: produto.preco + totalAdicionais,
      quantity: qtdAdicionar,
    });

    if (isPromocional) toast.success("Item promocional adicionado com sucesso!");
    setModalAberto(true);
  };

  const totalFinal =
    (produto.preco + totalAdicionais) * (isPromocional ? 1 : quantidadeProduto);

  return (
    <div className="product-premium-scope font-body-premium min-h-screen max-w-md mx-auto relative overflow-hidden">
      {/* Scroll container */}
      <div
        ref={scrollRef}
        className="h-screen overflow-y-auto overflow-x-hidden scrollbar-hide"
      >
        {/* HERO IMERSIVO */}
        <div className="relative h-[62vh] min-h-[420px] overflow-hidden">
          {/* Imagem parallax */}
          <motion.div
            style={{ scale: heroScale, y: heroY }}
            className="absolute inset-0"
          >
            {produto.imagem && (
              <img
                src={produto.imagem}
                alt={produto.nome}
                className="w-full h-full object-cover"
              />
            )}
          </motion.div>

          {/* Overlay para leitura */}
          <motion.div
            style={{ opacity: heroOpacity }}
            className="absolute inset-0"
            aria-hidden
          >
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/0 to-transparent" />
            <div
              className="absolute inset-x-0 bottom-0 h-2/3"
              style={{
                background:
                  "linear-gradient(180deg, transparent 0%, hsl(35 40% 96% / 0.6) 55%, hsl(var(--premium-bg)) 100%)",
              }}
            />
          </motion.div>

          {/* Barra superior flutuante */}
          <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 pt-4">
            <button
              onClick={() => navigate(-1)}
              className="w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md bg-white/70 border border-white/60 shadow-[var(--shadow-float)] active:scale-95 transition"
              aria-label="Voltar"
            >
              <ArrowLeft size={20} className="text-[hsl(var(--premium-ink))]" />
            </button>
            <span
              className="text-[10px] uppercase tracking-[0.28em] font-semibold px-3 py-1.5 rounded-full backdrop-blur-md bg-white/70 border border-white/60 shadow-[var(--shadow-float)]"
              style={{ color: "hsl(var(--premium-ink))" }}
            >
              Oak Açaí · Assinatura
            </span>
          </div>

          {/* Badge promocional */}
          {isPromocional && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-20 left-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-[hsl(var(--premium-accent))] to-[hsl(var(--premium-gold))] text-white text-xs font-bold shadow-[var(--shadow-float)]"
            >
              <Flame size={14} />
              -50% edição limitada
            </motion.div>
          )}

          {/* Título sobreposto */}
          <motion.div
            style={{ y: titleY }}
            className="absolute bottom-6 left-0 right-0 px-6 z-10"
          >
            <div className="flex items-center gap-2 mb-2 text-[11px] uppercase tracking-[0.22em] font-semibold text-[hsl(var(--premium-muted-ink))]">
              <Sparkles size={12} className="text-[hsl(var(--premium-gold))]" />
              {tipoProduto === "combo"
                ? "Combo assinatura"
                : tipoProduto === "monte"
                ? "Monte do seu jeito"
                : "Nossa carta"}
            </div>
            <h1 className="font-editorial text-[36px] leading-[1.05] text-[hsl(var(--premium-ink))] max-w-[92%]">
              {produto.nome}
            </h1>
          </motion.div>
        </div>

        {/* CARD DE INFO FLUTUANTE */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative -mt-10 mx-4 rounded-3xl p-6 border shadow-[var(--shadow-premium)]"
          style={{
            background: "hsl(var(--premium-surface))",
            borderColor: "hsl(35 30% 88%)",
          }}
        >
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-[hsl(var(--premium-muted-ink))] font-semibold mb-1">
                A partir de
              </p>
              {isPromocional && produto.precoOriginal && (
                <p className="text-[hsl(var(--premium-muted-ink))] line-through text-sm mb-0.5">
                  {brl(produto.precoOriginal)}
                </p>
              )}
              <p className="font-editorial text-4xl leading-none text-[hsl(var(--premium-ink))]">
                {brl(produto.preco)}
              </p>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[hsl(var(--premium-accent-soft))] text-[hsl(var(--premium-ink))] text-[11px] font-semibold uppercase tracking-widest">
                <Sparkles size={12} className="text-[hsl(var(--premium-accent))]" />
                Cremoso
              </span>
            </div>
          </div>

          <div
            className="h-px w-full mb-4"
            style={{ background: "linear-gradient(90deg, transparent, hsl(35 30% 82%), transparent)" }}
          />

          <p className="text-[15px] leading-relaxed whitespace-pre-line text-[hsl(var(--premium-muted-ink))]">
            {produto.descricao}
          </p>
        </motion.section>

        {/* PESQUISA + COMPLEMENTOS */}
        {temComplementos && (
          <div className="px-4 mt-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-editorial text-2xl text-[hsl(var(--premium-ink))]">
                Personalize sua experiência
              </h2>
            </div>
            <div className="relative mb-4">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[hsl(var(--premium-muted-ink))]"
              />
              <input
                type="text"
                value={pesquisa}
                onChange={(e) => setPesquisa(e.target.value)}
                placeholder="Buscar complemento…"
                className="w-full pl-11 pr-4 py-3 rounded-2xl border text-sm placeholder:text-[hsl(var(--premium-muted-ink))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--premium-accent))]"
                style={{
                  background: "hsl(var(--premium-surface))",
                  borderColor: "hsl(35 30% 88%)",
                  color: "hsl(var(--premium-ink))",
                }}
              />
            </div>
          </div>
        )}

        {temComplementos &&
          (pesquisa ? secoesFiltradas : secoesProduto).map((secao, i) => (
            <motion.div
              key={secao.id}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: i * 0.04 }}
              className="mx-4 mt-3 rounded-2xl overflow-hidden border shadow-[var(--shadow-float)]"
              style={{
                background: "hsl(var(--premium-surface))",
                borderColor: "hsl(35 30% 88%)",
              }}
            >
              <ComplementSection
                secao={secao}
                quantidades={quantidades}
                onQuantidadeChange={handleQuantidadeChange}
              />
            </motion.div>
          ))}

        {/* OBSERVAÇÕES */}
        <section className="px-4 mt-8">
          <h3 className="font-editorial text-xl text-[hsl(var(--premium-ink))] mb-2">
            Alguma observação?
          </h3>
          <p className="text-[13px] text-[hsl(var(--premium-muted-ink))] mb-3">
            Conte pra gente qualquer preferência especial — nós cuidamos do resto.
          </p>
          <textarea
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            placeholder="Ex: sem banana, extra leite condensado…"
            className="w-full h-24 px-4 py-3 rounded-2xl border text-sm placeholder:text-[hsl(var(--premium-muted-ink))] resize-none focus:outline-none focus:ring-2 focus:ring-[hsl(var(--premium-accent))]"
            style={{
              background: "hsl(var(--premium-surface))",
              borderColor: "hsl(35 30% 88%)",
              color: "hsl(var(--premium-ink))",
            }}
          />
        </section>

        {/* Espaço para footer fixo */}
        <div className="h-40" />
      </div>

      {/* FOOTER PREMIUM */}
      <motion.footer
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-30 px-4 pb-4 pt-3"
        style={{
          background:
            "linear-gradient(180deg, transparent 0%, hsl(var(--premium-bg) / 0.9) 40%, hsl(var(--premium-bg)) 100%)",
        }}
      >
        <div
          className="rounded-2xl p-3 flex items-center gap-3 border shadow-[var(--shadow-premium)]"
          style={{
            background: "hsl(var(--premium-surface))",
            borderColor: "hsl(35 30% 88%)",
          }}
        >
          {!isPromocional && (
            <div
              className="flex items-center gap-2 rounded-full px-1 py-1 border"
              style={{
                background: "hsl(var(--premium-accent-soft))",
                borderColor: "hsl(35 30% 82%)",
              }}
            >
              <button
                onClick={() => setQuantidadeProduto(Math.max(1, quantidadeProduto - 1))}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white text-[hsl(var(--premium-ink))] active:scale-95 transition"
                aria-label="Diminuir"
              >
                <Minus size={14} />
              </button>
              <span className="w-5 text-center font-semibold text-[hsl(var(--premium-ink))]">
                {quantidadeProduto}
              </span>
              <button
                onClick={() => setQuantidadeProduto(quantidadeProduto + 1)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white text-[hsl(var(--premium-ink))] active:scale-95 transition"
                aria-label="Aumentar"
              >
                <Plus size={14} />
              </button>
            </div>
          )}

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleAdicionarAoCarrinho}
            className="flex-1 relative overflow-hidden rounded-xl py-3 px-4 font-semibold text-white flex items-center justify-between shadow-[var(--shadow-float)]"
            style={{
              background: isPromocional
                ? "linear-gradient(135deg, hsl(var(--premium-gold)), hsl(var(--premium-accent)))"
                : "linear-gradient(135deg, hsl(var(--premium-ink)), hsl(270 40% 25%))",
            }}
          >
            <span className="flex items-center gap-2 text-[15px]">
              {isPromocional ? <Flame size={16} /> : <Sparkles size={16} />}
              {isPromocional ? "Adicionar promoção" : "Adicionar ao carrinho"}
            </span>
            <span className="font-editorial text-lg">{brl(totalFinal)}</span>
          </motion.button>
        </div>
      </motion.footer>

      <AddToCartModal
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        produto={{ nome: produto.nome, imagem: produto.imagem }}
      />
    </div>
  );
};

export default ProductDetail;
