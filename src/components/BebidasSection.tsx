import SectionTitle from "./SectionTitle";
import ProductCardHorizontal from "./ProductCardHorizontal";
import cocaColaLata from "@/assets/bebidas/coca-cola-lata.jpg";
import aguaComGas from "@/assets/bebidas/agua-com-gas.jpg";
import aguaSemGas from "@/assets/bebidas/agua-sem-gas.jpg";

const bebidas = [
  { id: "coca-cola-lata", title: "COCA-COLA LATA", description: "Coca-Cola Original 350 ml", price: "2,50 €", image: cocaColaLata },
  { id: "agua-com-gas", title: "AGUA CON GAS", description: "Agua mineral con gas 500 ml", price: "1,90 €", image: aguaComGas },
  { id: "agua-sem-gas", title: "AGUA SIN GAS", description: "Agua mineral sin gas 500 ml", price: "1,50 €", image: aguaSemGas }
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
