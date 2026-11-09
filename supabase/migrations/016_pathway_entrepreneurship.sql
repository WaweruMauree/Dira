-- Pathway role for Entrepreneurship interest (catalog skills analysis without web agent).
INSERT INTO public.pathway_roles (title, level, industry)
SELECT 'Entrepreneurship', 'ENTRY', 'BUSINESS'
WHERE NOT EXISTS (
  SELECT 1 FROM public.pathway_roles WHERE lower(trim(title)) = 'entrepreneurship'
);

INSERT INTO public.pathway_role_skills (role_id, skill_id)
SELECT pr.role_id, s.skill_id
FROM public.pathway_roles pr
CROSS JOIN public.skills s
WHERE lower(trim(pr.title)) = 'entrepreneurship'
  AND s.name IN (
    'Business Planning',
    'Communication',
    'Leadership',
    'Problem Solving',
    'Digital Marketing',
    'Financial Literacy',
    'Networking',
    'Entrepreneurship'
  )
ON CONFLICT DO NOTHING;
