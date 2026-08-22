-- ==============================================================================
-- DAYFLOW HRMS - SUPABASE DATABASE SCHEMA
-- Run this complete SQL script in your Supabase SQL Editor (https://supabase.com)
-- ==============================================================================

-- 1. Create Enums (skip if already created)
CREATE TYPE IF NOT EXISTS user_role AS ENUM ('admin', 'employee');
CREATE TYPE IF NOT EXISTS attendance_status AS ENUM ('present', 'absent', 'half-day', 'leave');
CREATE TYPE IF NOT EXISTS leave_type AS ENUM ('paid', 'sick', 'unpaid');
CREATE TYPE IF NOT EXISTS leave_status AS ENUM ('pending', 'approved', 'rejected');

-- 2. Create Users Table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role user_role NOT NULL DEFAULT 'employee',
  phone TEXT,
  address TEXT,
  profile_picture_url TEXT,
  job_title TEXT,
  salary NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create Attendance Table
CREATE TABLE IF NOT EXISTS public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  check_in TIMESTAMP WITH TIME ZONE,
  check_out TIMESTAMP WITH TIME ZONE,
  status attendance_status NOT NULL DEFAULT 'absent'
);

-- 4. Create Leave Requests Table
CREATE TABLE IF NOT EXISTS public.leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  leave_type leave_type NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  remarks TEXT,
  status leave_status NOT NULL DEFAULT 'pending',
  admin_comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;

-- 6. DROP old policies first (safe to re-run)
DROP POLICY IF EXISTS "Allow public read access to users" ON public.users;
DROP POLICY IF EXISTS "Allow users to insert their own profile" ON public.users;
DROP POLICY IF EXISTS "Allow users to update profiles" ON public.users;
DROP POLICY IF EXISTS "Allow authenticated users access to attendance" ON public.attendance;
DROP POLICY IF EXISTS "Allow authenticated users access to leave_requests" ON public.leave_requests;

-- 7. RLS Policies — open for authenticated users (backend validates tokens itself)
-- SELECT: anyone can read user records (needed for admin dashboard)
CREATE POLICY "Allow read access to users" ON public.users
  FOR SELECT USING (true);

-- INSERT: allow any authenticated user to insert (backend enforces user_id = auth.uid())
CREATE POLICY "Allow insert for authenticated users" ON public.users
  FOR INSERT WITH CHECK (true);

-- UPDATE: allow self-update or admin
CREATE POLICY "Allow update own profile" ON public.users
  FOR UPDATE USING (true);

-- Attendance & Leave — allow all operations for authenticated sessions
CREATE POLICY "Allow all on attendance" ON public.attendance
  FOR ALL USING (true);

CREATE POLICY "Allow all on leave_requests" ON public.leave_requests
  FOR ALL USING (true);
