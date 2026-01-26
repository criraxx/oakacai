import acaiCombo300 from "@/assets/acai-combo-300.jpg";
import acaiCombo500 from "@/assets/acai-combo-500.jpg";
import SectionTitle from "./SectionTitle";
import ProductCardHorizontal from "./ProductCardHorizontal";

const promoProducts = [
  {
    id: "promo-combo-300",
    image: acaiCombo300,
    title: "Combo premium 2 açaí 300ml + 4 complementos grátis",
    description: "Combo 2 Açaís 300 ml (4 complementos grátis cada). Leve 2 açaís de 300 ml com nossa base super cremosa e ainda...",
    price: "R$ 49,90"
  },
  {
    id: "promo-combo-500",
    image: acaiCombo500,
    title: "Combo premium 2 açaí 500ml + 4 complementos grátis",
    description: "Combo 2 Açaís 500 ml (4 complementos grátis cada). Leve 2 açaís de 500 ml com nossa base super cremosa e ainda...",
    price: "R$ 59,90"
  }
];

const PromoComboSection = () => {
  return (
    <section className="mb-4">
      <SectionTitle title="Promoção Combo Premium !" />
      <div className="px-4 space-y-2">
        {promoProducts.map((product) => (
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

export default PromoComboSection;
