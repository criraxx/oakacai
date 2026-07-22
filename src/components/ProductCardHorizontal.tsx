import { useNavigate } from "react-router-dom";

interface ProductCardHorizontalProps {
  id: string;
  image: string;
  title: string;
  description?: string;
  price: string;
}

const ProductCardHorizontal = ({ id, image, title, description, price }: ProductCardHorizontalProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    // Converter preço string para número
    const precoNumerico = parseFloat(price.replace("R$", "").replace(",", ".").trim());
    
    navigate(`/produto/${id}`, {
      state: {
        produto: {
          nome: title,
          preco: precoNumerico,
          imagem: image,
          descricao: description || ""
        }
      }
    });
  };

  return (
    <div
      onClick={handleClick}
      className="flex gap-2 py-1 cursor-pointer tap-highlight press-effect rounded-lg"
    >
      <div className="flex-1 min-w-0">
        <h3 className="text-foreground text-xs font-medium leading-tight mb-0.5">{title}</h3>
        {description && (
          <p className="text-muted-foreground text-[10px] leading-tight line-clamp-2 mb-1">{description}</p>
        )}
        <p className="text-foreground font-bold text-xs">{price}</p>
      </div>
      <div className="w-16 h-16 rounded overflow-hidden flex-shrink-0">
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
