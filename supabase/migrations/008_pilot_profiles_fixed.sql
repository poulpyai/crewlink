-- Add pilot profiles table for extended pilot information
DROP TABLE IF EXISTS pilot_profiles CASCADE;

CREATE TABLE pilot_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  license_number TEXT,
  license_type TEXT,
  license_country TEXT,
  ratings TEXT[] DEFAULT '{}',
  aircraft_types_qualified TEXT[] DEFAULT '{}',
  home_base TEXT,
  home_country TEXT,
  total_hours INTEGER,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE pilot_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pilots can view their own profile" ON pilot_profiles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Pilots can insert their own profile" ON pilot_profiles FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Pilots can update their own profile" ON pilot_profiles FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- Add phone to profiles table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='profiles' AND column_name='phone') THEN
    ALTER TABLE profiles ADD COLUMN phone TEXT;
  END IF;
END $$;
