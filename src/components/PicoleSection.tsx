import SectionTitle from "./SectionTitle";
import ProductCardHorizontal from "./ProductCardHorizontal";
import picoleTrufadoAsset from "@/assets/picole-trufado.jpg.asset.json";
const picoleTrufado = picoleTrufadoAsset.url;

const picoles = [
  { id: "picole-laka-oreo", title: "LAKA OREO", description: "Picolé trufado sabor Laka Oreo", price: "R$ 4,00" },
  { id: "picole-morango-ninho", title: "MORANGO COM NINHO", description: "Picolé trufado sabor Morango com Ninho", price: "R$ 4,00" },
  { id: "picole-choconinho", title: "CHOCONINHO", description: "Picolé trufado sabor Choconinho", price: "R$ 4,00" }
];

const PicoleSection = () => {
  return (
    <section className="mb-4">
      <SectionTitle title="Picolé Trufado" />
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
