-- Add DELETE policy for booking_requests
-- Allow pilots and providers to delete their own booking requests

-- Drop if exists, then recreate
DROP POLICY IF EXISTS booking_requests_delete_policy ON booking_requests;

CREATE POLICY booking_requests_delete_policy ON booking_requests
FOR DELETE USING (
  auth.uid() = pilot_id OR auth.uid() = provider_id
);
