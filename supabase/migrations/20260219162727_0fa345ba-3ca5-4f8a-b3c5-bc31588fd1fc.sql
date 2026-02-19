
-- Site configuration (password, music URL, etc.)
CREATE TABLE public.site_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_password TEXT NOT NULL DEFAULT 'UNSOLVED',
  music_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default config
INSERT INTO public.site_config (site_password) VALUES ('UNSOLVED');

-- Access attempts log
CREATE TABLE public.access_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  password_tried TEXT NOT NULL,
  success BOOLEAN NOT NULL DEFAULT false,
  ip_address TEXT,
  user_agent TEXT,
  device_info JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Admin accounts (max 2)
CREATE TABLE public.admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Case files
CREATE TABLE public.case_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  file_type TEXT NOT NULL, -- image, video, audio, document, text
  file_url TEXT,
  text_content TEXT,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.site_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_files ENABLE ROW LEVEL SECURITY;

-- Security definer function to check admin status
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admins WHERE user_id = _user_id
  )
$$;

-- Site config: anyone can read password (for verification), only admins can update
CREATE POLICY "Anyone can read site config" ON public.site_config FOR SELECT USING (true);
CREATE POLICY "Admins can update site config" ON public.site_config FOR UPDATE TO authenticated USING (public.is_admin(auth.uid()));

-- Access attempts: only admins can read, anyone can insert (via edge function)
CREATE POLICY "Admins can view access attempts" ON public.access_attempts FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Anyone can log attempts" ON public.access_attempts FOR INSERT WITH CHECK (true);

-- Admins table: admins can read
CREATE POLICY "Admins can view admins" ON public.admins FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

-- Case files: anyone can read (after password gate), admins can manage
CREATE POLICY "Anyone can view case files" ON public.case_files FOR SELECT USING (true);
CREATE POLICY "Admins can insert case files" ON public.case_files FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update case files" ON public.case_files FOR UPDATE TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can delete case files" ON public.case_files FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_site_config_updated_at BEFORE UPDATE ON public.site_config FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_case_files_updated_at BEFORE UPDATE ON public.case_files FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for case files
INSERT INTO storage.buckets (id, name, public) VALUES ('case-files', 'case-files', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('music', 'music', true);

-- Storage policies
CREATE POLICY "Anyone can view case files storage" ON storage.objects FOR SELECT USING (bucket_id = 'case-files');
CREATE POLICY "Admins can upload case files" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'case-files' AND public.is_admin(auth.uid()));
CREATE POLICY "Admins can delete case files storage" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'case-files' AND public.is_admin(auth.uid()));

CREATE POLICY "Anyone can view music" ON storage.objects FOR SELECT USING (bucket_id = 'music');
CREATE POLICY "Admins can upload music" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'music' AND public.is_admin(auth.uid()));
CREATE POLICY "Admins can delete music" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'music' AND public.is_admin(auth.uid()));
