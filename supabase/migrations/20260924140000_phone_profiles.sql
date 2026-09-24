-- Phone/password accounts do not have an email address.
ALTER TABLE public.profiles ALTER COLUMN email DROP NOT NULL;
ALTER TABLE public.profiles ADD COLUMN phone text;
CREATE UNIQUE INDEX profiles_phone_unique ON public.profiles (phone) WHERE phone IS NOT NULL;

CREATE OR REPLACE FUNCTION public.handle_library_user_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, department, phone)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(trim(NEW.raw_user_meta_data->>'name'), ''), 'Leitor'),
    NULLIF(NEW.email, ''),
    NEW.raw_user_meta_data->>'department',
    NULLIF(NEW.phone, '')
  );
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_library_user_created() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER library_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_library_user_created();

-- Preserve accounts created before this migration.
INSERT INTO public.profiles (id, name, email, department, phone)
SELECT id, COALESCE(NULLIF(trim(raw_user_meta_data->>'name'), ''), 'Leitor'),
  NULLIF(email, ''), raw_user_meta_data->>'department', NULLIF(phone, '')
FROM auth.users ON CONFLICT (id) DO NOTHING;
