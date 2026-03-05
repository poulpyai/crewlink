-- Add pilot profiles table for extended pilot information
CREATE TABLE IF NOT EXISTS pilot_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- License Information
  license_number TEXT,
  license_type TEXT, -- PPL, CPL, ATPL
  license_country TEXT,
  
  -- Ratings & Qualifications
  ratings TEXT[] DEFAULT '{}', -- IR, MEP, SEP, Night Rating, etc.
  aircraft_types_qualified TEXT[] DEFAULT '{}', -- A320, B737, etc.
  
  -- Base Information
  home_base TEXT, -- Airport code or city
  home_country TEXT,
  
  -- Optional
  total_hours INTEGER,
  bio TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE pilot_profiles ENABLE ROW LEVEL SECURITY;

-- Policies for pilot_profiles
CREATE POLICY "Pilots can view their own profile"
  ON pilot_profiles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Pilots can insert their own profile"
  ON pilot_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Pilots can update their own profile"
  ON pilot_profiles
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Add phone to users table if it doesn't exist (it already exists, this is just for safety)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='users' AND column_name='phone') THEN
    ALTER TABLE users ADD COLUMN phone TEXT;
  END IF;
END $$;
