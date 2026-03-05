-- CrewLink Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Custom types
CREATE TYPE user_role AS ENUM ('pilot', 'examiner', 'sim_company', 'ame', 'admin');
CREATE TYPE examiner_type AS ENUM ('TRE', 'TRI', 'SFE', 'SFI', 'FE', 'FI');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');
CREATE TYPE booking_type AS ENUM ('simulator', 'examiner', 'ame');
CREATE TYPE sim_slot_status AS ENUM ('available', 'booked', 'maintenance');

-- ============================================================================
-- USERS TABLE
-- ============================================================================
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'pilot',
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- EXAMINER PROFILES
-- ============================================================================
CREATE TABLE examiner_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  examiner_number TEXT NOT NULL,
  examiner_types examiner_type[] NOT NULL,
  aircraft_types TEXT[] NOT NULL DEFAULT '{}',
  bio TEXT,
  hourly_rate DECIMAL(10,2),
  license_document_url TEXT,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  location TEXT,
  available_countries TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ============================================================================
-- SIMULATOR COMPANIES
-- ============================================================================
CREATE TABLE sim_companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  location TEXT NOT NULL,
  website TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ============================================================================
-- SIMULATOR SLOTS
-- ============================================================================
CREATE TABLE sim_slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sim_company_id UUID NOT NULL REFERENCES sim_companies(id) ON DELETE CASCADE,
  aircraft_type TEXT NOT NULL,
  simulator_type TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  status sim_slot_status NOT NULL DEFAULT 'available',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (end_time > start_time),
  CHECK (price >= 0)
);

-- Index for calendar queries
CREATE INDEX idx_sim_slots_time ON sim_slots(start_time, end_time);
CREATE INDEX idx_sim_slots_company ON sim_slots(sim_company_id);
CREATE INDEX idx_sim_slots_aircraft ON sim_slots(aircraft_type);

-- ============================================================================
-- AME PROFILES
-- ============================================================================
CREATE TABLE ame_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  clinic_name TEXT,
  license_classes TEXT[] NOT NULL DEFAULT '{}', -- ['Class 1', 'Class 2', 'Class 3']
  specializations TEXT[] NOT NULL DEFAULT '{}',
  languages TEXT[] NOT NULL DEFAULT '{}',
  location TEXT NOT NULL,
  country TEXT NOT NULL,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Index for geographic queries
CREATE INDEX idx_ame_location ON ame_profiles(country, location);

-- ============================================================================
-- BOOKINGS
-- ============================================================================
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  booking_type booking_type NOT NULL,
  sim_slot_id UUID REFERENCES sim_slots(id) ON DELETE SET NULL,
  examiner_id UUID REFERENCES examiner_profiles(id) ON DELETE SET NULL,
  ame_id UUID REFERENCES ame_profiles(id) ON DELETE SET NULL,
  status booking_status NOT NULL DEFAULT 'pending',
  total_price DECIMAL(10,2) NOT NULL,
  payment_intent_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (total_price >= 0),
  CHECK (
    (booking_type = 'simulator' AND sim_slot_id IS NOT NULL) OR
    (booking_type = 'examiner' AND examiner_id IS NOT NULL) OR
    (booking_type = 'ame' AND ame_id IS NOT NULL)
  )
);

-- Index for user bookings
CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_bookings_status ON bookings(status);

-- ============================================================================
-- REVIEWS
-- ============================================================================
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reviewee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(booking_id, reviewer_id)
);

-- Index for review queries
CREATE INDEX idx_reviews_reviewee ON reviews(reviewee_id);

-- ============================================================================
-- PARTNER REQUESTS
-- ============================================================================
CREATE TABLE partner_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  aircraft_type TEXT NOT NULL,
  location TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  experience_level TEXT,
  description TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (end_date >= start_date)
);

-- Index for partner search
CREATE INDEX idx_partner_requests_aircraft ON partner_requests(aircraft_type);
CREATE INDEX idx_partner_requests_location ON partner_requests(location);
CREATE INDEX idx_partner_requests_dates ON partner_requests(start_date, end_date);
CREATE INDEX idx_partner_requests_status ON partner_requests(status);

-- ============================================================================
-- AVAILABILITY (for examiners and AMEs)
-- ============================================================================
CREATE TABLE availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (end_time > start_time)
);

-- Index for availability queries
CREATE INDEX idx_availability_user ON availability(user_id);
CREATE INDEX idx_availability_time ON availability(start_time, end_time);

-- ============================================================================
-- NOTIFICATIONS
-- ============================================================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for user notifications
CREATE INDEX idx_notifications_user ON notifications(user_id, read);

-- ============================================================================
-- UPDATED_AT TRIGGERS
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_examiner_profiles_updated_at BEFORE UPDATE ON examiner_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sim_companies_updated_at BEFORE UPDATE ON sim_companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sim_slots_updated_at BEFORE UPDATE ON sim_slots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ame_profiles_updated_at BEFORE UPDATE ON ame_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_partner_requests_updated_at BEFORE UPDATE ON partner_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_availability_updated_at BEFORE UPDATE ON availability
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE examiner_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sim_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE sim_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE ame_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users: Anyone can read public profiles, users can update their own
CREATE POLICY "Public profiles are viewable by everyone"
  ON users FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Examiner Profiles: Public read, own update
CREATE POLICY "Examiner profiles are viewable by everyone"
  ON examiner_profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can create own examiner profile"
  ON examiner_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own examiner profile"
  ON examiner_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Sim Companies: Public read, own update
CREATE POLICY "Sim companies are viewable by everyone"
  ON sim_companies FOR SELECT
  USING (true);

CREATE POLICY "Users can create own sim company"
  ON sim_companies FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sim company"
  ON sim_companies FOR UPDATE
  USING (auth.uid() = user_id);

-- Sim Slots: Public read, company can manage
CREATE POLICY "Sim slots are viewable by everyone"
  ON sim_slots FOR SELECT
  USING (true);

CREATE POLICY "Sim companies can manage their slots"
  ON sim_slots FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM sim_companies
      WHERE sim_companies.id = sim_slots.sim_company_id
      AND sim_companies.user_id = auth.uid()
    )
  );

-- AME Profiles: Public read, own update
CREATE POLICY "AME profiles are viewable by everyone"
  ON ame_profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can create own AME profile"
  ON ame_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own AME profile"
  ON ame_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Bookings: Users can see their own bookings and bookings for their services
CREATE POLICY "Users can view their own bookings"
  ON bookings FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM sim_slots
      JOIN sim_companies ON sim_companies.id = sim_slots.sim_company_id
      WHERE sim_slots.id = bookings.sim_slot_id
      AND sim_companies.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM examiner_profiles
      WHERE examiner_profiles.id = bookings.examiner_id
      AND examiner_profiles.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM ame_profiles
      WHERE ame_profiles.id = bookings.ame_id
      AND ame_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create bookings"
  ON bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookings"
  ON bookings FOR UPDATE
  USING (auth.uid() = user_id);

-- Reviews: Public read, booking participants can create
CREATE POLICY "Reviews are viewable by everyone"
  ON reviews FOR SELECT
  USING (true);

CREATE POLICY "Booking participants can create reviews"
  ON reviews FOR INSERT
  WITH CHECK (
    auth.uid() = reviewer_id AND
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = booking_id
      AND (bookings.user_id = auth.uid() OR
           EXISTS (
             SELECT 1 FROM sim_companies
             JOIN sim_slots ON sim_slots.sim_company_id = sim_companies.id
             WHERE sim_slots.id = bookings.sim_slot_id
             AND sim_companies.user_id = auth.uid()
           ) OR
           EXISTS (
             SELECT 1 FROM examiner_profiles
             WHERE examiner_profiles.id = bookings.examiner_id
             AND examiner_profiles.user_id = auth.uid()
           ) OR
           EXISTS (
             SELECT 1 FROM ame_profiles
             WHERE ame_profiles.id = bookings.ame_id
             AND ame_profiles.user_id = auth.uid()
           ))
    )
  );

-- Partner Requests: Public read, own manage
CREATE POLICY "Partner requests are viewable by everyone"
  ON partner_requests FOR SELECT
  USING (status = 'active');

CREATE POLICY "Users can create partner requests"
  ON partner_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own partner requests"
  ON partner_requests FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own partner requests"
  ON partner_requests FOR DELETE
  USING (auth.uid() = user_id);

-- Availability: Public read, own manage
CREATE POLICY "Availability is viewable by everyone"
  ON availability FOR SELECT
  USING (true);

CREATE POLICY "Users can manage their own availability"
  ON availability FOR ALL
  USING (auth.uid() = user_id);

-- Notifications: Own only
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================================
-- FUNCTIONS & VIEWS
-- ============================================================================

-- Function to get examiner average rating
CREATE OR REPLACE FUNCTION get_examiner_rating(examiner_user_id UUID)
RETURNS TABLE (
  average_rating DECIMAL,
  review_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(AVG(rating), 0)::DECIMAL(3,2) as average_rating,
    COUNT(*)::BIGINT as review_count
  FROM reviews
  WHERE reviewee_id = examiner_user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get sim company average rating
CREATE OR REPLACE FUNCTION get_sim_company_rating(company_user_id UUID)
RETURNS TABLE (
  average_rating DECIMAL,
  review_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(AVG(r.rating), 0)::DECIMAL(3,2) as average_rating,
    COUNT(*)::BIGINT as review_count
  FROM reviews r
  JOIN bookings b ON b.id = r.booking_id
  JOIN sim_slots s ON s.id = b.sim_slot_id
  JOIN sim_companies sc ON sc.id = s.sim_company_id
  WHERE sc.user_id = company_user_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- INITIAL DATA (Optional - Example simulator types and aircraft)
-- ============================================================================

-- You can add seed data here if needed for demo mode

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
