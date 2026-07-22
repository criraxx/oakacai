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
  { id: "sonho-valsa-300", image: acaiSonhoValsa, title: "Copo trufado Sonho de Valsa - 300ml", description: "Leite condensado, Leite em pó, Sonho de Valsa, por cima creme de avelã", price: "R$ 32,90" },
  { id: "sonho-valsa-500", image: acaiSonhoValsa, title: "Copo Trufado Sonho de Valsa - 500ml", description: "Leite condensado, Leite em pó, Sonho de Valsa, por cima creme de avelã", price: "R$ 37,90" },
  { id: "sonho-valsa-700", image: acaiSonhoValsa, title: "Copo Trufado Sonho de Valsa - 700ml", description: "Leite condensado, Leite em pó, Sonho de Valsa, por cima creme de avelã", price: "R$ 42,90" },
  { id: "ouro-branco-300", image: acaiOuroBranco, title: "Copo Trufado Ouro Branco - 300ml", description: "Leite condensado, Leite em pó, Ouro Branco, por cima creme de Ninho", price: "R$ 32,90" },
  { id: "ouro-branco-500", image: acaiOuroBranco, title: "Copo Trufado Ouro Branco - 500ml", description: "Leite condensado, Leite em pó, Ouro Branco, por cima creme de Ninho", price: "R$ 37,90" },
  { id: "ouro-branco-700", image: acaiOuroBranco, title: "Copo Trufado Ouro Branco - 700ml", description: "Leite condensado, Leite em pó, Ouro Branco, por cima creme de Ninho", price: "R$ 42,90" },
  { id: "diamante-negro-300", image: acaiDiamanteNegro, title: "Copo Trufado Diamante Negro 300 ML", description: "Leite condensado, Leite em pó, diamante negro, por cima cobertura de chocolate", price: "R$ 24,00" },
  { id: "diamante-negro-400", image: acaiDiamanteNegro, title: "Copo Trufado Diamante Negro 400 ML", description: "Leite condensado, Leite em pó, diamante negro, por cima cobertura de chocolate", price: "R$ 29,00" },
  { id: "diamante-negro-700", image: acaiDiamanteNegro, title: "Copo Trufado Diamante Negro 700 ML", description: "Leite condensado, Leite em pó, diamante negro, por cima cobertura de chocolate", price: "R$ 35,00" },
  { id: "kitkat-300", image: acaiKitkat, title: "Copo Trufado Kit Kat 300ml", description: "Leite condensado, Leite em pó, Kit Kat, por cima creme de Nutella", price: "R$ 33,90" },
  { id: "kitkat-500", image: acaiKitkat, title: "Copo Trufado Kit Kat 500 Ml", description: "Leite condensado, Leite em pó, Kit Kat, por cima creme de Nutella", price: "R$ 38,90" },
  { id: "kitkat-700", image: acaiKitkat, title: "Copo Trufado Kit Kat 700 Ml", description: "Leite condensado, Leite em pó, Kit Kat, por cima creme de Nutella", price: "R$ 43,90" },
  { id: "laka-300", image: acaiLaka, title: "Copo trufado Laka 300 ml", description: "Leite condensado, Leite em pó, laka, por cima creme de ninho", price: "R$ 33,90" },
  { id: "laka-500", image: acaiLaka, title: "Copo trufado Laka 500 Ml", description: "Leite condensado, Leite em pó, laka, por cima creme de ninho", price: "R$ 38,90" },
  { id: "laka-700", image: acaiLaka, title: "Copo trufado Laka 700 Ml", description: "Leite condensado, Leite em pó, laka, por cima creme de ninho", price: "R$ 44,90" },
  { id: "ferreiro-300", image: acaiFerreiro, title: "Copo trufado Ferreiro 300 ML", description: "Creme de avelã, 2 bombons Ferrera, por cima nutella", price: "R$ 34,99" },
  { id: "ferreiro-500", image: acaiFerreiro, title: "Copo trufado Ferreiro 500 ML", description: "Creme de avelã, 2 bombons Ferrera, por cima nutella", price: "R$ 39,99" },
  { id: "ferreiro-700", image: acaiFerreiro, title: "Copo trufado Ferreiro 700 ML", description: "Creme de avelã, 2 bombons Ferrera, por cima nutella", price: "R$ 44,99" },
  { id: "rafaelo-300", image: acaiRafaelo, title: "Copo trufado Rafaelo 300 ML", description: "Creme raffaelo, 1 bombons raffaelo leite condensado", price: "R$ 34,99" },
  { id: "rafaelo-500", image: acaiRafaelo, title: "Copo trufado Rafaelo 500 ML", description: "Creme raffaelo, 2 bombons raffaelo, leite condensado", price: "R$ 39,99" },
  { id: "rafaelo-700", image: acaiRafaelo, title: "Copo trufado Rafaelo 700 ML", description: "Creme raffaelo, 2 bombons raffaelo, leite condensado", price: "R$ 44,99" }
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
