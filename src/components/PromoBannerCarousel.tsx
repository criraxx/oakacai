import { useState, useEffect, useRef } from "react";
import deliveryBannerAsset from "@/assets/delivery-banner.jpg.asset.json";
import promoUpgradeAsset from "@/assets/promo-upgrade-50.jpg.asset.json";

const deliveryBanner = deliveryBannerAsset.url;
const promoUpgradeBanner = promoUpgradeAsset.url;

const banners = [
  { src: promoUpgradeBanner, alt: "Promoção Upgrade 50%" },
  { src: deliveryBanner, alt: "Entrega grátis em todas as regiões" },
];

const PromoBannerCarousel = () => {
  const [currentBanner, setCurrentBanner] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const autoplayRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startAutoplay = () => {
    stopAutoplay();
    autoplayRef.current = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 6000);
  };

  const stopAutoplay = () => {
    if (autoplayRef.current) {
      clearInterval(autoplayRef.current);
      autoplayRef.current = null;
    }
  };

  useEffect(() => {
    startAutoplay();
    return stopAutoplay;
  }, []);

  // Swipe handling
  const touchStartX = useRef<number | null>(null);
  const touchDeltaX = useRef(0);
  const [dragOffset, setDragOffset] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleStart = (clientX: number) => {
    stopAutoplay();
    touchStartX.current = clientX;
    touchDeltaX.current = 0;
    setIsDragging(true);
  };

  const handleMove = (clientX: number) => {
    if (touchStartX.current === null) return;
    touchDeltaX.current = clientX - touchStartX.current;
    setDragOffset(touchDeltaX.current);
  };

  const handleEnd = () => {
    if (touchStartX.current === null) return;
    const width = containerRef.current?.offsetWidth ?? 1;
    const threshold = width * 0.2;
    if (touchDeltaX.current < -threshold && currentBanner < banners.length - 1) {
      setCurrentBanner((p) => p + 1);
    } else if (touchDeltaX.current > threshold && currentBanner > 0) {
      setCurrentBanner((p) => p - 1);
    }
    touchStartX.current = null;
    touchDeltaX.current = 0;
    setDragOffset(0);
    setIsDragging(false);
    startAutoplay();
  };

  return (
    <div className="mx-4 my-3">
      <div
        ref={containerRef}
        className="overflow-hidden rounded-xl touch-pan-y select-none"
        onTouchStart={(e) => handleStart(e.touches[0].clientX)}
        onTouchMove={(e) => handleMove(e.touches[0].clientX)}
        onTouchEnd={handleEnd}
        onMouseDown={(e) => handleStart(e.clientX)}
        onMouseMove={(e) => isDragging && handleMove(e.clientX)}
        onMouseUp={handleEnd}
        onMouseLeave={() => isDragging && handleEnd()}
      >
        <div
          className={`flex ${isDragging ? "" : "transition-transform duration-500 ease-out"}`}
          style={{
            transform: `translateX(calc(${-currentBanner * 100}% + ${dragOffset}px))`,
          }}
        >
          {banners.map((b, i) => (
            <div key={i} className="w-full flex-shrink-0">
              <img
                src={b.src}
                alt={b.alt}
                draggable={false}
                className="w-full h-auto object-contain rounded-xl pointer-events-none"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Indicadores */}
      <div className="flex justify-center gap-2 mt-2">
        {banners.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentBanner(i)}
            className={`h-1.5 rounded-full transition-all ${
              currentBanner === i ? "bg-primary w-3" : "bg-muted-foreground/50 w-1.5"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default PromoBannerCarousel;
