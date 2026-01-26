import heroCover from "@/assets/hero-cover.png";

const HeroBanner = () => {
  return (
    <div className="w-full">
      <img 
        src={heroCover} 
        alt="Açaí Premium" 
        className="w-full h-auto object-cover"
      />
    </div>
  );
};

export default HeroBanner;
