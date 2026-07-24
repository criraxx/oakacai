import heroBanner from "@/assets/hero-oak-banner.png";

const HeroBanner = () => {
  return (
    <div className="w-full">
      <img
        src={heroBanner}
        alt="Oak Açaí"
        className="w-full h-auto object-cover"
      />
    </div>
  );
};

export default HeroBanner;
