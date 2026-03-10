-- Fix slot_type: set default so inserts that omit it don't fail
ALTER TABLE booking_requests ALTER COLUMN slot_type SET DEFAULT 'sim';

-- Also fix conversations provider_type if it has NOT NULL
DO $$ BEGIN
  BEGIN
    ALTER TABLE conversations ALTER COLUMN provider_type SET DEFAULT 'sim';
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
END $$;
