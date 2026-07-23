import acaiKids from "@/assets/acai-kids.jpg";
import acaiTradicional from "@/assets/acai-tradicional.jpg";
import acaiMega from "@/assets/acai-mega.jpg";
import acaiSensacao from "@/assets/acai-sensacao.jpg";
import acaiDaCasa from "@/assets/acai-da-casa.jpg";
import SectionTitle from "./SectionTitle";
import ProductCardHorizontal from "./ProductCardHorizontal";

const tradicionaisProducts = [
  { id: "kids-300", image: acaiKids, title: "Açaí Kids", description: "Leite condensado, Confete e chocobol!", price: "A partir de R$ 29,90" },
  { id: "tradicional-300", image: acaiTradicional, title: "Açaí Tradicional", description: "Leite condensado, leite em pó, banana e morango", price: "A partir de R$ 29,90" },
  { id: "mega-300", image: acaiMega, title: "Açaí Mega", description: "Leite condensado, banana, Morango, Confete e sucrilhos", price: "A partir de R$ 29,90" },
  { id: "da-casa-300", image: acaiDaCasa, title: "Açaí Da Casa", description: "Leite condensado, banana, paçoca", price: "A partir de R$ 29,90" },
  { id: "sensacao-300", image: acaiSensacao, title: "Açaí Sensação", description: "Nutella e morango", price: "A partir de R$ 31,90" }
];

const TradicionaisSection = () => {
  return (
    <section className="mb-4">
      <SectionTitle title="Copos Prontos Tradicionais" />
      <div className="px-4 space-y-2">
        {tradicionaisProducts.map((product) => (
          <ProductCardHorizontal
            key={product.id}
            id={product.id}
            image={product.image}
            title={product.title}
            description={product.description}
            price={product.price}
          />
        ))}
      </div>
    </section>
  );
};

export default TradicionaisSection;
