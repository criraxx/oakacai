DO $$
DECLARE
  origin text := 'https://id-preview--d5b028a3-53ac-44c9-8acb-1ecbc0ecedab.lovable.app';
BEGIN
  UPDATE public.configuracoes
  SET logo_url = origin || logo_url
  WHERE logo_url IS NOT NULL AND logo_url LIKE '/__l5e/%';

  UPDATE public.configuracoes
  SET banner_url = origin || banner_url
  WHERE banner_url IS NOT NULL AND banner_url LIKE '/__l5e/%';

  UPDATE public.banners
  SET imagem = origin || imagem
  WHERE imagem IS NOT NULL AND imagem LIKE '/__l5e/%';

  UPDATE public.produtos
  SET imagem = origin || imagem
  WHERE imagem IS NOT NULL AND imagem LIKE '/__l5e/%';

  UPDATE public.complementos
  SET imagem = origin || imagem
  WHERE imagem IS NOT NULL AND imagem LIKE '/__l5e/%';

  UPDATE public.order_bumps
  SET imagem = origin || imagem
  WHERE imagem IS NOT NULL AND imagem LIKE '/__l5e/%';

  UPDATE public.downsells
  SET imagem = origin || imagem
  WHERE imagem IS NOT NULL AND imagem LIKE '/__l5e/%';
END $$;