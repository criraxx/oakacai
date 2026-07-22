import acaiPuroAsset from "@/assets/acai-puro.jpg.asset.json";
const acaiPuro = acaiPuroAsset.url;
import SectionTitle from "./SectionTitle";
import ProductCardHorizontal from "./ProductCardHorizontal";

const monteProducts = [
  {
    id: "monte-300ml",
    image: acaiPuro,
    title: "Copo 300ml Açaí Puro - Monte do seu jeito",
    description: "Turbine seu copo do seu jeito com quantos adicionais quiser !",
    price: "R$ 25,90"
  },
  {
    id: "monte-500ml",
    image: acaiPuro,
    title: "Copo 500ml Açaí Puro - monte do seu jeito",
    description: "Turbine seu copo do seu jeito com quantos adicionais quiser !",
    price: "R$ 29,90"
  },
  {
    id: "monte-700ml",
    image: acaiPuro,
    title: "Copo 700ml Açaí Puro - monte do seu jeito",
    description: "Turbine seu copo do seu jeito com quantos adicionais quiser !",
    price: "R$ 34,90"
  }
];

const MonteSection = () => {
  return (
    <section className="mb-4">
      <SectionTitle title="Monte Seu Copo Do Seu Jeito !" />
      <div className="px-4 space-y-2">
        {monteProducts.map((product) => (
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

export default MonteSection;
