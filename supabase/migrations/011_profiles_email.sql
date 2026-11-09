-- Mirror auth.users.email on public.profiles for admin reporting and SQL queries.
-- Canonical login email remains auth.users.email (Supabase Auth).

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email TEXT;

UPDATE public.profiles p
SET email = lower(trim(u.email))
FROM auth.users u
WHERE u.id = p.id
  AND u.email IS NOT NULL
  AND trim(u.email) <> ''
  AND (p.email IS NULL OR trim(p.email) = '' OR lower(trim(p.email)) <> lower(trim(u.email)));

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
BEGIN
  assigned_role := COALESCE(
    (NEW.raw_user_meta_data->>'role')::public.user_role,
    'STUDENT'::public.user_role
  );

  INSERT INTO public.profiles (
    id,
    email,
    phone_number,
    username,
    full_name,
    role,
    status
  ) VALUES (
    NEW.id,
    CASE WHEN NEW.email IS NOT NULL AND trim(NEW.email) <> '' THEN lower(trim(NEW.email)) ELSE NULL END,
    NEW.raw_user_meta_data->>'phone_number',
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'full_name',
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
