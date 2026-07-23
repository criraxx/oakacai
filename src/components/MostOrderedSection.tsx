import acaiPuroAsset from "@/assets/acai-puro.jpg.asset.json";
const acaiPuro = acaiPuroAsset.url;
import acaiCombo500Asset from "@/assets/acai-combo-500.jpg.asset.json";
const acaiCombo500 = acaiCombo500Asset.url;
import acaiRafaeloAsset from "@/assets/acai-rafaelo.jpg.asset.json";
const acaiRafaelo = acaiRafaeloAsset.url;
import ProductCardSmall from "./ProductCardSmall";
import SectionTitle from "./SectionTitle";

// 1 card por família — o tamanho é escolhido dentro do produto.
const mostOrderedProducts = [
  {
    id: "monte-500ml",
    image: acaiPuro,
    title: "Açaí puro — monte do seu jeito",
    price: "A partir de R$ 25,90",
  },
  {
    id: "combo-500ml",
    image: acaiCombo500,
    title: "Combo premium 2 açaís + grátis",
    price: "A partir de R$ 49,90",
  },
  {
    id: "trufado-rafaelo-500",
    image: acaiRafaelo,
    title: "Copo trufado Rafaelo",
    price: "A partir de R$ 34,99",
  },
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
