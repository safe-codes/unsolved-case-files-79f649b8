
-- Create table for multiple photos per case file
CREATE TABLE public.case_file_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_file_id UUID NOT NULL REFERENCES public.case_files(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.case_file_photos ENABLE ROW LEVEL SECURITY;

-- Public read access (same as case_files - public site)
CREATE POLICY "Anyone can view case file photos"
  ON public.case_file_photos FOR SELECT
  USING (true);

-- Admin insert/update/delete via authenticated users
CREATE POLICY "Authenticated users can insert photos"
  ON public.case_file_photos FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update photos"
  ON public.case_file_photos FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete photos"
  ON public.case_file_photos FOR DELETE
  TO authenticated
  USING (true);

-- Index for fast lookups
CREATE INDEX idx_case_file_photos_case_file_id ON public.case_file_photos(case_file_id);
