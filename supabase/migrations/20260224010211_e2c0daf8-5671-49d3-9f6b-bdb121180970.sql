
-- Tighten RLS policies to admin-only for write operations (matching case_files pattern)
DROP POLICY "Authenticated users can insert photos" ON public.case_file_photos;
DROP POLICY "Authenticated users can update photos" ON public.case_file_photos;
DROP POLICY "Authenticated users can delete photos" ON public.case_file_photos;

CREATE POLICY "Admins can insert photos"
  ON public.case_file_photos FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update photos"
  ON public.case_file_photos FOR UPDATE
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete photos"
  ON public.case_file_photos FOR DELETE
  USING (is_admin(auth.uid()));
