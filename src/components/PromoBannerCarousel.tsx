import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import deliveryBannerAsset from "@/assets/delivery-promo-banner.png";
import promo25BannerAsset from "@/assets/promo-25euros-banner.png";

const STATIC_BANNERS = [
  {
    id: "promo-25-euros",
    imagem: promo25BannerAsset,
    ordem: 0,
    intervalo_segundos: 6,
    acao_tipo: null as string | null,
    acao_valor: null as string | null,
  },
  {
    id: "delivery-gratis",
    imagem: deliveryBannerAsset,
    ordem: 1,
    intervalo_segundos: 6,
    acao_tipo: null as string | null,
    acao_valor: null as string | null,
  },
];

const PromoBannerCarousel = () => {
  const navigate = useNavigate();

  const banners = useMemo(() => STATIC_BANNERS, []);


  const [currentBanner, setCurrentBanner] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const autoplayRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const intervaloMs = (banners[currentBanner]?.intervalo_segundos ?? 6) * 1000;

  const startAutoplay = () => {
    stopAutoplay();
    if (banners.length <= 1) return;
    autoplayRef.current = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, intervaloMs);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [banners.length, currentBanner]);

  useEffect(() => {
    if (currentBanner >= banners.length) setCurrentBanner(0);
  }, [banners.length, currentBanner]);

  // Manejo de deslizamiento (swipe)
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

  const handleBannerClick = (banner: typeof banners[number]) => {
    if (Math.abs(touchDeltaX.current) > 5) return;
    if (!banner.acao_valor) return;
    if (banner.acao_tipo === "produto") navigate(`/produto/${banner.acao_valor}`);
    else if (banner.acao_tipo === "categoria") navigate(`/?categoria=${banner.acao_valor}`);
    else if (banner.acao_tipo === "url") window.open(banner.acao_valor, "_blank");
  };

  if (banners.length === 0) return null;

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
          {banners.map((b) => (
            <div
              key={b.id}
              className="w-full flex-shrink-0 cursor-pointer"
              onClick={() => handleBannerClick(b)}
            >
              <img
                src={b.imagem}
                alt="Banner promocional"
                draggable={false}
                className="w-full aspect-[2.5/1] object-cover rounded-xl pointer-events-none"
              />
            </div>
          ))}
        </div>
      </div>

      {banners.length > 1 && (
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
      )}
    </div>
  );
};

export default PromoBannerCarousel;
