import acaiCombo500Asset from "@/assets/acai-combo-500.jpg.asset.json";
const acaiCombo500 = acaiCombo500Asset.url;
import SectionTitle from "./SectionTitle";
import ProductCardHorizontal from "./ProductCardHorizontal";

const PromoComboSection = () => {
  return (
    <section className="mb-4">
      <SectionTitle title="Promoção Combo Premium !" />
      <div className="px-4">
        <ProductCardHorizontal
          id="combo-500ml"
          image={acaiCombo500}
          title="Combo premium — 2 açaís + 4 complementos grátis"
          description="Leve 2 açaís com nossa base super cremosa. Escolha o tamanho (300ml ou 500ml) dentro do produto."
          price="A partir de R$ 49,90"
          badge="Mais vendido"
        />
      </div>
    </section>
  );
};

export default PromoComboSection;
