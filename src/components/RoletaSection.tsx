import acaiRoletaAsset from "@/assets/acai-roleta.jpg.asset.json";
const acaiRoleta = acaiRoletaAsset.url;
import SectionTitle from "./SectionTitle";
import ProductCardHorizontal from "./ProductCardHorizontal";

const roletaProducts = [
  {
    id: "roleta-500g",
    image: acaiRoleta,
    title: "Roleta de açaí puro — Monte Do seu jeito",
    description: "Escolha o tamanho (500g ou 1L) e turbine com quantos adicionais quiser!",
    price: "A partir de R$ 32,90"
  }
];

const RoletaSection = () => {
  return (
    <section className="mb-4">
      <SectionTitle title="Roleta Açaí - monte do seu jeito!" />
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
