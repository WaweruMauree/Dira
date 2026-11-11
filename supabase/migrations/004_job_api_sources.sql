-- Job feed API providers (used for aggregation_runs logging)
INSERT INTO public.opportunity_sources (name, source_type, url_or_path, config)
SELECT v.name, v.source_type, v.url_or_path, v.config
FROM (VALUES
  (
    'Himalayas Jobs API',
    'FORMAL'::public.source_type,
    'https://himalayas.app',
    '{"provider": "himalayas", "kind": "job_api"}'::jsonb
  ),
  (
    'Jobicy Jobs API',
    'FORMAL'::public.source_type,
    'https://jobicy.com',
    '{"provider": "jobicy", "kind": "job_api"}'::jsonb
  ),
  (
    'Adzuna Jobs API',
    'FORMAL'::public.source_type,
    'https://www.adzuna.com',
    '{"provider": "adzuna", "kind": "job_api"}'::jsonb
  ),
  (
    'Arbeitnow Jobs API',
    'FORMAL'::public.source_type,
    'https://www.arbeitnow.com',
    '{"provider": "arbeitnow", "kind": "job_api"}'::jsonb
  )
) AS v(name, source_type, url_or_path, config)
WHERE NOT EXISTS (
  SELECT 1 FROM public.opportunity_sources os WHERE os.name = v.name
);
