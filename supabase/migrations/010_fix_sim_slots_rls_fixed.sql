-- Drop existing policies first (in case they already exist)
DROP POLICY IF EXISTS "Sim companies can manage their slots" ON sim_slots;
DROP POLICY IF EXISTS sim_slots_select_policy ON sim_slots;
DROP POLICY IF EXISTS sim_slots_insert_policy ON sim_slots;
DROP POLICY IF EXISTS sim_slots_update_policy ON sim_slots;
DROP POLICY IF EXISTS sim_slots_delete_policy ON sim_slots;

-- 1. SELECT: Everyone can view
CREATE POLICY sim_slots_select_policy ON sim_slots
  FOR SELECT USING (true);

-- 2. INSERT: Only sim company owners
CREATE POLICY sim_slots_insert_policy ON sim_slots
  FOR INSERT WITH CHECK (
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
    EXISTS (
      SELECT 1 FROM sim_companies
      WHERE sim_companies.id = sim_company_id
      AND sim_companies.user_id = auth.uid()
    )
    OR booking_status = 'available'
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sim_companies
      WHERE sim_companies.id = sim_company_id
      AND sim_companies.user_id = auth.uid()
    )
    OR (booking_status IN ('pending', 'available'))
  );

-- 4. DELETE: Only sim company owners
CREATE POLICY sim_slots_delete_policy ON sim_slots
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM sim_companies
      WHERE sim_companies.id = sim_company_id
      AND sim_companies.user_id = auth.uid()
    )
  );

-- Fix booking_status constraint
DO $$
BEGIN
  ALTER TABLE sim_slots DROP CONSTRAINT IF EXISTS sim_slots_booking_status_check;
  ALTER TABLE sim_slots ADD CONSTRAINT sim_slots_booking_status_check
    CHECK (booking_status IN ('available', 'pending', 'booked'));
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not update constraint: %', SQLERRM;
END $$;
