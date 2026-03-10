-- Add all missing columns to booking_requests
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='booking_requests' AND column_name='provider_type') THEN
    ALTER TABLE booking_requests ADD COLUMN provider_type VARCHAR(20) DEFAULT 'sim';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='booking_requests' AND column_name='service_type') THEN
    ALTER TABLE booking_requests ADD COLUMN service_type VARCHAR(100);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='booking_requests' AND column_name='requested_dates') THEN
    ALTER TABLE booking_requests ADD COLUMN requested_dates DATE[];
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='booking_requests' AND column_name='slot_id') THEN
    ALTER TABLE booking_requests ADD COLUMN slot_id UUID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='booking_requests' AND column_name='notes') THEN
    ALTER TABLE booking_requests ADD COLUMN notes TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='booking_requests' AND column_name='status') THEN
    ALTER TABLE booking_requests ADD COLUMN status VARCHAR(20) DEFAULT 'pending';
  END IF;
END $$;

-- Add missing columns to conversations
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='conversations' AND column_name='provider_type') THEN
    ALTER TABLE conversations ADD COLUMN provider_type VARCHAR(20) DEFAULT 'sim';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='conversations' AND column_name='subject') THEN
    ALTER TABLE conversations ADD COLUMN subject TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='conversations' AND column_name='booking_request_id') THEN
    ALTER TABLE conversations ADD COLUMN booking_request_id UUID REFERENCES booking_requests(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='conversations' AND column_name='unread_count_pilot') THEN
    ALTER TABLE conversations ADD COLUMN unread_count_pilot INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='conversations' AND column_name='unread_count_provider') THEN
    ALTER TABLE conversations ADD COLUMN unread_count_provider INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='conversations' AND column_name='last_message_at') THEN
    ALTER TABLE conversations ADD COLUMN last_message_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- Create notifications table if missing (was never migrated)
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type VARCHAR(50) NOT NULL,
  title TEXT,
  message TEXT,
  related_id UUID,
  related_type VARCHAR(50),
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own notifications" ON notifications;
CREATE POLICY "Users manage own notifications" ON notifications
  FOR ALL USING (auth.uid() = user_id);
