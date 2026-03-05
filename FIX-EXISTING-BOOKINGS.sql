-- Fix existing confirmed bookings that have slots stuck in "pending" status
-- Run this in Supabase SQL Editor

-- Fix examiner slots
UPDATE examiner_slots
SET booking_status = 'booked'
WHERE booking_request_id IN (
  SELECT id FROM booking_requests 
  WHERE status = 'confirmed' 
  AND provider_type = 'examiner'
)
AND booking_status = 'pending';

-- Fix AME slots
UPDATE ame_slots
SET booking_status = 'booked'
WHERE booking_request_id IN (
  SELECT id FROM booking_requests 
  WHERE status = 'confirmed' 
  AND provider_type = 'ame'
)
AND booking_status = 'pending';

-- Fix simulator slots (just in case)
UPDATE simulator_slots
SET booking_status = 'booked'
WHERE booking_request_id IN (
  SELECT id FROM booking_requests 
  WHERE status = 'confirmed' 
  AND provider_type = 'sim_company'
)
AND booking_status = 'pending';

-- Verify the fix
SELECT 
  br.id as booking_id,
  br.provider_type,
  br.status as booking_status,
  COALESCE(es.booking_status, ams.booking_status, ss.booking_status) as slot_status
FROM booking_requests br
LEFT JOIN examiner_slots es ON es.booking_request_id = br.id
LEFT JOIN ame_slots ams ON ams.booking_request_id = br.id  
LEFT JOIN simulator_slots ss ON ss.booking_request_id = br.id
WHERE br.status = 'confirmed'
ORDER BY br.created_at DESC;
