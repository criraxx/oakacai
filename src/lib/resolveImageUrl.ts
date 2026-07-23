/**
 * Garante que URLs de assets Lovable funcionem em qualquer domínio
 * (preview, publicado ou domínio customizado), convertendo caminhos
 * relativos /__l5e em URLs absolutas apontando para o origin estável
 * do projeto no ambiente Lovable.
 */
export const LOVABLE_PREVIEW_ORIGIN = "https://id-preview--d5b028a3-53ac-44c9-8acb-1ecbc0ecedab.lovable.app";

export function resolveImageUrl(url: string | null | undefined): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
    return url;
  }
  if (url.startsWith("/__l5e/")) {
    return `${LOVABLE_PREVIEW_ORIGIN}${url}`;
  }
  return url;
}
