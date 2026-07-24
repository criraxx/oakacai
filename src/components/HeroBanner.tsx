import heroBanner from "@/assets/hero-oak-banner-v2.png.asset.json";

const HeroBanner = () => {
  return (
    <div className="w-full">
      <img
        src={heroBanner.url}
        alt="Oak Açaí"
        className="w-full h-auto object-cover"
      />
    </div>
  );
};

export default HeroBanner;
