# CrewLink - Remaining Fixes

## ✅ FIXED (just now):
1. **Booking confirmation messaging** - Changed "Confirmed!" to "Booking Request Sent! Waiting for approval"
2. **Success alert styling** - Changed from green (confirmed) to yellow (pending)

## 🔴 CRITICAL - MUST FIX:
1. **Slots still bookable when pending/booked**
   - STATUS: Need to verify - query looks correct but Q says slots are still bookable
   - ACTION: Test booking flow and verify slot disappears immediately

## 🟡 HIGH PRIORITY:
2. **Pilot profile - need more fields**
   - Current fields: full_name, email, role
   - Needed: License number, ratings, home base, aircraft types qualified on
   - ACTION: Add fields to users table + pilot profile form

3. **AME profile editing**
   - Current: AMEs can't update their own profile
   - Needed: Full profile editing in Profile page (like examiners have)
   - ACTION: Add AME profile edit form to settings page

4. **Deletion not working**
   - Q says delete button for cancelled bookings doesn't work
   - ACTION: Test delete functionality and fix errors

5. **Class '1' vs 'Class 1' inconsistency**
   - Fixed in filters, but may still show in some displays
   - ACTION: Search all AME displays for medical_class and ensure consistent "Class {number}" format

## TESTING CHECKLIST:
- [ ] Book examiner slot → verify it disappears from available list
- [ ] Book AME slot → verify it disappears from available list
- [ ] Cancel booking → verify delete button works
- [ ] Check all AME class displays (browse, profiles, booking cards)
- [ ] Verify pilot can update their profile with new fields
- [ ] Verify AME can edit their profile
