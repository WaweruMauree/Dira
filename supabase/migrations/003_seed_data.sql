-- =============================================================================
-- Dira — Seed Data
-- Run after schema + RLS. Idempotent via ON CONFLICT.
-- =============================================================================

-- === SKILLS (003a) ===
INSERT INTO public.skills (name, category) VALUES
  ('Python', 'TECH'),
  ('JavaScript', 'TECH'),
  ('SQL', 'TECH'),
  ('Data Analysis', 'TECH'),
  ('Machine Learning', 'TECH'),
  ('Excel', 'TECH'),
  ('Java', 'TECH'),
  ('React', 'TECH'),
  ('API Development', 'TECH'),
  ('Cloud Computing', 'TECH'),
  ('Cybersecurity', 'TECH'),
  ('UI/UX Design', 'TECH'),
  ('Communication', 'SOFT'),
  ('Teamwork', 'SOFT'),
  ('Problem Solving', 'SOFT'),
  ('Critical Thinking', 'SOFT'),
  ('Leadership', 'SOFT'),
  ('Time Management', 'SOFT'),
  ('Adaptability', 'SOFT'),
  ('Presentation Skills', 'SOFT'),
  ('Financial Analysis', 'DOMAIN'),
  ('Marketing', 'DOMAIN'),
  ('Project Management', 'DOMAIN'),
  ('Legal Research', 'DOMAIN'),
  ('Accounting', 'DOMAIN'),
  ('Hospitality Operations', 'DOMAIN'),
  ('Public Health', 'DOMAIN'),
  ('Journalism', 'DOMAIN'),
  ('Education', 'DOMAIN'),
  ('Entrepreneurship', 'DOMAIN')
ON CONFLICT (name) DO NOTHING;

-- === OPPORTUNITY SOURCES (003c) ===
INSERT INTO public.opportunity_sources (name, source_type, url_or_path, config)
SELECT v.name, v.source_type, v.url_or_path, v.config
FROM (VALUES
  (
    'BrighterMonday Kenya',
    'FORMAL'::public.source_type,
    'https://www.brightermonday.co.ke',
    '{"scraper": "brightermonday", "rate_limit_seconds": 3}'::jsonb
  ),
  (
    'Fuzu Kenya',
    'FORMAL'::public.source_type,
    'https://www.fuzu.com',
    '{"scraper": "fuzu", "rate_limit_seconds": 3}'::jsonb
  ),
  (
    'Strathmore Career Services',
    'INSTITUTIONAL'::public.source_type,
    'https://strathmore.edu/careers',
    '{"import_type": "manual_csv"}'::jsonb
  ),
  (
    'WhatsApp Alumni Channel',
    'INFORMAL'::public.source_type,
    '/data/sources/whatsapp-alumni.txt',
    '{"import_type": "text_export", "requires_consent": true}'::jsonb
  )
) AS v(name, source_type, url_or_path, config)
WHERE NOT EXISTS (
  SELECT 1 FROM public.opportunity_sources os WHERE os.name = v.name
);

-- === PATHWAY ROLES (003b) ===
INSERT INTO public.pathway_roles (title, level, industry)
SELECT v.title, v.level, v.industry
FROM (VALUES
  ('Data Analyst Intern', 'ENTRY'::public.pathway_level, 'TECH'),
  ('Software Developer Intern', 'ENTRY'::public.pathway_level, 'TECH'),
  ('Business Analyst Intern', 'ENTRY'::public.pathway_level, 'BUSINESS'),
  ('Marketing Intern', 'ENTRY'::public.pathway_level, 'BUSINESS'),
  ('Legal Research Intern', 'ENTRY'::public.pathway_level, 'LAW'),
  ('Finance Intern', 'ENTRY'::public.pathway_level, 'FINANCE'),
  ('Hospitality Trainee', 'ENTRY'::public.pathway_level, 'HOSPITALITY'),
  ('Content Creator Intern', 'ENTRY'::public.pathway_level, 'MEDIA'),
  ('Junior Data Analyst', 'MID'::public.pathway_level, 'TECH'),
  ('Junior Software Engineer', 'MID'::public.pathway_level, 'TECH'),
  ('Product Analyst', 'MID'::public.pathway_level, 'TECH'),
  ('Management Trainee', 'MID'::public.pathway_level, 'BUSINESS'),
  ('Paralegal', 'MID'::public.pathway_level, 'LAW'),
  ('Financial Analyst', 'MID'::public.pathway_level, 'FINANCE'),
  ('Data Scientist', 'SENIOR'::public.pathway_level, 'TECH'),
  ('Senior Software Engineer', 'SENIOR'::public.pathway_level, 'TECH'),
  ('Product Manager', 'SENIOR'::public.pathway_level, 'TECH'),
  ('Consultant', 'SENIOR'::public.pathway_level, 'BUSINESS'),
  ('Associate Attorney', 'SENIOR'::public.pathway_level, 'LAW'),
  ('Investment Analyst', 'SENIOR'::public.pathway_level, 'FINANCE'),
  ('ML Engineer', 'SPECIALIST'::public.pathway_level, 'TECH'),
  ('DevOps Engineer', 'SPECIALIST'::public.pathway_level, 'TECH'),
  ('Legal Tech Specialist', 'SPECIALIST'::public.pathway_level, 'LAW'),
  ('FinTech Analyst', 'SPECIALIST'::public.pathway_level, 'FINANCE')
) AS v(title, level, industry)
WHERE NOT EXISTS (
  SELECT 1 FROM public.pathway_roles pr
  WHERE pr.title = v.title AND pr.level = v.level AND pr.industry = v.industry
);

-- === PATHWAY ROLE SKILLS ===
INSERT INTO public.pathway_role_skills (role_id, skill_id)
SELECT pr.role_id, s.skill_id
FROM public.pathway_roles pr
CROSS JOIN public.skills s
WHERE pr.title = 'Data Analyst Intern'
  AND s.name IN ('Python', 'SQL', 'Data Analysis', 'Excel', 'Communication')
ON CONFLICT DO NOTHING;

INSERT INTO public.pathway_role_skills (role_id, skill_id)
SELECT pr.role_id, s.skill_id
FROM public.pathway_roles pr
CROSS JOIN public.skills s
WHERE pr.title = 'Software Developer Intern'
  AND s.name IN ('JavaScript', 'Python', 'React', 'Problem Solving', 'Teamwork')
ON CONFLICT DO NOTHING;

INSERT INTO public.pathway_role_skills (role_id, skill_id)
SELECT pr.role_id, s.skill_id
FROM public.pathway_roles pr
CROSS JOIN public.skills s
WHERE pr.title = 'Business Analyst Intern'
  AND s.name IN ('Excel', 'Data Analysis', 'Communication', 'Project Management', 'Critical Thinking')
ON CONFLICT DO NOTHING;

INSERT INTO public.pathway_role_skills (role_id, skill_id)
SELECT pr.role_id, s.skill_id
FROM public.pathway_roles pr
CROSS JOIN public.skills s
WHERE pr.title = 'Junior Data Analyst'
  AND s.name IN ('Python', 'SQL', 'Data Analysis', 'Machine Learning', 'Presentation Skills')
ON CONFLICT DO NOTHING;

INSERT INTO public.pathway_role_skills (role_id, skill_id)
SELECT pr.role_id, s.skill_id
FROM public.pathway_roles pr
CROSS JOIN public.skills s
WHERE pr.title = 'Data Scientist'
  AND s.name IN ('Python', 'Machine Learning', 'Data Analysis', 'SQL', 'Critical Thinking')
ON CONFLICT DO NOTHING;

-- === PATHWAY EDGES ===
INSERT INTO public.pathway_edges (from_role_id, to_role_id, difficulty, typical_time_months, notes)
SELECT f.role_id, t.role_id, 2, 12, 'Build portfolio projects and internship experience'
FROM public.pathway_roles f
JOIN public.pathway_roles t ON f.title = 'Data Analyst Intern' AND t.title = 'Junior Data Analyst'
ON CONFLICT DO NOTHING;

INSERT INTO public.pathway_edges (from_role_id, to_role_id, difficulty, typical_time_months, notes)
SELECT f.role_id, t.role_id, 3, 18, 'Deepen ML and statistics skills'
FROM public.pathway_roles f
JOIN public.pathway_roles t ON f.title = 'Junior Data Analyst' AND t.title = 'Data Scientist'
ON CONFLICT DO NOTHING;

INSERT INTO public.pathway_edges (from_role_id, to_role_id, difficulty, typical_time_months, notes)
SELECT f.role_id, t.role_id, 2, 12, 'Progress through backend and system design'
FROM public.pathway_roles f
JOIN public.pathway_roles t ON f.title = 'Software Developer Intern' AND t.title = 'Junior Software Engineer'
ON CONFLICT DO NOTHING;

INSERT INTO public.pathway_edges (from_role_id, to_role_id, difficulty, typical_time_months, notes)
SELECT f.role_id, t.role_id, 3, 24, 'Lead projects and mentor juniors'
FROM public.pathway_roles f
JOIN public.pathway_roles t ON f.title = 'Junior Software Engineer' AND t.title = 'Senior Software Engineer'
ON CONFLICT DO NOTHING;

INSERT INTO public.pathway_edges (from_role_id, to_role_id, difficulty, typical_time_months, notes)
SELECT f.role_id, t.role_id, 2, 12, 'Develop stakeholder management skills'
FROM public.pathway_roles f
JOIN public.pathway_roles t ON f.title = 'Business Analyst Intern' AND t.title = 'Management Trainee'
ON CONFLICT DO NOTHING;

-- === LEARNING RESOURCES (sample) ===
INSERT INTO public.learning_resources (title, url, skill_id, source, description)
SELECT
  'Python for Everybody (Coursera)',
  'https://www.coursera.org/specializations/python',
  s.skill_id,
  'CURATED'::public.learning_resource_source,
  'Introductory Python programming specialization'
FROM public.skills s
WHERE s.name = 'Python'
  AND NOT EXISTS (
    SELECT 1 FROM public.learning_resources lr
    WHERE lr.title = 'Python for Everybody (Coursera)'
  );

INSERT INTO public.learning_resources (title, url, skill_id, source, description)
SELECT
  'SQL for Data Science',
  'https://www.coursera.org/learn/sql-for-data-science',
  s.skill_id,
  'CURATED'::public.learning_resource_source,
  'SQL fundamentals for analytics'
FROM public.skills s
WHERE s.name = 'SQL'
  AND NOT EXISTS (
    SELECT 1 FROM public.learning_resources lr
    WHERE lr.title = 'SQL for Data Science'
  );

INSERT INTO public.learning_resources (title, url, skill_id, source, description)
SELECT
  'Google Data Analytics Certificate',
  'https://grow.google/certificates/data-analytics/',
  s.skill_id,
  'CURATED'::public.learning_resource_source,
  'Professional certificate in data analytics'
FROM public.skills s
WHERE s.name = 'Data Analysis'
  AND NOT EXISTS (
    SELECT 1 FROM public.learning_resources lr
    WHERE lr.title = 'Google Data Analytics Certificate'
  );
