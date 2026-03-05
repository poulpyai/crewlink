-- =====================================================
-- FIX SIM_SLOTS TRIGGER TABLE NAME MISMATCH
-- Migration 004 references "simulator_slots" but table is "sim_slots"
-- =====================================================

-- Drop old triggers (they reference wrong table name)
DROP TRIGGER IF EXISTS trigger_set_slot_pending_on_request ON booking_requests;
DROP TRIGGER IF EXISTS trigger_update_slot_booking_status ON booking_requests;

-- Drop old functions
DROP FUNCTION IF EXISTS set_slot_pending_on_request();
DROP FUNCTION IF EXISTS update_slot_booking_status();

-- =====================================================
-- RECREATE TRIGGER FUNCTIONS WITH CORRECT TABLE NAME
-- =====================================================

-- Set slot to pending when booking request is created
CREATE OR REPLACE FUNCTION set_slot_pending_on_request()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slot_id IS NOT NULL THEN
    -- Use sim_slots (not simulator_slots!)
    UPDATE sim_slots
    SET 
      booking_status = 'pending',
      booking_request_id = NEW.id
    WHERE id = NEW.slot_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Auto-update sim slot status when booking is confirmed/declined
CREATE OR REPLACE FUNCTION update_slot_booking_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slot_id IS NOT NULL THEN
    IF NEW.status = 'confirmed' THEN
      -- Use sim_slots (not simulator_slots!)
      UPDATE sim_slots
      SET 
        booking_status = 'booked',
        booking_request_id = NEW.id
      WHERE id = NEW.slot_id;
    ELSIF NEW.status = 'declined' OR NEW.status = 'cancelled' THEN
      -- Use sim_slots (not simulator_slots!)
      UPDATE sim_slots
      SET 
        booking_status = 'available',
        booking_request_id = NULL
      WHERE id = NEW.slot_id AND booking_request_id = NEW.id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- RECREATE TRIGGERS WITH CORRECT FUNCTIONS
-- =====================================================

CREATE TRIGGER trigger_set_slot_pending_on_request
AFTER INSERT ON booking_requests
FOR EACH ROW
WHEN (NEW.slot_id IS NOT NULL)
EXECUTE FUNCTION set_slot_pending_on_request();

CREATE TRIGGER trigger_update_slot_booking_status
AFTER UPDATE ON booking_requests
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION update_slot_booking_status();

-- =====================================================
-- COMPLETE ✅
-- Now triggers reference correct table name!
-- =====================================================
