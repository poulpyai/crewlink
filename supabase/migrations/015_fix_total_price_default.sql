-- Fix total_price: set default 0 so inserts that omit it don't fail
ALTER TABLE booking_requests ALTER COLUMN total_price SET DEFAULT 0;

-- Also fix slot_type if not already done
DO $$ BEGIN
  BEGIN
    ALTER TABLE booking_requests ALTER COLUMN slot_type SET DEFAULT 'sim';
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
END $$;
