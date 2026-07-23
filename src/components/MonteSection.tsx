import acaiPuroAsset from "@/assets/acai-puro.jpg.asset.json";
const acaiPuro = acaiPuroAsset.url;
import SectionTitle from "./SectionTitle";
import ProductCardHorizontal from "./ProductCardHorizontal";

const MonteSection = () => {
  return (
    <section className="mb-4">
      <SectionTitle title="Monte Seu Copo Do Seu Jeito !" />
      <div className="px-4">
        <ProductCardHorizontal
          id="monte-500ml"
          image={acaiPuro}
          title="Açaí puro — monte do seu jeito"
          description="Escolha o tamanho (300ml, 500ml, 700ml ou 1L) e turbine com quantos adicionais quiser."
          price="A partir de R$ 25,90"
        />
      </div>
    </section>
  );
};

export default MonteSection;
