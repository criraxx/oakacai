import acaiPuro from "@/assets/acai-puro.jpg";
import acaiCombo500 from "@/assets/acai-combo-500.jpg";
import acaiRafaelo from "@/assets/acai-rafaelo.jpg";
import ProductCardSmall from "./ProductCardSmall";
import SectionTitle from "./SectionTitle";

// 1 tarjeta por familia — el tamaño se elige dentro del producto.
const mostOrderedProducts = [
  {
    id: "monte-500ml",
    image: acaiPuro,
    title: "Açaí puro — monta a tu gusto",
    price: "Desde 25,90 €",
  },
  {
    id: "combo-500ml",
    image: acaiCombo500,
    title: "Combo premium 2 açaís + gratis",
    price: "Desde 49,90 €",
  },
  {
    id: "trufado-rafaelo-500",
    image: acaiRafaelo,
    title: "Vaso trufado Rafaelo",
    price: "Desde 34,99 €",
  },
];

const MostOrderedSection = () => {
  return (
    <section className="py-4">
      <SectionTitle title="Los más pedidos" />
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
