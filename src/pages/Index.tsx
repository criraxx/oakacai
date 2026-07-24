import { useState, useEffect } from "react";
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

import BebidasSection from "@/components/BebidasSection";
import BottomNavigation from "@/components/BottomNavigation";
import CategoryTabs from "@/components/CategoryTabs";
import DownsellModal from "@/components/DownsellModal";


const Index = () => {
  const location = useLocation();
  const [showDownsell, setShowDownsell] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Dispara downsell cuando el usuario vuelve al inicio tras abandonar el pago
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
    "¡Promoción Combo Premium!",
    "Monta tu vaso a tu gusto",
    "Trufados",
    "Tradicionales",
    "Cubo",
    "Bebidas",
  ];

  const renderSections = () => {
    switch (activeCategory) {
      case "Monta tu vaso a tu gusto":
        return <MonteSection />;
      case "Trufados":
        return <TrufadosSection />;
      case "Tradicionales":
        return <TradicionaisSection />;
      case "Cubo":
        return <BaldeSection />;
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
