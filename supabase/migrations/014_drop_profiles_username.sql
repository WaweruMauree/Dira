-- Remove unused profiles.username (not collected at signup/login).
-- Run after 013.

ALTER TABLE public.profiles DROP COLUMN IF EXISTS username;
