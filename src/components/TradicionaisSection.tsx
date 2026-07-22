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
  { id: "kids-300", image: acaiKids, title: "Açaí Kids 300ml", description: "Leite condensado, Confete e chocobol!", price: "R$ 29,90" },
  { id: "kids-500", image: acaiKids, title: "Açaí Kids 500ml", description: "Leite condensado, Confete e chocobol!", price: "R$ 34,90" },
  { id: "kids-700", image: acaiKids, title: "Açaí kids 700ml", description: "Leite condensado, Confete e chocobol!", price: "R$ 39,90" },
  { id: "tradicional-300", image: acaiTradicional, title: "Açaí Tradicional 300ml", description: "Leite condensado, leite em pó, banana e morango", price: "R$ 29,90" },
  { id: "tradicional-500", image: acaiTradicional, title: "Açaí Tradicional 500ml", description: "Leite condensado, leite em pó, banana e morango", price: "R$ 34,90" },
  { id: "tradicional-700", image: acaiTradicional, title: "Açaí Tradicional 700ml", description: "Leite condensado, leite em pó, banana e morango", price: "R$ 39,90" },
  { id: "mega-300", image: acaiMega, title: "Açaí Mega 300ml", description: "Leite condensado, banana, Morango, Confete e sucrilhos", price: "R$ 29,90" },
  { id: "mega-500", image: acaiMega, title: "Açaí Mega 500ml", description: "Leite condensado, banana, Morango, Confete e sucrilhos", price: "R$ 34,90" },
  { id: "mega-700", image: acaiMega, title: "Açaí Mega 700ml", description: "Leite condensado, banana, Morango, Confete e sucrilhos", price: "R$ 39,90" },
  { id: "da-casa-300", image: acaiDaCasa, title: "Açaí Da Casa 300ml", description: "Leite condensado, banana, paçoca", price: "R$ 29,90" },
  { id: "da-casa-500", image: acaiDaCasa, title: "Açaí Da Casa 500ml", description: "Leite condensado, banana e chocobol!", price: "R$ 34,90" },
  { id: "da-casa-700", image: acaiDaCasa, title: "Açaí Da Casa 700ml", description: "Leite condensado, banana e chocobol!", price: "R$ 39,90" },
  { id: "sensacao-300", image: acaiSensacao, title: "Açaí Sensação 300ml", description: "Nutella e morango", price: "R$ 31,90" },
  { id: "sensacao-500", image: acaiSensacao, title: "Açaí sensação 500ml", description: "Nutella e morango", price: "R$ 36,90" },
  { id: "sensacao-700", image: acaiSensacao, title: "Açaí sensação 700ml", description: "Nutella e morango", price: "R$ 41,90" }
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
