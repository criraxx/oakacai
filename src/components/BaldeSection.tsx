import SectionTitle from "./SectionTitle";
import ProductCardHorizontal from "./ProductCardHorizontal";
import balde22l from "@/assets/balde-22l.jpg";
const BaldeSection = () => {
  return (
    <section className="mb-4">
      <SectionTitle title="Cubo - Açaí 2,2 L" />
      <div className="px-4 space-y-2">
        <ProductCardHorizontal
          id="balde-22l"
          image={balde22l}
          title="CUBO 2,2 L"
          description="¡Elige el açaí y los adicionales!"
          price="31,90 €"
        />
      </div>
    </section>
  );
};

export default BaldeSection;
