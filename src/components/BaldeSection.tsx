import SectionTitle from "./SectionTitle";
import ProductCardHorizontal from "./ProductCardHorizontal";
import balde22l from "@/assets/balde-22l.jpg";

const BaldeSection = () => {
  return (
    <section className="mb-4">
      <SectionTitle title="Balde - Açaí 2,2L" />
      <div className="px-4 space-y-2">
        <ProductCardHorizontal
          id="balde-22l"
          image={balde22l}
          title="BALDE 2,2 L"
          description="Escolha o açaí e os adicionais!"
          price="R$ 90,00"
        />
      </div>
    </section>
  );
};

export default BaldeSection;
