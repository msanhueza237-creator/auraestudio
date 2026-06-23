-- ==========================================
-- ADD MAINTENANCE DAYS TO SERVICES TABLE
-- ==========================================
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS maintenance_days integer CHECK (maintenance_days >= 0);

-- ==========================================
-- CREATE REMINDERS HISTORY TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.reminders_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  sent_at timestamptz NOT NULL DEFAULT now(),
  channel text NOT NULL DEFAULT 'email',
  status text NOT NULL DEFAULT 'sent',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ==========================================
-- ENABLE ROW LEVEL SECURITY
-- ==========================================
ALTER TABLE public.reminders_history ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- RLS POLICIES FOR OWNER
-- ==========================================
DROP POLICY IF EXISTS reminders_history_owner_all ON public.reminders_history;

CREATE POLICY reminders_history_owner_all ON public.reminders_history
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ==========================================
-- CREATE INDEXES FOR PERFORMANCE
-- ==========================================
CREATE INDEX IF NOT EXISTS reminders_history_user_id_idx ON public.reminders_history(user_id);
CREATE INDEX IF NOT EXISTS reminders_history_client_id_idx ON public.reminders_history(client_id);
CREATE INDEX IF NOT EXISTS reminders_history_client_service_idx ON public.reminders_history(client_id, service_id);
