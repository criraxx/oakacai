import { useBranding } from "@/hooks/useBranding";

const HeroBanner = () => {
  const { banner_url } = useBranding();

  return (
    <div className="w-full">
      <img
        src={banner_url}
        alt="Oak Açaí - Sabor, qualidade, energia em cada colherada"
        className="w-full h-auto object-cover"
      />
    </div>
  );
};

export default HeroBanner;
