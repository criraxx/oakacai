import { useEffect, useState } from "react";
import logoOak from "@/assets/logo-oak-v2.png.asset.json";
import heroBanner from "@/assets/hero-oak-banner.png.asset.json";

export interface Branding {
  logo_url: string;
  banner_url: string;
  cor_borda_logo: string;
}

const DEFAULT_BRANDING: Branding = {
  logo_url: logoOak.url,
  banner_url: heroBanner.url,
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
      logo_url: data?.logo_url || DEFAULT_BRANDING.logo_url,
      banner_url: data?.banner_url || DEFAULT_BRANDING.banner_url,
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
