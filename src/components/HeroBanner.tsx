import heroBanner from "@/assets/hero-oak-banner.png.asset.json";

const HeroBanner = () => {
  return (
    <div className="w-full">
      <img
        src={heroBanner.url}
        alt="Oak Açaí - Sabor, qualidade, energia em cada colherada"
        className="w-full h-auto object-cover"
      />
    </div>
  );
};

export default HeroBanner;
