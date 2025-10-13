-- Create conversion tracking table for contacts
CREATE TABLE public.contact_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  from_status contact_status,
  to_status contact_status NOT NULL,
  converted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  converted_by UUID REFERENCES auth.users(id),
  notes TEXT,
  CONSTRAINT different_status CHECK (from_status IS DISTINCT FROM to_status)
);

-- Enable RLS
ALTER TABLE public.contact_conversions ENABLE ROW LEVEL SECURITY;

-- Admins can view conversions
CREATE POLICY "Admins can view conversions"
ON public.contact_conversions
FOR SELECT
USING (is_admin(auth.uid()));

-- Admins can create conversions (automatically done by trigger)
CREATE POLICY "Admins can create conversions"
ON public.contact_conversions
FOR INSERT
WITH CHECK (is_admin(auth.uid()));

-- Create trigger to automatically track conversions
CREATE OR REPLACE FUNCTION public.track_contact_conversion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only track if status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.contact_conversions (
      contact_id,
      from_status,
      to_status,
      converted_by
    ) VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      auth.uid()
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER track_contact_status_changes
AFTER UPDATE OF status ON public.contacts
FOR EACH ROW
EXECUTE FUNCTION public.track_contact_conversion();

-- Create index for better query performance
CREATE INDEX idx_contact_conversions_contact_id ON public.contact_conversions(contact_id);
CREATE INDEX idx_contact_conversions_converted_at ON public.contact_conversions(converted_at DESC);