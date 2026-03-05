-- =====================================================
-- FIX: Notification RLS Policy
-- Allow users to create notifications for other users
-- (Pilots notify providers, providers notify pilots)
-- =====================================================

-- Drop the overly restrictive policy
DROP POLICY IF EXISTS notifications_policy ON notifications;

-- Create separate policies for different operations

-- SELECT: Users can only see their own notifications
CREATE POLICY notifications_select_policy ON notifications
FOR SELECT USING (auth.uid() = user_id);

-- INSERT: Any authenticated user can create notifications for any user
-- (Needed for booking flow: pilot creates notification for provider)
CREATE POLICY notifications_insert_policy ON notifications
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE: Users can only update their own notifications (mark as read)
CREATE POLICY notifications_update_policy ON notifications
FOR UPDATE USING (auth.uid() = user_id);

-- DELETE: Users can only delete their own notifications
CREATE POLICY notifications_delete_policy ON notifications
FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- COMPLETE ✅
-- =====================================================
