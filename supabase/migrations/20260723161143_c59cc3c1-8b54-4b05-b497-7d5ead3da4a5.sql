
INSERT INTO public.banners (imagem, ordem, ativo, acao_tipo, intervalo_segundos)
SELECT '/__l5e/assets-v1/4736c3a7-4cb1-4c14-8788-6677034cb342/promo-upgrade-50.jpg', 1, true, 'nenhuma', 6
WHERE NOT EXISTS (SELECT 1 FROM public.banners);

INSERT INTO public.banners (imagem, ordem, ativo, acao_tipo, intervalo_segundos)
SELECT '/__l5e/assets-v1/ca7e178c-a49d-4ed6-8f39-e66697564777/delivery-banner.jpg', 2, true, 'nenhuma', 6
WHERE (SELECT COUNT(*) FROM public.banners) = 1
  AND NOT EXISTS (SELECT 1 FROM public.banners WHERE imagem LIKE '%delivery-banner%');
