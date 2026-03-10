-- Fix conversations table: add missing columns that code expects
-- The table was created without pilot_id, provider_id, etc.

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='conversations' AND column_name='pilot_id') THEN
    ALTER TABLE conversations ADD COLUMN pilot_id UUID REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='conversations' AND column_name='provider_id') THEN
    ALTER TABLE conversations ADD COLUMN provider_id UUID REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='conversations' AND column_name='provider_type') THEN
    ALTER TABLE conversations ADD COLUMN provider_type VARCHAR(20) DEFAULT 'sim';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='conversations' AND column_name='last_message_at') THEN
    ALTER TABLE conversations ADD COLUMN last_message_at TIMESTAMPTZ DEFAULT NOW();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='conversations' AND column_name='unread_count_pilot') THEN
    ALTER TABLE conversations ADD COLUMN unread_count_pilot INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='conversations' AND column_name='unread_count_provider') THEN
    ALTER TABLE conversations ADD COLUMN unread_count_provider INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='conversations' AND column_name='is_active') THEN
    ALTER TABLE conversations ADD COLUMN is_active BOOLEAN DEFAULT true;
  END IF;
END $$;

-- Create indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_conversations_pilot ON conversations(pilot_id);
CREATE INDEX IF NOT EXISTS idx_conversations_provider ON conversations(provider_id);
CREATE INDEX IF NOT EXISTS idx_conversations_booking ON conversations(booking_request_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations(last_message_at DESC);

-- Drop old RLS policies and recreate with correct columns
DROP POLICY IF EXISTS "conversations_select_policy" ON conversations;
DROP POLICY IF EXISTS "conversations_insert_policy" ON conversations;
DROP POLICY IF EXISTS "conversations_update_policy" ON conversations;

-- Enable RLS (in case it's not enabled)
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- SELECT: participants can see their own conversations
CREATE POLICY "conversations_select_policy" ON conversations
  FOR SELECT USING (
    auth.uid() = pilot_id OR auth.uid() = provider_id
  );

-- INSERT: authenticated users can create conversations
CREATE POLICY "conversations_insert_policy" ON conversations
  FOR INSERT WITH CHECK (
    auth.uid() = pilot_id OR auth.uid() = provider_id
  );

-- UPDATE: participants can update (e.g. mark as read)
CREATE POLICY "conversations_update_policy" ON conversations
  FOR UPDATE USING (
    auth.uid() = pilot_id OR auth.uid() = provider_id
  );
