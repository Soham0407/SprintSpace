ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS username TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS role TEXT,
  ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN DEFAULT TRUE;

-- 1. Create the function to automatically sync profiles to candidates table
CREATE OR REPLACE FUNCTION public.handle_profile_sync_to_candidates()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.candidates (id, role_wanted, skills, available)
  VALUES (
    NEW.id,
    COALESCE(NEW.role, 'Developer'),
    ARRAY[]::TEXT[],
    TRUE
  )
  ON CONFLICT (id) DO UPDATE
  SET
    role_wanted = COALESCE(NEW.role, candidates.role_wanted, 'Developer'),
    updated_at = NOW();
  RETURN NEW;
END;
$$;

-- 2. Create the trigger on public.profiles
DROP TRIGGER IF EXISTS on_profile_sync_to_candidates ON public.profiles;
CREATE TRIGGER on_profile_sync_to_candidates
  AFTER INSERT OR UPDATE OF name, bio, role ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_profile_sync_to_candidates();

-- 3. Set up storage buckets & policies for avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Avatar upload" ON storage.objects;
CREATE POLICY "Avatar upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Avatar select" ON storage.objects;
CREATE POLICY "Avatar select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Avatar delete" ON storage.objects;
CREATE POLICY "Avatar delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
