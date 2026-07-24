import acaiPuro from "@/assets/acai-puro.jpg";
import SectionTitle from "./SectionTitle";
import ProductCardHorizontal from "./ProductCardHorizontal";

const MonteSection = () => {
  return (
    <section className="mb-4">
      <SectionTitle title="¡Monta tu vaso a tu gusto!" />
      <div className="px-4">
        <ProductCardHorizontal
          id="monte-500ml"
          image={acaiPuro}
          title="Açaí puro — monta a tu gusto"
          description="Elige el tamaño (300 ml, 500 ml, 700 ml o 1 L) y potencia con todos los adicionales que quieras."
          price="Desde 25,90 €"
        />
      </div>
    </section>
  );
};

export default MonteSection;
