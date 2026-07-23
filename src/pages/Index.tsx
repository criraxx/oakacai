import { useState } from "react";
import { useLocation } from "react-router-dom";
import Header from "@/components/Header";
import HeroBanner from "@/components/HeroBanner";
import InfoBar from "@/components/InfoBar";
import PromoBannerCarousel from "@/components/PromoBannerCarousel";
import MostOrderedSection from "@/components/MostOrderedSection";
import PromoComboSection from "@/components/PromoComboSection";
import MonteSection from "@/components/MonteSection";
import RoletaSection from "@/components/RoletaSection";
import TrufadosSection from "@/components/TrufadosSection";
import TradicionaisSection from "@/components/TradicionaisSection";
import BaldeSection from "@/components/BaldeSection";
import PicoleSection from "@/components/PicoleSection";
import BebidasSection from "@/components/BebidasSection";
import BottomNavigation from "@/components/BottomNavigation";
import CategoryTabs from "@/components/CategoryTabs";
import DownsellModal from "@/components/DownsellModal";


const Index = () => {
  const location = useLocation();
  const [showDownsell, setShowDownsell] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Dispara downsell quando o usuário volta para a home tendo abandonado o PIX
  useEffect(() => {
    let flag = false;
    try { flag = sessionStorage.getItem("oak_pix_flow") === "1"; } catch {}
    const stateFlag = (location.state as any)?.showDownsell === true;
    if (flag || stateFlag) {
      setShowDownsell(true);
      try { sessionStorage.removeItem("oak_pix_flow"); } catch {}
    }
  }, [location.key]);



  const categories = [
    "Promoção Combo Premium!",
    "Monte Seu Copo Do Seu Jeito",
    "Trufados",
    "Tradicionais",
    "Balde",
    "Picolé Trufado",
    "Bebidas",
  ];

  const renderSections = () => {
    switch (activeCategory) {
      case "Monte Seu Copo Do Seu Jeito":
        return <MonteSection />;
      case "Trufados":
        return <TrufadosSection />;
      case "Tradicionais":
        return <TradicionaisSection />;
      case "Balde":
        return <BaldeSection />;
      case "Picolé Trufado":
        return <PicoleSection />;
      case "Bebidas":
        return <BebidasSection />;
      default:
        return (
          <>
            <MostOrderedSection />
            <PromoComboSection />
            <MonteSection />
            <RoletaSection />
            <TrufadosSection />
            <TradicionaisSection />
            <BaldeSection />
            <PicoleSection />
            <BebidasSection />
          </>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background max-w-md mx-auto pb-20 page-enter">
      <HeroBanner />
      <Header />
      <InfoBar />
      <PromoBannerCarousel />
      <CategoryTabs categories={categories} onSelect={setActiveCategory} initialCategory={activeCategory} />
      <main>{renderSections()}</main>
      <BottomNavigation />
      {showDownsell && <DownsellModal posicao="saida" triggerOnMount />}
    </div>
  );
};


export default Index;
