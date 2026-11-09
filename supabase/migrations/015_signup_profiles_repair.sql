-- One-shot signup repair: profile avatars (005), drop admission_number, fix handle_new_user.
-- Run in Supabase SQL Editor if sign-up shows "Database error creating new user".
-- Then run 014_drop_profiles_username.sql if profiles.username still exists.

-- === From 005_profile_avatar.sql ===
DO $$ BEGIN
  CREATE TYPE public.avatar_kind AS ENUM ('jazzicon', 'upload');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_kind public.avatar_kind NOT NULL DEFAULT 'jazzicon',
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS jazzicon_seed TEXT;

COMMENT ON COLUMN public.profiles.jazzicon_seed IS 'Seed for Jazzicon; defaults to user id in app when null';

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152,
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS avatars_public_read ON storage.objects;
CREATE POLICY avatars_public_read ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS avatars_insert_own ON storage.objects;
CREATE POLICY avatars_insert_own ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS avatars_update_own ON storage.objects;
CREATE POLICY avatars_update_own ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS avatars_delete_own ON storage.objects;
CREATE POLICY avatars_delete_own ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- === Drop unused ER field (not collected at signup) ===
ALTER TABLE public.profiles DROP COLUMN IF EXISTS admission_number;

-- === Email + indexes (idempotent; same as 013) ===
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_phone_number_unique
  ON public.profiles (phone_number)
  WHERE phone_number IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_email_unique
  ON public.profiles (lower(email))
  WHERE email IS NOT NULL AND trim(email) <> '';

CREATE OR REPLACE FUNCTION public.sync_profile_email_from_auth()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email IS NOT NULL AND trim(NEW.email) <> '' THEN
    UPDATE public.profiles
    SET email = lower(trim(NEW.email)), updated_at = now()
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_email_sync ON auth.users;
CREATE TRIGGER on_auth_user_email_sync
  AFTER INSERT OR UPDATE OF email ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_email_from_auth();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  assigned_role public.user_role;
  display_name TEXT;
BEGIN
  assigned_role := COALESCE(
    (NEW.raw_user_meta_data->>'role')::public.user_role,
    'STUDENT'::public.user_role
  );

  display_name := COALESCE(
    NULLIF(trim(NEW.raw_user_meta_data->>'full_name'), ''),
    NULLIF(trim(NEW.raw_user_meta_data->>'name'), '')
  );

  INSERT INTO public.profiles (
    id,
    email,
    phone_number,
    full_name,
    role,
    status
  ) VALUES (
    NEW.id,
    CASE WHEN NEW.email IS NOT NULL AND trim(NEW.email) <> '' THEN lower(trim(NEW.email)) ELSE NULL END,
    NULLIF(trim(NEW.raw_user_meta_data->>'phone_number'), ''),
    display_name,
    assigned_role,
    'ACTIVE'::public.user_status
  );

  IF assigned_role = 'STUDENT'::public.user_role THEN
    INSERT INTO public.students (user_id, course)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'course');
  ELSIF assigned_role = 'ADMIN'::public.user_role THEN
    INSERT INTO public.admins (user_id)
    VALUES (NEW.id);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
