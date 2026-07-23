import acaiKidsAsset from "@/assets/acai-kids.jpg.asset.json";
const acaiKids = acaiKidsAsset.url;
import acaiTradicionalAsset from "@/assets/acai-tradicional.jpg.asset.json";
const acaiTradicional = acaiTradicionalAsset.url;
import acaiMegaAsset from "@/assets/acai-mega.jpg.asset.json";
const acaiMega = acaiMegaAsset.url;
import acaiSensacaoAsset from "@/assets/acai-sensacao.jpg.asset.json";
const acaiSensacao = acaiSensacaoAsset.url;
import acaiDaCasaAsset from "@/assets/acai-da-casa.jpg.asset.json";
const acaiDaCasa = acaiDaCasaAsset.url;
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
