import acaiKids from "@/assets/acai-kids.jpg";
import acaiTradicional from "@/assets/acai-tradicional.jpg";
import acaiMega from "@/assets/acai-mega.jpg";
import acaiSensacao from "@/assets/acai-sensacao.jpg";
import acaiDaCasa from "@/assets/acai-da-casa.jpg";
import SectionTitle from "./SectionTitle";
import ProductCardHorizontal from "./ProductCardHorizontal";

const tradicionaisProducts = [
  { id: "kids-300", image: acaiKids, title: "Açaí Kids", description: "¡Leche condensada, confeti y chocobol!", price: "Desde 7,90 €" },
  { id: "tradicional-300", image: acaiTradicional, title: "Açaí Tradicional", description: "Leche condensada, leche en polvo, plátano y fresa", price: "Desde 7,90 €" },
  { id: "mega-300", image: acaiMega, title: "Açaí Mega", description: "Leche condensada, plátano, fresa, confeti y copos de maíz", price: "Desde 7,90 €" },
  { id: "da-casa-300", image: acaiDaCasa, title: "Açaí Da Casa", description: "Leche condensada, plátano, paçoca", price: "Desde 7,90 €" },
  { id: "sensacao-300", image: acaiSensacao, title: "Açaí Sensación", description: "Nutella y fresa", price: "Desde 7,90 €" }
];

const TradicionaisSection = () => {
  return (
    <section className="mb-4">
      <SectionTitle title="Vasos Listos Tradicionales" />
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
