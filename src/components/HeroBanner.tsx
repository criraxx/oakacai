import heroBanner from "@/assets/hero-oak-banner.png";

const HeroBanner = () => {
  return (
    <div className="w-full">
      <img
        src={heroBanner}
        alt="Oak Açaí - Compró 25 euros o más, desbloquea cualquier producto a mitad de precio"
        className="w-full h-auto object-cover"
      />
    </div>
  );
};

export default HeroBanner;
