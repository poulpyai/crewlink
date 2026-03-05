-- =====================================================
-- EXAMINER & AME SLOT SYSTEM (FIXED)
-- Enable slot-based booking for examiners and AMEs
-- =====================================================

-- =====================================================
-- 1. EXAMINER SLOTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS examiner_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Owner
  examiner_id UUID NOT NULL REFERENCES examiner_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Session details
  service_type VARCHAR(50) NOT NULL, -- 'TRE', 'TRI', 'SFE', 'SFI', 'FE', 'FI'
  aircraft_type VARCHAR(50) NOT NULL,
  rating_type VARCHAR(50), -- Optional: 'IR', 'MEP', 'SEP', etc.
  
  -- Schedule
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  
  -- Location & Details
  location VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Pricing
  hourly_rate DECIMAL(10,2) NOT NULL,
  
  -- Booking status
  booking_status VARCHAR(20) DEFAULT 'available', -- 'available', 'booked'
  booking_request_id UUID REFERENCES booking_requests(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_booking_status CHECK (booking_status IN ('available', 'booked')),
  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

CREATE INDEX idx_examiner_slots_examiner ON examiner_slots(examiner_id);
CREATE INDEX idx_examiner_slots_user ON examiner_slots(user_id);
CREATE INDEX idx_examiner_slots_date ON examiner_slots(date);
CREATE INDEX idx_examiner_slots_status ON examiner_slots(booking_status);
CREATE INDEX idx_examiner_slots_service ON examiner_slots(service_type);
CREATE INDEX idx_examiner_slots_aircraft ON examiner_slots(aircraft_type);

-- =====================================================
-- 2. AME SLOTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS ame_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Owner
  ame_id UUID NOT NULL REFERENCES ame_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Appointment details
  medical_class VARCHAR(10) NOT NULL, -- '1', '2', '3'
  certification_authorities TEXT[] NOT NULL, -- Array: ['EASA', 'FAA', 'CAAS']
  
  -- Schedule
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  duration_minutes INTEGER DEFAULT 60, -- Fixed duration per appointment
  
  -- Location
  location VARCHAR(255) NOT NULL,
  clinic_name VARCHAR(255),
  
  -- Pricing (optional - some AMEs don't advertise price)
  price DECIMAL(10,2),
  
  -- Booking status
  booking_status VARCHAR(20) DEFAULT 'available', -- 'available', 'booked'
  booking_request_id UUID REFERENCES booking_requests(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_booking_status CHECK (booking_status IN ('available', 'booked')),
  CONSTRAINT valid_medical_class CHECK (medical_class IN ('1', '2', '3')),
  CONSTRAINT valid_duration CHECK (duration_minutes > 0 AND duration_minutes <= 240)
);

CREATE INDEX idx_ame_slots_ame ON ame_slots(ame_id);
CREATE INDEX idx_ame_slots_user ON ame_slots(user_id);
CREATE INDEX idx_ame_slots_date ON ame_slots(date);
CREATE INDEX idx_ame_slots_status ON ame_slots(booking_status);
CREATE INDEX idx_ame_slots_class ON ame_slots(medical_class);
CREATE INDEX idx_ame_slots_authorities ON ame_slots USING GIN (certification_authorities);

-- =====================================================
-- 3. RLS POLICIES
-- =====================================================

-- Examiner Slots
ALTER TABLE examiner_slots ENABLE ROW LEVEL SECURITY;

-- Anyone can view available examiner slots
CREATE POLICY examiner_slots_select_policy ON examiner_slots
  FOR SELECT
  USING (true);

-- Only slot owner can insert
CREATE POLICY examiner_slots_insert_policy ON examiner_slots
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Only slot owner can update
CREATE POLICY examiner_slots_update_policy ON examiner_slots
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Only slot owner can delete
CREATE POLICY examiner_slots_delete_policy ON examiner_slots
  FOR DELETE
  USING (auth.uid() = user_id);

-- AME Slots
ALTER TABLE ame_slots ENABLE ROW LEVEL SECURITY;

-- Anyone can view available AME slots
CREATE POLICY ame_slots_select_policy ON ame_slots
  FOR SELECT
  USING (true);

-- Only slot owner can insert
CREATE POLICY ame_slots_insert_policy ON ame_slots
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Only slot owner can update
CREATE POLICY ame_slots_update_policy ON ame_slots
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Only slot owner can delete
CREATE POLICY ame_slots_delete_policy ON ame_slots
  FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- 4. UPDATE TRIGGERS
-- =====================================================

-- Auto-update updated_at on examiner_slots
CREATE OR REPLACE FUNCTION update_examiner_slots_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER examiner_slots_updated_at
  BEFORE UPDATE ON examiner_slots
  FOR EACH ROW
  EXECUTE FUNCTION update_examiner_slots_updated_at();

-- Auto-update updated_at on ame_slots
CREATE OR REPLACE FUNCTION update_ame_slots_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ame_slots_updated_at
  BEFORE UPDATE ON ame_slots
  FOR EACH ROW
  EXECUTE FUNCTION update_ame_slots_updated_at();

-- =====================================================
-- 5. HELPER VIEWS (with calculated fields)
-- =====================================================

-- View: Available examiner slots with examiner details and calculated fields
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
JOIN users u ON es.user_id = u.id
WHERE es.booking_status = 'available'
  AND es.date >= CURRENT_DATE
ORDER BY es.date, es.start_time;

-- View: Available AME slots with AME details and calculated end_time
CREATE OR REPLACE VIEW available_ame_slots AS
SELECT 
  ames.*,
  (ames.start_time + (ames.duration_minutes || ' minutes')::INTERVAL) as end_time,
  ap.clinic_name as ame_clinic,
  u.full_name as ame_name,
  u.email as ame_email
FROM ame_slots ames
JOIN ame_profiles ap ON ames.ame_id = ap.id
JOIN users u ON ames.user_id = u.id
WHERE ames.booking_status = 'available'
  AND ames.date >= CURRENT_DATE
ORDER BY ames.date, ames.start_time;
