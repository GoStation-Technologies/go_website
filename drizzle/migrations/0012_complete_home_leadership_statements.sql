update public.page_sections
   set content_en = 'Beyond geographic expansion, our ambition is to build an integrated national operating platform that adapts to economic shifts and captures investment opportunities…',
       content_ar = 'يتجاوز طموحنا التوسع الجغرافي إلى بناء منصة تشغيل وطنية متكاملة تتكيّف مع التحولات الاقتصادية وتقتنص فرص الاستثمار…',
       is_visible = true
 where page_slug = 'home' and section_key = 'chairman';

update public.page_sections
   set content_en = 'Our focus is on driving sustainable growth, leveraging technology, and empowering our people to deliver excellence in every sector we operate.',
       content_ar = 'ينصب تركيزنا على تحقيق النمو المستدام وتوظيف التكنولوجيا وتمكين كوادرنا لتقديم التميّز في كل قطاع نعمل فيه…',
       is_visible = true
 where page_slug = 'home' and section_key = 'ceo';