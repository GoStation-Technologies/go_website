DELETE FROM public.leaders WHERE name_en IN ('Faisal Al-Shamri','Noura Al-Enazi','Abdullah Al-Ghamdi','Reem Al-Qahtani');

INSERT INTO public.leaders (id, name_ar, name_en, title_ar, title_en, bio_ar, bio_en, photo_url, sort_order, is_active) VALUES
  ('89dfab7d-9491-49e6-8d54-6aa6b3411d9e', 'عارف سالم النهدي', 'Aref Salem Al-Nahdi', 'رئيس مجلس الإدارة', 'Chairman of the Board', 'رئيس مجلس إدارة قوستيشن، يقود الرؤية الاستراتيجية ونمو الشبكة في جميع مناطق المملكة.', 'Chairman of the Board of GoStation, leading the strategic vision and network growth across the Kingdom.', '/__l5e/assets-v1/8af0fb9e-c8ef-48c5-a26e-c00c8bfd7a93/chairman-cutout-v2.png', 0, true),
  ('90ef83d9-fc6b-4962-81c9-d9d070fb6bd5', 'سالم صالح النهدي', 'Salem Saleh Al-Nahdi', 'الرئيس التنفيذي العام', 'General Chief Executive Officer', 'يقود التنفيذ الاستراتيجي للشركة وتطوير عملياتها التشغيلية والتجارية.', 'Leads the company''s strategic execution and the development of its operational and commercial performance.', 'https://res.cloudinary.com/dca2x8jje/image/upload/v1786870185/DSC_8625_copy.jpg_kihmwm.jpg', 1, true),
  ('edfe0787-b893-4964-b108-db42febba92e', 'عبدالعزيز بن عايض القحطاني', 'Abdulaziz bin Ayed Al-Qahtani', 'الرئيس التنفيذي للعمليات', 'Chief Operating Officer', 'يشرف على تشغيل شبكة المحطات وضمان معايير الجودة والسلامة في جميع المواقع.', 'Oversees the operation of the station network and ensures quality and safety standards across all locations.', 'https://res.cloudinary.com/dca2x8jje/image/upload/v1786870639/1744662006789_eodjjv.jpg', 2, true),
  ('c48cc65d-2dd4-4adb-9ca6-d80ca8768642', 'عبدالعزيز سالم باكرمان', 'Abdulaziz Salem Bakerman', 'نائب الرئيس التنفيذي والرئيس التنفيذي لتطوير الأعمال', 'Deputy CEO & Chief Executive of Business Development', 'يدفع النمو التجاري وتطوير الشراكات الاستراتيجية والفرص الجديدة للشركة.', 'Drives business growth, strategic partnerships and new opportunities for the company.', 'https://res.cloudinary.com/dca2x8jje/image/upload/v1786870639/1686508977330_awdsbo.jpg', 3, true),
  ('26f16d8f-569b-4993-b876-50d48078b732', 'طارق فتحي', 'Tariq Fathi', 'الرئيس التنفيذي المالي', 'Chief Financial Officer', 'يدير الأداء المالي والتخطيط المالي والتقارير والحوكمة المالية للشركة.', 'Manages the company''s financial performance, planning, reporting and financial governance.', 'https://res.cloudinary.com/dca2x8jje/image/upload/v1786870639/1722761626761_xcikgd.jpg', 4, true)
ON CONFLICT (id) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  title_ar = EXCLUDED.title_ar,
  title_en = EXCLUDED.title_en,
  bio_ar = EXCLUDED.bio_ar,
  bio_en = EXCLUDED.bio_en,
  photo_url = EXCLUDED.photo_url,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  updated_at = now();