import acaiRoleta from "@/assets/acai-roleta.jpg";
import SectionTitle from "./SectionTitle";
import ProductCardHorizontal from "./ProductCardHorizontal";

const roletaProducts = [
  {
    id: "roleta-500g",
    image: acaiRoleta,
    title: "Ruleta de açaí puro — monta a tu gusto",
    description: "Elige el tamaño (500 g o 1 L) ¡y potencia con todos los adicionales que quieras!",
    price: "Desde 9,90 €"
  }
];

const RoletaSection = () => {
  return (
    <section className="mb-4">
      <SectionTitle title="Ruleta Açaí - ¡monta a tu gusto!" />
      <div className="px-4 space-y-2">
        {roletaProducts.map((product) => (
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

export default RoletaSection;
