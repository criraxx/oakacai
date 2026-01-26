import acaiPuro from "@/assets/acai-puro.jpg";
import acaiCombo300 from "@/assets/acai-combo-300.jpg";
import acaiCombo500 from "@/assets/acai-combo-500.jpg";
import acaiRafaelo from "@/assets/acai-rafaelo.png";
import ProductCardSmall from "./ProductCardSmall";
import SectionTitle from "./SectionTitle";

const mostOrderedProducts = [
  {
    id: "copo-500ml-puro",
    image: acaiPuro,
    title: "Copo 500ml Açaí Puro - monte do seu jeito",
    price: "R$ 29,90"
  },
  {
    id: "combo-300ml",
    image: acaiCombo300,
    title: "Combo premium 2 açaí 300ml + 4...",
    price: "R$ 49,90"
  },
  {
    id: "combo-500ml",
    image: acaiCombo500,
    title: "Combo premium 2 açaí 500ml + 4...",
    price: "R$ 59,90"
  },
  {
    id: "trufado-rafaelo-500",
    image: acaiRafaelo,
    title: "Copo trufado Rafaelo 500 ML",
    price: "R$ 39,99"
  },
  {
    id: "trufado-rafaelo-300",
    image: acaiRafaelo,
    title: "Copo trufado Rafaelo 300 ML",
    price: "R$ 34,99"
  },
  {
    id: "copo-300ml-puro",
    image: acaiPuro,
    title: "Copo 300ml Açaí Puro - Monte do seu jeito",
    price: "R$ 25,90"
  }
];

const MostOrderedSection = () => {
  return (
    <section className="py-4">
      <SectionTitle title="Os mais pedidos" />
      <div className="flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide">
        {mostOrderedProducts.map((product) => (
          <ProductCardSmall
            key={product.id}
            id={product.id}
            image={product.image}
            title={product.title}
            price={product.price}
          />
        ))}
      </div>
    </section>
  );
};

export default MostOrderedSection;
