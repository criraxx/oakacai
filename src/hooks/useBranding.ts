import { useEffect, useState } from "react";
import logoOak from "@/assets/logo-oak-v2.png";
import heroBanner from "@/assets/hero-oak-banner.png";

export interface Branding {
  logo_url: string;
  banner_url: string;
  cor_borda_logo: string;
}

const DEFAULT_BRANDING: Branding = {
  logo_url: logoOak,
  banner_url: heroBanner,
  cor_borda_logo: "#F5E6D3",
};

let cache: Branding | null = null;
const listeners = new Set<(b: Branding) => void>();

async function fetchBranding(): Promise<Branding> {
  try {
    const res = await fetch(
      "https://bgcwtnrimreruswogffr.supabase.co/functions/v1/buscar-config"
    );
    const data = await res.json();
    return {
      logo_url: resolveImageUrl(data?.logo_url || DEFAULT_BRANDING.logo_url),
      banner_url: resolveImageUrl(data?.banner_url || DEFAULT_BRANDING.banner_url),
      cor_borda_logo: data?.cor_borda_logo || DEFAULT_BRANDING.cor_borda_logo,
    };
  } catch {
    return DEFAULT_BRANDING;
  }
}

export function refreshBranding() {
  fetchBranding().then((b) => {
    cache = b;
    listeners.forEach((l) => l(b));
  });
}

export function useBranding(): Branding {
  const [branding, setBranding] = useState<Branding>(cache ?? DEFAULT_BRANDING);

  useEffect(() => {
    listeners.add(setBranding);
    if (!cache) {
      fetchBranding().then((b) => {
        cache = b;
        listeners.forEach((l) => l(b));
      });
    }
    return () => {
      listeners.delete(setBranding);
    };
  }, []);

  return branding;
}
