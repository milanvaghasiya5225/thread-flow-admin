-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('super_admin', 'admin', 'user');

-- Create enum for contact status
CREATE TYPE public.contact_status AS ENUM ('new', 'in_progress', 'on_hold', 'resolved', 'closed');

-- Create enum for communication method
CREATE TYPE public.communication_method AS ENUM ('email', 'phone', 'both');

-- Create enum for verification status
CREATE TYPE public.verification_status AS ENUM ('pending', 'verified', 'failed');

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    phone_number TEXT NOT NULL,
    avatar_url TEXT,
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    email_verification_status verification_status DEFAULT 'pending',
    phone_verification_status verification_status DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    assigned_by UUID REFERENCES public.profiles(id),
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, role)
);

-- Create contacts table
CREATE TABLE public.contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    subject TEXT NOT NULL,
    status contact_status DEFAULT 'new',
    communication_method communication_method DEFAULT 'email',
    assigned_to UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES public.profiles(id)
);

-- Create messages table for conversation threading
CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE NOT NULL,
    sender_type TEXT NOT NULL CHECK (sender_type IN ('customer', 'admin')),
    sender_id UUID REFERENCES public.profiles(id),
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create status_history table for tracking status changes
CREATE TABLE public.status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE NOT NULL,
    old_status contact_status,
    new_status contact_status NOT NULL,
    comment TEXT,
    changed_by UUID REFERENCES public.profiles(id) NOT NULL,
    changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.status_history ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
        AND role = _role
    )
$$;

-- Create security definer function to check if user is admin or super_admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
        AND role IN ('admin', 'super_admin')
    )
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
    ON public.profiles FOR SELECT
    USING (public.is_admin(auth.uid()));

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
    ON public.user_roles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
    ON public.user_roles FOR SELECT
    USING (public.is_admin(auth.uid()));

CREATE POLICY "Super admins can manage roles"
    ON public.user_roles FOR ALL
    USING (public.has_role(auth.uid(), 'super_admin'));

-- RLS Policies for contacts
CREATE POLICY "Admins can view non-deleted contacts"
    ON public.contacts FOR SELECT
    USING (public.is_admin(auth.uid()) AND deleted_at IS NULL);

CREATE POLICY "Admins can create contacts"
    ON public.contacts FOR INSERT
    WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update contacts"
    ON public.contacts FOR UPDATE
    USING (public.is_admin(auth.uid()) AND deleted_at IS NULL);

CREATE POLICY "Admins can soft delete contacts"
    ON public.contacts FOR UPDATE
    USING (public.is_admin(auth.uid()));

-- RLS Policies for messages
CREATE POLICY "Admins can view messages"
    ON public.messages FOR SELECT
    USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can create messages"
    ON public.messages FOR INSERT
    WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update message read status"
    ON public.messages FOR UPDATE
    USING (public.is_admin(auth.uid()));

-- RLS Policies for status_history
CREATE POLICY "Admins can view status history"
    ON public.status_history FOR SELECT
    USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can create status history"
    ON public.status_history FOR INSERT
    WITH CHECK (public.is_admin(auth.uid()));

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Add updated_at triggers
CREATE TRIGGER profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER contacts_updated_at
    BEFORE UPDATE ON public.contacts
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, first_name, last_name, username, phone_number)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'username', ''),
        COALESCE(NEW.raw_user_meta_data->>'phone_number', '')
    );
    
    -- Assign default 'user' role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user');
    
    RETURN NEW;
END;
$$;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for better performance
CREATE INDEX idx_contacts_status ON public.contacts(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_contacts_deleted_at ON public.contacts(deleted_at);
CREATE INDEX idx_contacts_assigned_to ON public.contacts(assigned_to);
CREATE INDEX idx_messages_contact_id ON public.messages(contact_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);

-- Create storage bucket for avatars
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Storage RLS policies for avatars
CREATE POLICY "Users can view all avatars"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'avatars' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can update their own avatar"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'avatars' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete their own avatar"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'avatars' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );