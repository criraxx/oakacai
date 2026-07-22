import { useState, useEffect } from "react";
import deliveryBannerAsset from "@/assets/delivery-banner.jpg.asset.json";
const deliveryBanner = deliveryBannerAsset.url;
const PromoBannerCarousel = () => {
  // Começa com a promoção (1) primeiro
  const [currentBanner, setCurrentBanner] = useState(1);
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBanner(prev => prev === 0 ? 1 : 0);
    }, 6000); // 6 segundos cada banner

    return () => clearInterval(interval);
  }, []);
  return <div className="mx-4 my-3">
      <div className="rounded-xl overflow-hidden">
        {/* Banner de Entrega Grátis */}
        <div className={`transition-all duration-500 ease-in-out ${currentBanner === 0 ? "block" : "hidden"}`}>
          <img src={deliveryBanner} alt="Entrega grátis em todas as regiões" className="w-2/3 mx-auto h-auto object-cover" />
        </div>

        {/* Banner de Promoção - mesmo tamanho do banner de entrega */}
        <div className={`transition-all duration-500 ease-in-out ${currentBanner === 1 ? "block" : "hidden"}`}>
          <div className="w-2/3 mx-auto bg-gradient-to-r from-purple-600 to-purple-800 rounded-xl py-3 px-4">
            <p className="text-white font-bold text-xs text-center leading-tight">💥 PROMOÇÃO UPGRADE 50%</p>
            <p className="text-purple-100 text-[10px] text-center leading-tight mt-1">
              Comprou R$50 ou mais?
            </p>
            <p className="text-yellow-300 font-bold text-[10px] text-center leading-tight mt-1">
              Desbloqueie 1 produto do cardápio pela METADE DO PREÇO!
            </p>
          </div>
        </div>
      </div>

      {/* Indicadores */}
      <div className="flex justify-center gap-2 mt-2">
        <button onClick={() => setCurrentBanner(0)} className={`w-1.5 h-1.5 rounded-full transition-all ${currentBanner === 0 ? "bg-primary w-3" : "bg-muted-foreground/50"}`} />
        <button onClick={() => setCurrentBanner(1)} className={`w-1.5 h-1.5 rounded-full transition-all ${currentBanner === 1 ? "bg-primary w-3" : "bg-muted-foreground/50"}`} />
      </div>
    </div>;
};
export default PromoBannerCarousel;