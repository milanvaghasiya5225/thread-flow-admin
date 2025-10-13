-- Add DELETE policy for messages table to allow admins to delete messages
CREATE POLICY "Admins can delete messages"
ON public.messages
FOR DELETE
USING (is_admin(auth.uid()));

-- Create role audit log table for comprehensive role change tracking
CREATE TABLE public.role_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role app_role NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('assigned', 'removed')),
  performed_by UUID,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on role_audit_log
ALTER TABLE public.role_audit_log ENABLE ROW LEVEL SECURITY;

-- Only super admins can view role audit logs
CREATE POLICY "Super admins can view role audit logs"
ON public.role_audit_log
FOR SELECT
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Create trigger function to log all role changes
CREATE OR REPLACE FUNCTION public.log_role_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.role_audit_log (user_id, role, action, performed_by, reason)
    VALUES (NEW.user_id, NEW.role, 'assigned', NEW.assigned_by, 'Role assigned');
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.role_audit_log (user_id, role, action, performed_by)
    VALUES (OLD.user_id, OLD.role, 'removed', auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger to automatically log role changes
CREATE TRIGGER role_changes_audit
AFTER INSERT OR DELETE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.log_role_changes();