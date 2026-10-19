-- Unique phone numbers on profiles (E.164 +254… recommended at signup).
-- Run after 007 on existing projects; resolve duplicate phone_number rows before applying.

CREATE UNIQUE INDEX IF NOT EXISTS profiles_phone_number_unique
  ON public.profiles (phone_number)
  WHERE phone_number IS NOT NULL;
