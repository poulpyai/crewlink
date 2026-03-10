-- Add missing columns to booking_requests (skipped by CREATE TABLE IF NOT EXISTS)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='booking_requests' AND column_name='package_price') THEN
    ALTER TABLE booking_requests ADD COLUMN package_price DECIMAL(10,2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='booking_requests' AND column_name='slot_type') THEN
    ALTER TABLE booking_requests ADD COLUMN slot_type VARCHAR(20) DEFAULT 'sim';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='booking_requests' AND column_name='ame_slot_id') THEN
    ALTER TABLE booking_requests ADD COLUMN ame_slot_id UUID REFERENCES ame_slots(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='booking_requests' AND column_name='examiner_slot_id') THEN
    ALTER TABLE booking_requests ADD COLUMN examiner_slot_id UUID REFERENCES examiner_slots(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Fix provider_id FK: drop old constraint pointing to users, add one pointing to profiles
DO $$ BEGIN
  -- Drop old FK if references non-existent users table
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'booking_requests_provider_id_fkey'
    AND table_name = 'booking_requests'
  ) THEN
    ALTER TABLE booking_requests DROP CONSTRAINT booking_requests_provider_id_fkey;
  END IF;
  -- Add new FK to profiles
  ALTER TABLE booking_requests 
    ADD CONSTRAINT booking_requests_provider_id_fkey 
    FOREIGN KEY (provider_id) REFERENCES profiles(id) ON DELETE CASCADE;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'FK already correct or error: %', SQLERRM;
END $$;

-- Same fix for pilot_id FK
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'booking_requests_pilot_id_fkey'
    AND table_name = 'booking_requests'
  ) THEN
    ALTER TABLE booking_requests DROP CONSTRAINT booking_requests_pilot_id_fkey;
  END IF;
  ALTER TABLE booking_requests 
    ADD CONSTRAINT booking_requests_pilot_id_fkey 
    FOREIGN KEY (pilot_id) REFERENCES profiles(id) ON DELETE CASCADE;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'FK already correct or error: %', SQLERRM;
END $$;

-- Fix conversations FKs too
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='conversations') THEN
    -- Fix pilot_id FK
    BEGIN
      ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_pilot_id_fkey;
      ALTER TABLE conversations ADD CONSTRAINT conversations_pilot_id_fkey FOREIGN KEY (pilot_id) REFERENCES profiles(id) ON DELETE CASCADE;
    EXCEPTION WHEN OTHERS THEN NULL; END;
    -- Fix provider_id FK
    BEGIN
      ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_provider_id_fkey;
      ALTER TABLE conversations ADD CONSTRAINT conversations_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES profiles(id) ON DELETE CASCADE;
    EXCEPTION WHEN OTHERS THEN NULL; END;
  END IF;
END $$;
