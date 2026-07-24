import { useCart } from "@/contexts/CartContext";
import { useNavigate } from "react-router-dom";
import SectionTitle from "./SectionTitle";
import { todosProdutos } from "@/data/todosProutos";
import { toast } from "sonner";

const MetadePrecoSection = () => {
  const { getSubtotalSemPromocional, temItemPromocional } = useCart();
  const navigate = useNavigate();
  
  const subtotal = getSubtotalSemPromocional();
  const isVisible = subtotal >= 25;
  const jaTemPromocional = temItemPromocional();

  // Filtrar productos elegibles (excluir bebidas, polos y cubos)
  const produtosElegiveis = todosProdutos.filter(product => {
    const categoria = product.categoria?.toLowerCase() || "";
    const titulo = product.title.toLowerCase();

    if (categoria.includes("bebida") ||
        categoria.includes("picolé") ||
        categoria.includes("balde") ||
        titulo.includes("água") ||
        titulo.includes("coca") ||
        titulo.includes("picolé") ||
        titulo.includes("balde")) {
      return false;
    }
    return true;
  });

  // Solo ofrece el producto MÁS BARATO elegible a mitad de precio
  const productoMasBarato = [...produtosElegiveis].sort((a, b) => a.price - b.price)[0];
  const produtosParaMostrar = productoMasBarato ? [productoMasBarato] : [];

  if (!isVisible) {
    return null;
  }

  const handleProductClick = (product: typeof todosProdutos[0]) => {
    if (jaTemPromocional) {
      toast.error("Ya has añadido 1 artículo promocional. ¡Límite de 1 por pedido!");
      return;
    }

    const precoPromocional = product.price / 2;

    navigate(`/produto/promo-${product.id}`, {
      state: {
        produto: {
          nome: product.title,
          preco: precoPromocional,
          imagem: product.image,
          descricao: product.description,
          isPromocional: true,
          precoOriginal: product.price,
        },
      },
    });
  };

  return (
    <section className="mb-4 animate-fade-in" id="metade-preco">
      <SectionTitle title="🔥 MITAD DE PRECIO (PROMOCIÓN)" />
      
      <div className="mx-4 mb-3 p-3 bg-green-500/20 border border-green-500/50 rounded-lg">
        <p className="text-green-400 text-xs text-center font-bold">
          🎉 ¡ENHORABUENA! ¡Has desbloqueado la promoción!
        </p>
        <p className="text-green-300 text-[10px] text-center mt-1">
          ¡Elige 1 producto de abajo a MITAD DE PRECIO!
        </p>
      </div>

      {jaTemPromocional && (
        <div className="mx-4 mb-2 p-2 bg-yellow-500/20 border border-yellow-500/50 rounded-lg">
          <p className="text-yellow-400 text-xs text-center font-medium">
            ⚠️ Ya has añadido 1 artículo promocional. ¡Límite de 1 por pedido!
          </p>
        </div>
      )}

      <div className="px-4 space-y-2">
        {produtosParaMostrar.map((product) => {
          const precoPromocional = product.price / 2;
          
          return (
            <div
              key={product.id}
              onClick={() => handleProductClick(product)}
              className={`flex gap-3 p-2 rounded-lg border border-green-500/30 bg-green-500/5 cursor-pointer transition-all ${
                jaTemPromocional 
                  ? "opacity-50 cursor-not-allowed" 
                  : "hover:bg-green-500/10 hover:border-green-500/50"
              }`}
            >
              <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 relative">
                <img
                  src={product.image}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-0 right-0 bg-red-500 text-white text-[8px] px-1 py-0.5 rounded-bl font-bold">
                  -50%
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-foreground text-xs font-medium leading-tight mb-0.5 line-clamp-2">
                  {product.title}
                </h3>
                <p className="text-muted-foreground text-[10px] leading-tight line-clamp-1 mb-1">
                  {product.description}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground line-through text-[10px]">
                    {product.price.toFixed(2).replace(".", ",")} €
                  </span>
                  <span className="text-green-400 font-bold text-sm">
                    {precoPromocional.toFixed(2).replace(".", ",")} €
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default MetadePrecoSection;
