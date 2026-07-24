import SectionTitle from "./SectionTitle";
import ProductCardHorizontal from "./ProductCardHorizontal";
import picoleTrufado from "@/assets/picole-trufado.jpg";
const picoles = [
  { id: "picole-laka-oreo", title: "LAKA OREO", description: "Polo trufado sabor Laka Oreo", price: "2,90 €" },
  { id: "picole-morango-ninho", title: "FRESA CON NINHO", description: "Polo trufado sabor Fresa con Ninho", price: "2,90 €" },
  { id: "picole-choconinho", title: "CHOCONINHO", description: "Polo trufado sabor Choconinho", price: "2,90 €" }
];

const PicoleSection = () => {
  return (
    <section className="mb-4">
      <SectionTitle title="Polo Trufado" />
      <div className="px-4 space-y-2">
        {picoles.map((picole) => (
          <ProductCardHorizontal
            key={picole.id}
            id={picole.id}
            image={picoleTrufado}
            title={picole.title}
            description={picole.description}
            price={picole.price}
          />
        ))}
      </div>
    </section>
  );
};

export default PicoleSection;
