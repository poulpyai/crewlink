-- ============================================================================
-- CrewLink Production Database Schema
-- Complete schema with all fixes applied
-- Run this entire file in Supabase SQL Editor
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Custom types
CREATE TYPE user_role AS ENUM ('pilot', 'examiner', 'sim_company', 'ame', 'admin');
CREATE TYPE examiner_type AS ENUM ('TRE', 'TRI', 'SFE', 'SFI', 'FE', 'FI');

-- ============================================================================
-- PROFILES TABLE
-- ============================================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'pilot',
  phone TEXT,
  license_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- EXAMINER PROFILES
-- ============================================================================
CREATE TABLE examiner_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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
-- AME PROFILES
-- ============================================================================
CREATE TABLE ame_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  clinic_name TEXT,
  license_classes TEXT[] NOT NULL DEFAULT '{}',
  certification_authorities TEXT[] NOT NULL DEFAULT '{}',
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

-- ============================================================================
-- EXAMINER SLOTS
-- ============================================================================
CREATE TABLE examiner_slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  examiner_type examiner_type NOT NULL,
  aircraft_type TEXT NOT NULL,
  location TEXT NOT NULL,
  available_from TIMESTAMPTZ NOT NULL,
  available_to TIMESTAMPTZ NOT NULL,
  hourly_rate DECIMAL(10,2) NOT NULL,
  notes TEXT,
  booking_status TEXT NOT NULL DEFAULT 'available' CHECK (booking_status IN ('available', 'pending', 'booked')),
  booking_request_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- AME SLOTS
-- ============================================================================
CREATE TABLE ame_slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  medical_class TEXT NOT NULL,
  certification_authority TEXT NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  price DECIMAL(10,2) NOT NULL,
  location TEXT NOT NULL,
  notes TEXT,
  booking_status TEXT NOT NULL DEFAULT 'available' CHECK (booking_status IN ('available', 'pending', 'booked')),
  booking_request_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- SIMULATOR SLOTS
-- ============================================================================
CREATE TABLE sim_slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sim_company_id UUID NOT NULL REFERENCES sim_companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL, -- Added for easier queries
  aircraft_type TEXT NOT NULL,
  simulator_type TEXT NOT NULL,
  services TEXT[] NOT NULL DEFAULT '{}',
  start_time TIMESTAMPTZ NOT NULL,
  duration_hours DECIMAL(4,2) NOT NULL,
  base_price DECIMAL(10,2) NOT NULL,
  instructor_price DECIMAL(10,2),
  examiner_price DECIMAL(10,2),
  location TEXT NOT NULL,
  notes TEXT,
  booking_status TEXT NOT NULL DEFAULT 'available' CHECK (booking_status IN ('available', 'pending', 'booked')),
  booking_request_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- BOOKING REQUESTS
-- ============================================================================
CREATE TABLE booking_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pilot_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slot_id UUID,
  slot_type TEXT NOT NULL CHECK (slot_type IN ('examiner', 'ame', 'simulator')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'declined', 'cancelled')),
  pilot_notes TEXT,
  provider_notes TEXT,
  total_price DECIMAL(10,2) NOT NULL,
  confirmed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- CONVERSATIONS & MESSAGES
-- ============================================================================
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_request_id UUID NOT NULL REFERENCES booking_requests(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(booking_request_id)
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- PILOT PROFILES
-- ============================================================================
CREATE TABLE pilot_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  license_number TEXT,
  license_type TEXT,
  aircraft_types TEXT[] DEFAULT '{}',
  total_hours DECIMAL(10,2),
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX idx_examiner_slots_user ON examiner_slots(user_id);
CREATE INDEX idx_examiner_slots_status ON examiner_slots(booking_status);
CREATE INDEX idx_ame_slots_user ON ame_slots(user_id);
CREATE INDEX idx_ame_slots_status ON ame_slots(booking_status);
CREATE INDEX idx_ame_slots_date ON ame_slots(appointment_date);
CREATE INDEX idx_sim_slots_company ON sim_slots(sim_company_id);
CREATE INDEX idx_sim_slots_user ON sim_slots(user_id);
CREATE INDEX idx_sim_slots_status ON sim_slots(booking_status);
CREATE INDEX idx_sim_slots_time ON sim_slots(start_time);
CREATE INDEX idx_booking_requests_pilot ON booking_requests(pilot_id);
CREATE INDEX idx_booking_requests_provider ON booking_requests(provider_id);
CREATE INDEX idx_booking_requests_status ON booking_requests(status);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);

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

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_examiner_slots_updated_at BEFORE UPDATE ON examiner_slots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ame_slots_updated_at BEFORE UPDATE ON ame_slots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sim_slots_updated_at BEFORE UPDATE ON sim_slots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_booking_requests_updated_at BEFORE UPDATE ON booking_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SLOT STATUS TRIGGERS (Auto-update on booking confirm/cancel)
-- ============================================================================
CREATE OR REPLACE FUNCTION set_slot_pending_on_request()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slot_type = 'examiner' AND NEW.slot_id IS NOT NULL THEN
    UPDATE examiner_slots
    SET booking_status = 'pending', booking_request_id = NEW.id
    WHERE id = NEW.slot_id;
  ELSIF NEW.slot_type = 'ame' AND NEW.slot_id IS NOT NULL THEN
    UPDATE ame_slots
    SET booking_status = 'pending', booking_request_id = NEW.id
    WHERE id = NEW.slot_id;
  ELSIF NEW.slot_type = 'simulator' AND NEW.slot_id IS NOT NULL THEN
    UPDATE sim_slots
    SET booking_status = 'pending', booking_request_id = NEW.id
    WHERE id = NEW.slot_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_slot_pending_on_request
AFTER INSERT ON booking_requests
FOR EACH ROW
EXECUTE FUNCTION set_slot_pending_on_request();

CREATE OR REPLACE FUNCTION update_slot_status_on_booking_update()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status != OLD.status THEN
    IF NEW.slot_type = 'examiner' AND NEW.slot_id IS NOT NULL THEN
      IF NEW.status = 'confirmed' THEN
        UPDATE examiner_slots SET booking_status = 'booked' WHERE id = NEW.slot_id;
      ELSIF NEW.status IN ('declined', 'cancelled') THEN
        UPDATE examiner_slots SET booking_status = 'available', booking_request_id = NULL WHERE id = NEW.slot_id;
      END IF;
    ELSIF NEW.slot_type = 'ame' AND NEW.slot_id IS NOT NULL THEN
      IF NEW.status = 'confirmed' THEN
        UPDATE ame_slots SET booking_status = 'booked' WHERE id = NEW.slot_id;
      ELSIF NEW.status IN ('declined', 'cancelled') THEN
        UPDATE ame_slots SET booking_status = 'available', booking_request_id = NULL WHERE id = NEW.slot_id;
      END IF;
    ELSIF NEW.slot_type = 'simulator' AND NEW.slot_id IS NOT NULL THEN
      IF NEW.status = 'confirmed' THEN
        UPDATE sim_slots SET booking_status = 'booked' WHERE id = NEW.slot_id;
      ELSIF NEW.status IN ('declined', 'cancelled') THEN
        UPDATE sim_slots SET booking_status = 'available', booking_request_id = NULL WHERE id = NEW.slot_id;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_slot_status_on_booking_update
AFTER UPDATE ON booking_requests
FOR EACH ROW
EXECUTE FUNCTION update_slot_status_on_booking_update();

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE examiner_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sim_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE ame_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE examiner_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE ame_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE sim_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE pilot_profiles ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY profiles_select_policy ON profiles FOR SELECT USING (true);
CREATE POLICY profiles_insert_policy ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY profiles_update_policy ON profiles FOR UPDATE USING (auth.uid() = id);

-- Examiner Profiles
CREATE POLICY examiner_profiles_select_policy ON examiner_profiles FOR SELECT USING (true);
CREATE POLICY examiner_profiles_insert_policy ON examiner_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY examiner_profiles_update_policy ON examiner_profiles FOR UPDATE USING (auth.uid() = user_id);

-- Sim Companies
CREATE POLICY sim_companies_select_policy ON sim_companies FOR SELECT USING (true);
CREATE POLICY sim_companies_insert_policy ON sim_companies FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY sim_companies_update_policy ON sim_companies FOR UPDATE USING (auth.uid() = user_id);

-- AME Profiles
CREATE POLICY ame_profiles_select_policy ON ame_profiles FOR SELECT USING (true);
CREATE POLICY ame_profiles_insert_policy ON ame_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY ame_profiles_update_policy ON ame_profiles FOR UPDATE USING (auth.uid() = user_id);

-- Examiner Slots (WITH FIXED RLS)
CREATE POLICY examiner_slots_select_policy ON examiner_slots FOR SELECT USING (true);
CREATE POLICY examiner_slots_insert_policy ON examiner_slots FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY examiner_slots_update_policy ON examiner_slots
  FOR UPDATE
  USING (auth.uid() = user_id OR booking_status = 'available')
  WITH CHECK (auth.uid() = user_id OR (booking_status IN ('pending', 'available')));
CREATE POLICY examiner_slots_delete_policy ON examiner_slots FOR DELETE USING (auth.uid() = user_id);

-- AME Slots (WITH FIXED RLS)
CREATE POLICY ame_slots_select_policy ON ame_slots FOR SELECT USING (true);
CREATE POLICY ame_slots_insert_policy ON ame_slots FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY ame_slots_update_policy ON ame_slots
  FOR UPDATE
  USING (auth.uid() = user_id OR booking_status = 'available')
  WITH CHECK (auth.uid() = user_id OR (booking_status IN ('pending', 'available')));
CREATE POLICY ame_slots_delete_policy ON ame_slots FOR DELETE USING (auth.uid() = user_id);

-- Sim Slots (WITH FIXED RLS)
CREATE POLICY sim_slots_select_policy ON sim_slots FOR SELECT USING (true);
CREATE POLICY sim_slots_insert_policy ON sim_slots
  FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM sim_companies WHERE sim_companies.id = sim_company_id AND sim_companies.user_id = auth.uid())
  );
CREATE POLICY sim_slots_update_policy ON sim_slots
  FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM sim_companies WHERE sim_companies.id = sim_company_id AND sim_companies.user_id = auth.uid())
    OR booking_status = 'available'
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM sim_companies WHERE sim_companies.id = sim_company_id AND sim_companies.user_id = auth.uid())
    OR (booking_status IN ('pending', 'available'))
  );
CREATE POLICY sim_slots_delete_policy ON sim_slots
  FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM sim_companies WHERE sim_companies.id = sim_company_id AND sim_companies.user_id = auth.uid())
  );

-- Booking Requests
CREATE POLICY booking_requests_select_policy ON booking_requests
  FOR SELECT
  USING (auth.uid() = pilot_id OR auth.uid() = provider_id);
CREATE POLICY booking_requests_insert_policy ON booking_requests
  FOR INSERT
  WITH CHECK (auth.uid() = pilot_id);
CREATE POLICY booking_requests_update_policy ON booking_requests
  FOR UPDATE
  USING (auth.uid() = pilot_id OR auth.uid() = provider_id);

-- Conversations
CREATE POLICY conversations_select_policy ON conversations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM booking_requests
      WHERE booking_requests.id = booking_request_id
      AND (booking_requests.pilot_id = auth.uid() OR booking_requests.provider_id = auth.uid())
    )
  );
CREATE POLICY conversations_insert_policy ON conversations
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM booking_requests
      WHERE booking_requests.id = booking_request_id
      AND (booking_requests.pilot_id = auth.uid() OR booking_requests.provider_id = auth.uid())
    )
  );

-- Messages
CREATE POLICY messages_select_policy ON messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      JOIN booking_requests ON booking_requests.id = conversations.booking_request_id
      WHERE conversations.id = conversation_id
      AND (booking_requests.pilot_id = auth.uid() OR booking_requests.provider_id = auth.uid())
    )
  );
CREATE POLICY messages_insert_policy ON messages
  FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM conversations
      JOIN booking_requests ON booking_requests.id = conversations.booking_request_id
      WHERE conversations.id = conversation_id
      AND (booking_requests.pilot_id = auth.uid() OR booking_requests.provider_id = auth.uid())
    )
  );
CREATE POLICY messages_update_policy ON messages
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      JOIN booking_requests ON booking_requests.id = conversations.booking_request_id
      WHERE conversations.id = conversation_id
      AND (booking_requests.pilot_id = auth.uid() OR booking_requests.provider_id = auth.uid())
    )
  );

-- Pilot Profiles
CREATE POLICY pilot_profiles_select_policy ON pilot_profiles FOR SELECT USING (true);
CREATE POLICY pilot_profiles_insert_policy ON pilot_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY pilot_profiles_update_policy ON pilot_profiles FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================================
-- DONE! Your production database is ready 🚀
-- ============================================================================
