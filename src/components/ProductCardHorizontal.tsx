import { useNavigate } from "react-router-dom";

interface ProductCardHorizontalProps {
  id: string;
  image: string;
  title: string;
  description?: string;
  price: string;
  badge?: string;
}

const ProductCardHorizontal = ({ id, image, title, description, price, badge }: ProductCardHorizontalProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    // Preço mostrado como "A partir de R$ X,XX" também é numérico após parse
    const numeric = parseFloat(
      price.replace("A partir de", "").replace("R$", "").replace(",", ".").trim()
    );

    navigate(`/produto/${id}`, {
      state: {
        produto: {
          nome: title,
          preco: numeric,
          imagem: image,
          descricao: description || "",
        },
      },
    });
  };

  return (
    <div
      onClick={handleClick}
      className="relative flex gap-3 p-3 cursor-pointer tap-highlight press-effect rounded-2xl bg-background border border-border/60 hover:border-border transition-colors"
    >
      <div className="flex-1 min-w-0">
        {badge && (
          <span
            className="inline-block text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full mb-1"
            style={{ backgroundColor: "var(--brand-accent, #22c55e)", color: "#0a0a0a" }}
          >
            {badge}
          </span>
        )}
        <h3 className="text-foreground text-sm font-semibold leading-tight mb-1">{title}</h3>
        {description && (
          <p className="text-muted-foreground text-xs leading-snug line-clamp-2 mb-1.5">
            {description}
          </p>
        )}
        <p className="text-foreground font-bold text-sm">{price}</p>
      </div>
      <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 shadow-sm">
        <img
          src={image}
          alt={title}
          loading="lazy"
          className="w-full h-full object-cover img-zoom"
        />
      </div>
    </div>
  );
};

export default ProductCardHorizontal;
