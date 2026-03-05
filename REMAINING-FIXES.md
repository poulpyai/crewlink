# CrewLink - Remaining Fixes Plan

## ✅ COMPLETED TODAY:
1. Booking messaging ("Request Sent" not "Confirmed")
2. Slot status update when provider confirms (pending → booked)
3. Error handling for slot updates
4. Examiner/AME slots now show badges like simulator slots

## 🔧 FIXING NOW (in order):

### 1. PILOT PROFILE - Extended Fields ⏳
**Status:** Creating migration + UI
**What:** Add pilot_profiles table with:
- License number, type, country
- Ratings (IR, MEP, SEP, Night, etc.)
- Aircraft types qualified
- Home base airport
- Phone number
- Total hours (optional)
- Bio (optional)

**Files:**
- ✅ `/supabase/migrations/008_pilot_profiles.sql` (created)
- ⏳ `/app/(main)/settings/page.tsx` (adding form)

---

### 2. AME PROFILE EDITING ⏳
**Problem:** AMEs can create profile but can't edit it later
**Solution:** Add edit form to Profile page (like examiner has)
**File:** `/app/(main)/settings/page.tsx`

---

### 3. DELETION BUTTON 🔍
**Status:** Need to test and verify
**Action:** Check if delete functionality works in My Bookings + Bookings pages
**Files to check:**
- `/app/(main)/my-bookings/page.tsx`
- `/app/(main)/bookings/page.tsx`

---

### 4. CLASS DISPLAY CONSISTENCY 🔍
**Problem:** Some places show "1" instead of "Class 1"
**Action:** Search and fix all AME displays
**Files to check:**
- `/components/ame/ame-slot-browse.tsx`
- `/components/ame/ame-profile-browse.tsx`
- `/app/(main)/my-bookings/page.tsx`
- `/app/(main)/dashboard/page.tsx`

---

## 📝 IMPLEMENTATION APPROACH:
Since the settings page is large and complex, I'll:
1. Add pilot profile section AFTER the basic profile card
2. Add AME edit form in the AME Profile section
3. Keep code organized and clean
4. Test each fix individually

## 🎯 ESTIMATED TIME:
- Pilot profile form: ~15 min
- AME editing: ~10 min
- Deletion test/fix: ~5 min
- Class display: ~10 min
**Total: ~40 minutes of focused work**

---

**Note to Q:** I'll implement these fixes one by one, cleanly and professionally. After all fixes, you test everything together.
