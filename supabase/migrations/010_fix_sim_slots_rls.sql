-- =====================================================
-- FIX SIM_SLOTS RLS POLICY FOR PILOT BOOKINGS
-- Same fix pattern as AME/Examiner slots
-- =====================================================

-- Drop the overly restrictive policy
DROP POLICY IF EXISTS "Sim companies can manage their slots" ON sim_slots;

-- Create separate policies for different operations
-- 1. SELECT: Everyone can view available slots
CREATE POLICY sim_slots_select_policy ON sim_slots
  FOR SELECT
  USING (true);

-- 2. INSERT: Only sim company owners can create slots
CREATE POLICY sim_slots_insert_policy ON sim_slots
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sim_companies
      WHERE sim_companies.id = sim_company_id
      AND sim_companies.user_id = auth.uid()
    )
  );

-- 3. UPDATE: Owners can update everything, pilots can reserve available slots
CREATE POLICY sim_slots_update_policy ON sim_slots
  FOR UPDATE
  USING (
    -- Owner can update their own slots
    EXISTS (
      SELECT 1 FROM sim_companies
      WHERE sim_companies.id = sim_company_id
      AND sim_companies.user_id = auth.uid()
    )
    OR
    -- Pilots can update available slots to reserve them
    booking_status = 'available'
  )
  WITH CHECK (
    -- Owner can set any status
    EXISTS (
      SELECT 1 FROM sim_companies
      WHERE sim_companies.id = sim_company_id
      AND sim_companies.user_id = auth.uid()
    )
    OR
    -- Pilots can only set to 'pending' or keep 'available'
    (booking_status IN ('pending', 'available'))
  );

-- 4. DELETE: Only sim company owners can delete slots
CREATE POLICY sim_slots_delete_policy ON sim_slots
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM sim_companies
      WHERE sim_companies.id = sim_company_id
      AND sim_companies.user_id = auth.uid()
    )
  );

-- =====================================================
-- ADD 'PENDING' TO CHECK CONSTRAINT (if exists)
-- =====================================================

-- Check if there's a check constraint limiting booking_status values
-- If so, we need to update it to allow 'pending'
-- This is safe to run even if constraint doesn't exist

DO $$
BEGIN
  -- Drop existing constraint if it exists
  ALTER TABLE sim_slots DROP CONSTRAINT IF EXISTS sim_slots_booking_status_check;
  
  -- Add new constraint with all three statuses
  ALTER TABLE sim_slots ADD CONSTRAINT sim_slots_booking_status_check
    CHECK (booking_status IN ('available', 'pending', 'booked'));
    
EXCEPTION
  WHEN OTHERS THEN
    -- If this fails, it's likely because the column type handles it differently
    -- Log but don't fail the migration
    RAISE NOTICE 'Could not add check constraint: %', SQLERRM;
END $$;

-- =====================================================
-- COMPLETE ✅
-- Now pilots can book simulator slots!
-- =====================================================
