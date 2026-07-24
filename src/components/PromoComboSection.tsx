import acaiCombo500 from "@/assets/acai-combo-500.jpg";
import SectionTitle from "./SectionTitle";
import ProductCardHorizontal from "./ProductCardHorizontal";

const PromoComboSection = () => {
  return (
    <section className="mb-4">
      <SectionTitle title="¡Promoción Combo Premium!" />
      <div className="px-4">
        <ProductCardHorizontal
          id="combo-500ml"
          image={acaiCombo500}
          title="Combo premium — 2 açaís + 4 complementos gratis"
          description="Llévate 2 açaís con nuestra base súper cremosa. Elige el tamaño (300 ml o 500 ml) dentro del producto."
          price="Desde 49,90 €"
          badge="Más vendido"
        />
      </div>
    </section>
  );
};

export default PromoComboSection;
