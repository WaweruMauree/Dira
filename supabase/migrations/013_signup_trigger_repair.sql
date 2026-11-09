-- Signup repair: profiles.email, indexes, handle_new_user (no username), auth triggers.
-- Run in Supabase SQL Editor if sign-up fails with "Database error saving new user".

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
