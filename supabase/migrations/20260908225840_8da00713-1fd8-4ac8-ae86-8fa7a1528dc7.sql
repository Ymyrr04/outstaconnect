CREATE TABLE public.admin_users (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT ALL ON public.admin_users TO service_role;

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages admin users"
ON public.admin_users
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);