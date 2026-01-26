import { useNavigate } from "react-router-dom";

interface ProductCardSmallProps {
  id: string;
  image: string;
  title: string;
  price: string;
}

const ProductCardSmall = ({ id, image, title, price }: ProductCardSmallProps) => {
  const navigate = useNavigate();

  return (
    <div 
      onClick={() => navigate(`/produto/${id}`)}
      className="flex-shrink-0 w-36 cursor-pointer hover:opacity-90 transition-opacity"
    >
      <div className="w-36 h-36 rounded-xl overflow-hidden mb-2 shadow-sm">
        <img 
          src={image} 
          alt={title} 
          className="w-full h-full object-cover"
        />
      </div>
      <p className="text-foreground text-sm leading-tight line-clamp-2 mb-1 font-medium">{title}</p>
      <p className="text-foreground font-bold text-sm">{price}</p>
    </div>
  );
};

export default ProductCardSmall;
