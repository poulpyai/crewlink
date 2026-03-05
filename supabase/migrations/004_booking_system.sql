-- =====================================================
-- CREWLINK BOOKING & MESSAGING SYSTEM
-- Phase 1: Core booking, partner matching, DMs, notifications
-- =====================================================

-- =====================================================
-- 1. PARTNER MATCHING (Simulator Slots Enhancement)
-- =====================================================

-- Add partner matching fields to simulator_slots
ALTER TABLE simulator_slots
ADD COLUMN IF NOT EXISTS examiner_available BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS examiner_type VARCHAR(50), -- 'TRE', 'TRI', 'FI'
ADD COLUMN IF NOT EXISTS examiner_rate DECIMAL(10,2), -- additional cost if applicable

ADD COLUMN IF NOT EXISTS instructor_available BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS instructor_rate DECIMAL(10,2),

ADD COLUMN IF NOT EXISTS copilot_available BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS copilot_rate DECIMAL(10,2),

ADD COLUMN IF NOT EXISTS package_type VARCHAR(50) DEFAULT 'sim_only', -- 'sim_only', 'with_examiner', 'with_instructor', 'full_package'
ADD COLUMN IF NOT EXISTS base_price DECIMAL(10,2), -- sim only price
ADD COLUMN IF NOT EXISTS total_price DECIMAL(10,2), -- with all selected services

ADD COLUMN IF NOT EXISTS booking_request_id UUID REFERENCES booking_requests(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS booking_status VARCHAR(20) DEFAULT 'available'; -- 'available', 'pending', 'booked'

-- =====================================================
-- 2. BOOKING REQUESTS (Universal for all provider types)
-- =====================================================

CREATE TABLE IF NOT EXISTS booking_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Parties involved
  pilot_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider_type VARCHAR(20) NOT NULL, -- 'sim_company', 'examiner', 'ame'
  
  -- For simulator bookings (references specific slot)
  slot_id UUID REFERENCES simulator_slots(id) ON DELETE CASCADE,
  
  -- For examiner/AME requests (no pre-defined slots)
  requested_dates JSONB, -- array of date strings: ["2026-03-15", "2026-03-16"]
  service_type VARCHAR(100), -- e.g., "Type Rating", "Medical Class 1"
  aircraft_type VARCHAR(50),
  rating_type VARCHAR(50),
  
  -- Pilot's initial message (optional)
  message TEXT,
  
  -- Partner matching for sim bookings
  needs_examiner BOOLEAN DEFAULT false,
  has_examiner BOOLEAN DEFAULT false,
  
  needs_instructor BOOLEAN DEFAULT false,
  has_instructor BOOLEAN DEFAULT false,
  
  needs_copilot BOOLEAN DEFAULT false,
  has_copilot BOOLEAN DEFAULT false,
  
  selected_package VARCHAR(50), -- what they're actually booking
  package_price DECIMAL(10,2), -- total price for transparency
  
  -- Status tracking
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'confirmed', 'declined', 'cancelled'
  decline_reason TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ, -- auto-decline if no response
  
  -- Indexes
  CONSTRAINT valid_status CHECK (status IN ('pending', 'confirmed', 'declined', 'cancelled'))
);

CREATE INDEX idx_booking_requests_pilot ON booking_requests(pilot_id);
CREATE INDEX idx_booking_requests_provider ON booking_requests(provider_id);
CREATE INDEX idx_booking_requests_status ON booking_requests(status);
CREATE INDEX idx_booking_requests_slot ON booking_requests(slot_id);

-- =====================================================
-- 3. MESSAGING SYSTEM (DMs between pilots & providers)
-- =====================================================

CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Participants
  pilot_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider_type VARCHAR(20) NOT NULL, -- 'sim_company', 'examiner', 'ame'
  
  -- Related booking request
  booking_request_id UUID REFERENCES booking_requests(id) ON DELETE CASCADE,
  
  -- Auto-generated subject
  subject TEXT,
  
  -- Tracking
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  unread_count_pilot INT DEFAULT 0,
  unread_count_provider INT DEFAULT 0,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one conversation per booking
  UNIQUE(booking_request_id)
);

CREATE INDEX idx_conversations_pilot ON conversations(pilot_id);
CREATE INDEX idx_conversations_provider ON conversations(provider_id);
CREATE INDEX idx_conversations_booking ON conversations(booking_request_id);
CREATE INDEX idx_conversations_last_message ON conversations(last_message_at DESC);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  
  -- Sender info
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sender_type VARCHAR(20) NOT NULL, -- 'pilot', 'sim_company', 'examiner', 'ame'
  
  -- Message content
  message_text TEXT NOT NULL,
  
  -- Tracking
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_created ON messages(created_at);

-- =====================================================
-- 4. PILOT PREFERENCES (Smart matching)
-- =====================================================

CREATE TABLE IF NOT EXISTS pilot_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pilot_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  
  -- Training preferences
  aircraft_types TEXT[], -- ['A320', 'B737', 'A350']
  rating_needs TEXT[], -- ['Type Rating', 'IR', 'MEP']
  preferred_locations TEXT[], -- ['Paris', 'Amsterdam', 'Frankfurt']
  
  -- What they're looking for
  looking_for TEXT[], -- ['simulators', 'examiners', 'copilot_gigs']
  available_as_copilot BOOLEAN DEFAULT false,
  
  -- Budget range (optional)
  min_budget DECIMAL(10,2),
  max_budget DECIMAL(10,2),
  
  -- Notification preferences
  notification_email BOOLEAN DEFAULT true,
  notification_platform BOOLEAN DEFAULT true,
  notification_frequency VARCHAR(20) DEFAULT 'instant', -- 'instant', 'daily', 'weekly'
  
  -- Tracking
  last_notified_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pilot_preferences_pilot ON pilot_preferences(pilot_id);
CREATE INDEX idx_pilot_preferences_aircraft ON pilot_preferences USING gin(aircraft_types);
CREATE INDEX idx_pilot_preferences_locations ON pilot_preferences USING gin(preferred_locations);

-- =====================================================
-- 5. NOTIFICATIONS (Platform notifications)
-- =====================================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Notification type
  type VARCHAR(50) NOT NULL, -- 'slot_match', 'examiner_match', 'booking_request', 'booking_confirmed', 'new_message'
  
  -- Content
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link_to TEXT, -- URL to the relevant page
  
  -- Related entities (for tracking)
  related_booking_id UUID REFERENCES booking_requests(id) ON DELETE CASCADE,
  related_slot_id UUID REFERENCES simulator_slots(id) ON DELETE CASCADE,
  
  -- Status
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Delete old notifications after 30 days
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 days'
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX idx_notifications_type ON notifications(type);

-- =====================================================
-- 6. HELPER FUNCTIONS
-- =====================================================

-- Auto-update conversation last_message_at on new message
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET 
    last_message_at = NEW.created_at,
    unread_count_pilot = CASE 
      WHEN NEW.sender_type != 'pilot' THEN unread_count_pilot + 1 
      ELSE unread_count_pilot 
    END,
    unread_count_provider = CASE 
      WHEN NEW.sender_type = 'pilot' THEN unread_count_provider + 1 
      ELSE unread_count_provider 
    END
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_conversation_last_message
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION update_conversation_last_message();

-- Auto-update simulator slot status when booking is confirmed/declined
CREATE OR REPLACE FUNCTION update_slot_booking_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slot_id IS NOT NULL THEN
    IF NEW.status = 'confirmed' THEN
      UPDATE simulator_slots
      SET 
        booking_status = 'booked',
        booking_request_id = NEW.id
      WHERE id = NEW.slot_id;
    ELSIF NEW.status = 'declined' OR NEW.status = 'cancelled' THEN
      UPDATE simulator_slots
      SET 
        booking_status = 'available',
        booking_request_id = NULL
      WHERE id = NEW.slot_id AND booking_request_id = NEW.id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_slot_booking_status
AFTER UPDATE ON booking_requests
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION update_slot_booking_status();

-- Set slot to pending when booking request is created
CREATE OR REPLACE FUNCTION set_slot_pending_on_request()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slot_id IS NOT NULL THEN
    UPDATE simulator_slots
    SET 
      booking_status = 'pending',
      booking_request_id = NEW.id
    WHERE id = NEW.slot_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_slot_pending_on_request
AFTER INSERT ON booking_requests
FOR EACH ROW
WHEN (NEW.slot_id IS NOT NULL)
EXECUTE FUNCTION set_slot_pending_on_request();

-- =====================================================
-- 7. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE booking_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE pilot_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Booking requests: pilot and provider can see their own
CREATE POLICY booking_requests_select_policy ON booking_requests
FOR SELECT USING (
  auth.uid() = pilot_id OR auth.uid() = provider_id
);

CREATE POLICY booking_requests_insert_policy ON booking_requests
FOR INSERT WITH CHECK (auth.uid() = pilot_id);

CREATE POLICY booking_requests_update_policy ON booking_requests
FOR UPDATE USING (
  auth.uid() = pilot_id OR auth.uid() = provider_id
);

-- Conversations: participants can see
CREATE POLICY conversations_select_policy ON conversations
FOR SELECT USING (
  auth.uid() = pilot_id OR auth.uid() = provider_id
);

-- Messages: participants can see
CREATE POLICY messages_select_policy ON messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM conversations
    WHERE conversations.id = messages.conversation_id
    AND (conversations.pilot_id = auth.uid() OR conversations.provider_id = auth.uid())
  )
);

CREATE POLICY messages_insert_policy ON messages
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM conversations
    WHERE conversations.id = conversation_id
    AND (conversations.pilot_id = auth.uid() OR conversations.provider_id = auth.uid())
  )
);

-- Pilot preferences: own profile only
CREATE POLICY pilot_preferences_policy ON pilot_preferences
FOR ALL USING (auth.uid() = pilot_id);

-- Notifications: own notifications only
CREATE POLICY notifications_policy ON notifications
FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- COMPLETE ✅
-- =====================================================
