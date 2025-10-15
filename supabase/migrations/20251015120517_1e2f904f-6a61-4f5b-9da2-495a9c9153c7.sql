-- Update handle_new_user() function to add length constraints and prevent potential injection
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    -- Insert profile with length-constrained and sanitized metadata
    INSERT INTO public.profiles (id, first_name, last_name, username, phone_number)
    VALUES (
        NEW.id,
        COALESCE(substring(trim(NEW.raw_user_meta_data->>'first_name'), 1, 100), ''),
        COALESCE(substring(trim(NEW.raw_user_meta_data->>'last_name'), 1, 100), ''),
        COALESCE(substring(trim(NEW.raw_user_meta_data->>'username'), 1, 50), ''),
        COALESCE(substring(trim(NEW.raw_user_meta_data->>'phone_number'), 1, 20), '')
    );
    
    -- Assign default 'user' role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user');
    
    RETURN NEW;
END;
$function$;