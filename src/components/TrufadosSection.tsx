import acaiLaka from "@/assets/acai-laka.jpg";
import acaiKitkat from "@/assets/acai-kitkat.jpg";
import acaiRafaelo from "@/assets/acai-rafaelo.jpg";
import acaiFerreiro from "@/assets/acai-ferreiro.jpg";
import acaiSonhoValsa from "@/assets/acai-sonho-valsa.jpg";
import acaiOuroBranco from "@/assets/acai-ouro-branco.jpg";
import acaiDiamanteNegro from "@/assets/acai-diamante-negro.jpg";
import SectionTitle from "./SectionTitle";
import ProductCardHorizontal from "./ProductCardHorizontal";

const trufadosProducts = [
  { id: "sonho-valsa-300", image: acaiSonhoValsa, title: "Vaso Trufado Sonho de Valsa", description: "Leche condensada, leche en polvo, Sonho de Valsa, y por encima crema de avellana", price: "Desde 8,90 €" },
  { id: "ouro-branco-300", image: acaiOuroBranco, title: "Vaso Trufado Ouro Branco", description: "Leche condensada, leche en polvo, Ouro Branco, y por encima crema de Ninho", price: "Desde 8,90 €" },
  { id: "diamante-negro-300", image: acaiDiamanteNegro, title: "Vaso Trufado Diamante Negro", description: "Leche condensada, leche en polvo, diamante negro, y por encima cobertura de chocolate", price: "Desde 7,90 €" },
  { id: "kitkat-300", image: acaiKitkat, title: "Vaso Trufado Kit Kat", description: "Leche condensada, leche en polvo, Kit Kat, y por encima crema de Nutella", price: "Desde 8,90 €" },
  { id: "laka-300", image: acaiLaka, title: "Vaso Trufado Laka", description: "Leche condensada, leche en polvo, Laka, y por encima crema de Ninho", price: "Desde 8,90 €" },
  { id: "ferreiro-300", image: acaiFerreiro, title: "Vaso Trufado Ferrero", description: "Crema de avellana, 2 bombones Ferrero, y por encima Nutella", price: "Desde 9,90 €" },
  { id: "rafaelo-300", image: acaiRafaelo, title: "Vaso Trufado Rafaelo", description: "Crema Rafaelo, 1 bombón Rafaelo, leche condensada", price: "Desde 9,90 €" }
];

const TrufadosSection = () => {
  return (
    <section className="mb-4">
      <SectionTitle title="Vasos Trufados Premium" />
      <div className="px-4 space-y-2">
        {trufadosProducts.map((product) => (
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

export default TrufadosSection;
