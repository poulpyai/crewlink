-- =====================================================
-- 007 FIXED - Drop & recreate cleanly
-- =====================================================

-- Drop views first (they depend on tables)
DROP VIEW IF EXISTS available_examiner_slots;
DROP VIEW IF EXISTS available_ame_slots;

-- Drop tables if they exist (clean slate)
DROP TABLE IF EXISTS examiner_slots CASCADE;
DROP TABLE IF EXISTS ame_slots CASCADE;

-- =====================================================
-- 1. EXAMINER SLOTS TABLE
-- =====================================================

CREATE TABLE examiner_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  examiner_id UUID NOT NULL REFERENCES examiner_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  service_type VARCHAR(50) NOT NULL,
  aircraft_type VARCHAR(50) NOT NULL,
  rating_type VARCHAR(50),
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  location VARCHAR(255) NOT NULL,
  description TEXT,
  hourly_rate DECIMAL(10,2) NOT NULL,
  booking_status VARCHAR(20) DEFAULT 'available',
  booking_request_id UUID REFERENCES booking_requests(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_examiner_booking_status CHECK (booking_status IN ('available', 'pending', 'booked')),
  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

CREATE INDEX idx_examiner_slots_examiner ON examiner_slots(examiner_id);
CREATE INDEX idx_examiner_slots_user ON examiner_slots(user_id);
CREATE INDEX idx_examiner_slots_date ON examiner_slots(date);
CREATE INDEX idx_examiner_slots_status ON examiner_slots(booking_status);

-- =====================================================
-- 2. AME SLOTS TABLE
-- =====================================================

CREATE TABLE ame_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ame_id UUID NOT NULL REFERENCES ame_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  medical_class VARCHAR(10) NOT NULL,
  certification_authorities TEXT[] NOT NULL DEFAULT '{}',
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  location VARCHAR(255) NOT NULL,
  clinic_name VARCHAR(255),
  price DECIMAL(10,2),
  booking_status VARCHAR(20) DEFAULT 'available',
  booking_request_id UUID REFERENCES booking_requests(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_ame_booking_status CHECK (booking_status IN ('available', 'pending', 'booked')),
  CONSTRAINT valid_medical_class CHECK (medical_class IN ('1', '2', '3')),
  CONSTRAINT valid_duration CHECK (duration_minutes > 0 AND duration_minutes <= 240)
);

CREATE INDEX idx_ame_slots_ame ON ame_slots(ame_id);
CREATE INDEX idx_ame_slots_user ON ame_slots(user_id);
CREATE INDEX idx_ame_slots_date ON ame_slots(date);
CREATE INDEX idx_ame_slots_status ON ame_slots(booking_status);

-- =====================================================
-- 3. RLS POLICIES
-- =====================================================

ALTER TABLE examiner_slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY examiner_slots_select_policy ON examiner_slots FOR SELECT USING (true);
CREATE POLICY examiner_slots_insert_policy ON examiner_slots FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY examiner_slots_update_policy ON examiner_slots FOR UPDATE USING (auth.uid() = user_id OR booking_status = 'available') WITH CHECK (auth.uid() = user_id OR booking_status IN ('pending', 'available'));
CREATE POLICY examiner_slots_delete_policy ON examiner_slots FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE ame_slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY ame_slots_select_policy ON ame_slots FOR SELECT USING (true);
CREATE POLICY ame_slots_insert_policy ON ame_slots FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY ame_slots_update_policy ON ame_slots FOR UPDATE USING (auth.uid() = user_id OR booking_status = 'available') WITH CHECK (auth.uid() = user_id OR booking_status IN ('pending', 'available'));
CREATE POLICY ame_slots_delete_policy ON ame_slots FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 4. UPDATE TRIGGERS
-- =====================================================

CREATE OR REPLACE FUNCTION update_examiner_slots_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER examiner_slots_updated_at
  BEFORE UPDATE ON examiner_slots
  FOR EACH ROW EXECUTE FUNCTION update_examiner_slots_updated_at();

CREATE OR REPLACE FUNCTION update_ame_slots_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ame_slots_updated_at
  BEFORE UPDATE ON ame_slots
  FOR EACH ROW EXECUTE FUNCTION update_ame_slots_updated_at();

-- =====================================================
-- 5. VIEWS
-- =====================================================

CREATE OR REPLACE VIEW available_examiner_slots AS
SELECT 
  es.*,
  EXTRACT(EPOCH FROM (es.end_time - es.start_time)) / 3600 as duration_hours,
  es.hourly_rate * (EXTRACT(EPOCH FROM (es.end_time - es.start_time)) / 3600) as total_price,
  ep.examiner_number,
  u.full_name as examiner_name,
  u.email as examiner_email
FROM examiner_slots es
JOIN examiner_profiles ep ON es.examiner_id = ep.id
JOIN profiles u ON es.user_id = u.id
WHERE es.booking_status = 'available' AND es.date >= CURRENT_DATE
ORDER BY es.date, es.start_time;

CREATE OR REPLACE VIEW available_ame_slots AS
SELECT 
  ames.*,
  (ames.start_time + (ames.duration_minutes || ' minutes')::INTERVAL) as end_time,
  ap.clinic_name as ame_clinic,
  u.full_name as ame_name,
  u.email as ame_email
FROM ame_slots ames
JOIN ame_profiles ap ON ames.ame_id = ap.id
JOIN profiles u ON ames.user_id = u.id
WHERE ames.booking_status = 'available' AND ames.date >= CURRENT_DATE
ORDER BY ames.date, ames.start_time;
