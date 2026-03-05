-- =====================================================
-- FIX: Conversation & Message RLS Policies
-- Add INSERT/UPDATE policies for conversations and messages
-- =====================================================

-- CONVERSATIONS: Add INSERT policy (missing!)
-- Allow any authenticated user to create conversations
-- (Providers create conversations when responding to bookings)
CREATE POLICY conversations_insert_policy ON conversations
FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL 
  AND (auth.uid() = pilot_id OR auth.uid() = provider_id)
);

-- CONVERSATIONS: Add UPDATE policy for marking as read
CREATE POLICY conversations_update_policy ON conversations
FOR UPDATE USING (
  auth.uid() = pilot_id OR auth.uid() = provider_id
);

-- =====================================================
-- COMPLETE ✅
-- =====================================================
