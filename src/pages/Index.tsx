import { useState } from "react";
import { useSearchParams } from "react-router-dom";
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
import MetadePrecoSection from "@/components/MetadePrecoSection";
import BaldeSection from "@/components/BaldeSection";
import PicoleSection from "@/components/PicoleSection";
import BebidasSection from "@/components/BebidasSection";
import FloatingCart from "@/components/FloatingCart";
import BottomNavigation from "@/components/BottomNavigation";
import CategoryTabs from "@/components/CategoryTabs";
import { useCart } from "@/contexts/CartContext";

const Index = () => {
  const [searchParams] = useSearchParams();
  const { getSubtotalSemPromocional } = useCart();
  const subtotal = getSubtotalSemPromocional();
  
  // Verificar se veio da promoção via query param
  const categoriaInicial = searchParams.get("categoria") === "metade-preco" && subtotal >= 50
    ? "🔥 METADE DO PREÇO (PROMOÇÃO)"
    : null;
  
  const [activeCategory, setActiveCategory] = useState<string | null>(categoriaInicial);
  
  // Categorias dinâmicas - Balde, Picolé e Bebidas no FINAL
  const categories = [
    "Promoção Combo Premium!",
    "Monte Seu Copo Do Seu Jeito",
    ...(subtotal >= 50 ? ["🔥 METADE DO PREÇO (PROMOÇÃO)"] : []),
    "Trufados",
    "Tradicionais",
    "Balde",
    "Picolé Trufado",
    "Bebidas"
  ];

  // Renderiza seções baseado na categoria ativa
  const renderSections = () => {
    switch (activeCategory) {
      case "Monte Seu Copo Do Seu Jeito":
        return <MonteSection />;
      case "🔥 METADE DO PREÇO (PROMOÇÃO)":
        // APENAS produtos pela metade do preço - NADA MAIS
        return <MetadePrecoSection />;
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
        // Padrão: mostra tudo (quando nenhuma categoria ou "Promoção Combo Premium!")
        return (
          <>
            <MostOrderedSection />
            <PromoComboSection />
            <MonteSection />
            <RoletaSection />
            {subtotal >= 50 && <MetadePrecoSection />}
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
    <div className="min-h-screen bg-background max-w-md mx-auto pb-32 page-enter">
      <HeroBanner />
      <Header />
      <InfoBar />
      <PromoBannerCarousel />
      <CategoryTabs categories={categories} onSelect={setActiveCategory} initialCategory={activeCategory} />
      <main>
        {renderSections()}
      </main>
      <FloatingCart />
      <BottomNavigation />
    </div>
  );
};

export default Index;
