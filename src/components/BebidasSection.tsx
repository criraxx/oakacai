import SectionTitle from "./SectionTitle";
import ProductCardHorizontal from "./ProductCardHorizontal";
import cocaColaLata from "@/assets/bebidas/coca-cola-lata.jpg";
import aguaMineral from "@/assets/agua-mineral.png.asset.json";
import aguaDeCoco from "@/assets/agua-de-coco.jpg.asset.json";

const bebidas = [
  { id: "coca-cola-lata", title: "COCA-COLA LATA", description: "Coca-Cola Original 350 ml", price: "2,50 €", image: cocaColaLata },
  { id: "agua-de-coco", title: "AGUA DE COCO", description: "Agua de coco natural 330 ml", price: "2,50 €", image: aguaDeCoco.url },
  { id: "agua-mineral", title: "AGUA MINERAL", description: "Agua mineral sin gas 330 ml", price: "2,00 €", image: aguaMineral.url }
];

const BebidasSection = () => {
  return (
    <section className="mb-4">
      <SectionTitle title="Bebidas" />
      <div className="px-4 space-y-2">
        {bebidas.map((bebida) => (
          <ProductCardHorizontal
            key={bebida.id}
            id={bebida.id}
            image={bebida.image}
            title={bebida.title}
            description={bebida.description}
            price={bebida.price}
          />
        ))}
      </div>
    </section>
  );
};

export default BebidasSection;
