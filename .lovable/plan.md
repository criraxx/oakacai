## Alterações

**1. Nova logo (Oak Açaí)**
- Fazer upload da imagem enviada para Lovable Assets via `lovable-assets create` a partir de `/mnt/user-uploads/ChatGPT_Image_22_de_jul._de_2026_12_45_39.png`, gerando `src/assets/logo-oak.png.asset.json`.
- Atualizar `src/components/Header.tsx`:
  - Substituir o `src` da imagem (hoje `/lovable-uploads/8eeb04bc-...jpg`) pelo `url` do novo asset.
  - Alterar o `alt` para "Oak Açaí".
  - Trocar o texto "Vibe Açaí" por "Oak Açaí".
  - Trocar "Rio de janeiro" por "Florianópolis".

**2. Splash Screen**
- Verificar `src/components/SplashScreen.tsx` (usa `splash-full.png`). Perguntar apenas se necessário — por ora, manter o splash atual, pois o usuário pediu especificamente a logo do header. Se ele quiser trocar o splash também, faz depois.

**3. Meta tags (index.html)**
- Atualizar `<title>` e `<meta description>` para refletir "Oak Açaí - Florianópolis".

## Fora do escopo
- Não mexer em outras referências à marca em páginas de checkout/pedido a menos que explicitamente peçam.
- Não trocar splash screen agora.
