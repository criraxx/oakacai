import acaiLakaAsset from "@/assets/acai-laka.jpg.asset.json";
const acaiLaka = acaiLakaAsset.url;
import acaiKitkatAsset from "@/assets/acai-kitkat.jpg.asset.json";
const acaiKitkat = acaiKitkatAsset.url;
import acaiRafaeloAsset from "@/assets/acai-rafaelo.jpg.asset.json";
const acaiRafaelo = acaiRafaeloAsset.url;
import acaiFerreiroAsset from "@/assets/acai-ferreiro.jpg.asset.json";
const acaiFerreiro = acaiFerreiroAsset.url;
import acaiSonhoValsaAsset from "@/assets/acai-sonho-valsa.jpg.asset.json";
const acaiSonhoValsa = acaiSonhoValsaAsset.url;
import acaiOuroBrancoAsset from "@/assets/acai-ouro-branco.jpg.asset.json";
const acaiOuroBranco = acaiOuroBrancoAsset.url;
import acaiDiamanteNegroAsset from "@/assets/acai-diamante-negro.jpg.asset.json";
const acaiDiamanteNegro = acaiDiamanteNegroAsset.url;
import SectionTitle from "./SectionTitle";
import ProductCardHorizontal from "./ProductCardHorizontal";

const trufadosProducts = [
  { id: "sonho-valsa-300", image: acaiSonhoValsa, title: "Copo Trufado Sonho de Valsa", description: "Leite condensado, Leite em pó, Sonho de Valsa, por cima creme de avelã", price: "A partir de R$ 32,90" },
  { id: "ouro-branco-300", image: acaiOuroBranco, title: "Copo Trufado Ouro Branco", description: "Leite condensado, Leite em pó, Ouro Branco, por cima creme de Ninho", price: "A partir de R$ 32,90" },
  { id: "diamante-negro-300", image: acaiDiamanteNegro, title: "Copo Trufado Diamante Negro", description: "Leite condensado, Leite em pó, diamante negro, por cima cobertura de chocolate", price: "A partir de R$ 24,00" },
  { id: "kitkat-300", image: acaiKitkat, title: "Copo Trufado Kit Kat", description: "Leite condensado, Leite em pó, Kit Kat, por cima creme de Nutella", price: "A partir de R$ 33,90" },
  { id: "laka-300", image: acaiLaka, title: "Copo Trufado Laka", description: "Leite condensado, Leite em pó, laka, por cima creme de ninho", price: "A partir de R$ 33,90" },
  { id: "ferreiro-300", image: acaiFerreiro, title: "Copo Trufado Ferreiro", description: "Creme de avelã, 2 bombons Ferrera, por cima nutella", price: "A partir de R$ 34,99" },
  { id: "rafaelo-300", image: acaiRafaelo, title: "Copo Trufado Rafaelo", description: "Creme raffaelo, 1 bombom raffaelo, leite condensado", price: "A partir de R$ 34,99" }
];

const TrufadosSection = () => {
  return (
    <section className="mb-4">
      <SectionTitle title="Copos Trufados Premium" />
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
