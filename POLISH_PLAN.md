# CrewLink - Polish Before Launch Plan
**Date:** 2026-03-05  
**Goal:** Fix all rough edges before public launch  
**Status:** Ready to start when browser is available

---

## 🎯 PRIORITY 1: Critical Flow Testing (Must Work)

### 1. Mobile Responsiveness ⏳
**Time:** ~30 minutes  
**Test Viewports:**
- iPhone SE (375px) - smallest mobile
- iPhone 12 Pro (390px) - standard mobile  
- iPad (768px) - tablet
- Desktop (1920px) - verification

**Pages to Test:**
- [ ] Homepage
- [ ] Login/Signup
- [ ] Dashboard
- [ ] Browse (AME/Examiner/Simulator)
- [ ] Booking modals (can you fill forms on mobile?)
- [ ] My Bookings page
- [ ] Slot management pages
- [ ] Messages page

**What to Check:**
- All text readable (not too small)
- Buttons thumb-sized (44x44px minimum)
- Forms usable (inputs not cut off)
- Navigation accessible (hamburger menu working?)
- Tables → cards on mobile
- No horizontal scrolling
- Images/modals fit screen

**Issues Found:** _Document here during testing_

---

### 2. Messaging System ⏳
**Time:** ~20 minutes  
**Test Flow:**
1. Log in as pilot with confirmed booking
2. Click "Chat" button on confirmed booking
3. Verify conversation opens
4. Send test message: "Hello, confirming details"
5. Log in as provider (AME/Examiner/Sim)
6. Check Messages page - new message visible?
7. Reply: "Confirmed, see you then!"
8. Log back in as pilot
9. Verify reply received

**Check:**
- [ ] Chat button appears on confirmed bookings
- [ ] Conversation page loads
- [ ] Message input works
- [ ] Send button works
- [ ] Messages appear in real-time (or on refresh)
- [ ] Unread count updates
- [ ] Both sides can see full history
- [ ] No console errors

**Issues Found:** _Document here_

---

### 3. Cancellation & Reschedule Flows ⏳
**Time:** ~30 minutes  

**Test A: Pilot Cancels Pending Booking**
1. Create booking (any type)
2. Click "Cancel" before provider confirms
3. Verify:
   - [ ] Booking shows "Cancelled"
   - [ ] Slot back to "Available"
   - [ ] Provider sees cancellation notification

**Test B: Pilot Cancels Confirmed Booking**
1. Confirm a booking (any type)
2. Click "Cancel Booking"
3. Verify:
   - [ ] Asks for confirmation
   - [ ] Booking shows "Cancelled"
   - [ ] Slot back to "Available"
   - [ ] Provider notified

**Test C: Provider Declines Pending Booking**
1. Create booking (any type)
2. Log in as provider
3. Click "Decline" with reason: "Unavailable"
4. Verify:
   - [ ] Booking shows "Declined"
   - [ ] Slot back to "Available"
   - [ ] Pilot sees decline reason

**Test D: Reschedule (if implemented)**
1. Click "Reschedule" on confirmed booking
2. Verify flow works (or document "not implemented yet")

**Issues Found:** _Document here_

---

## 🐛 PRIORITY 2: Bug Fixes (Must Fix)

### 4. Fix Notification 400 Errors ⏳
**Time:** ~15 minutes  

**Current Issue:**
```
Failed to load resource: 400 ()
https://...supabase.co/rest/v1/notifications
```

**Diagnosis Plan:**
1. Check `notifications` table schema in Supabase
2. Check what data we're sending vs what columns exist
3. Fix the mismatch
4. Test: Create booking → verify no 400 error

**Likely Causes:**
- Missing column in notifications table
- Wrong field name (typo)
- Missing required field
- RLS policy blocking insert

**Fix:** _Document solution here_

---

### 5. Fix Slot Count Filtering ⏳
**Time:** ~10 minutes  

**Current Issue:**
Browse pages show "2 simulators available" but one is "Fully Booked"

**Fix Location:** 
`/app/(main)/ame/page.tsx` (and examiner, simulator equivalents)

**Solution:**
Filter slots to exclude `booking_status = 'booked'` before counting

**Example:**
```typescript
// BEFORE:
const slots = await supabase.from('ame_slots').select('*');
const count = slots.length; // includes booked!

// AFTER:
const slots = await supabase
  .from('ame_slots')
  .select('*')
  .neq('booking_status', 'booked'); // exclude booked
const count = slots.length;
```

**Test:** After fix, verify count only shows truly available slots

**Status:** _To be fixed_

---

### 6. Remove Debug Logs ⏳
**Time:** ~5 minutes  

**Current Issue:**
Console full of our debug logs:
```
🟢 [SIMULATOR] Request Booking clicked
🔵 [SIMULATOR] handleSubmit called
🟡 [SIMULATOR] Modal rendered with providerId: ...
```

**Fix:**
Remove or comment out all our temporary debug `console.log` statements:
- `simulator-browse.tsx`
- `request-booking-modal.tsx`
- `bookings/page.tsx`

**Keep:** Error logs (`console.error`) and warnings  
**Remove:** Debug logs with emoji prefixes

**Status:** _To be cleaned_

---

## ✨ PRIORITY 3: UX Polish (Nice to Have)

### 7. Add Loading States ⏳
**Time:** ~30 minutes  

**Current Issue:**
Buttons just hang when clicked (no feedback)

**Where to Add:**
- [ ] Login button → "Logging in..."
- [ ] Signup button → "Creating account..."
- [ ] Book Appointment → "Requesting..." (already has!)
- [ ] Confirm Booking → "Confirming..."
- [ ] Decline Booking → "Declining..."
- [ ] Cancel Booking → "Cancelling..."
- [ ] Send Message → "Sending..."

**Pattern:**
```typescript
const [loading, setLoading] = useState(false);

<Button disabled={loading}>
  {loading ? 'Processing...' : 'Confirm Booking'}
</Button>
```

**Test:** Click each button, verify it shows loading state

---

### 8. Replace alert() with Toasts (Optional) ⏳
**Time:** ~1 hour (bigger change)  

**Current Issue:**
Using browser `alert()` for messages (looks unprofessional)

**Better:** Toast notifications (like GitHub/Linear)

**Options:**
1. **React Hot Toast** (lightweight, popular)
2. **Sonner** (beautiful, modern)
3. **shadcn/ui Toast** (if you're using shadcn)

**Implementation:**
```bash
npm install react-hot-toast
```

```typescript
import toast from 'react-hot-toast';

// Replace:
alert('Booking confirmed!');

// With:
toast.success('Booking confirmed!');
toast.error('Failed to create booking');
toast.loading('Processing...');
```

**Effort vs Impact:**
- Effort: Medium (need to replace ~10 alerts)
- Impact: High (looks way more professional)

**Decision:** Do this if we have time, skip if tight on schedule

---

## 🧪 PRIORITY 4: Edge Case Testing (Final Check)

### 9. Error Scenarios ⏳
**Time:** ~20 minutes  

**Test:**
- [ ] Try booking with network disconnected (airplane mode)
- [ ] Try booking same slot from two browsers simultaneously
- [ ] Try confirming already-confirmed booking
- [ ] Try cancelling already-cancelled booking
- [ ] Try sending empty message
- [ ] Try booking expired slot (if expiry implemented)
- [ ] Try accessing provider pages as pilot (permissions)

**Expected:** Graceful error messages, no crashes

---

### 10. Browser Compatibility ⏳
**Time:** ~15 minutes (quick check)

**Test In:**
- [ ] Chrome (latest)
- [ ] Safari (Mac/iOS)
- [ ] Firefox (latest)
- [ ] Mobile Safari (iPhone)
- [ ] Mobile Chrome (Android if available)

**Check:** Basic flow works (login → browse → book)

---

## 📋 POLISH SESSION WORKFLOW

When you give me browser access, I'll work through this order:

1. **Start with mobile check** (30 min)
   - Test all pages at 375px width
   - Document any broken layouts
   - Fix critical issues immediately

2. **Test messaging** (20 min)
   - Verify chat works end-to-end
   - Fix if broken

3. **Test cancellation flows** (30 min)
   - Pilot cancel, provider decline
   - Verify slots release properly

4. **Fix notification 400s** (15 min)
   - Diagnose and fix database issue

5. **Fix slot count** (10 min)
   - Filter out booked slots from counts

6. **Clean up debug logs** (5 min)
   - Remove console.log spam

7. **Add loading states** (30 min)
   - Buttons show feedback

8. **Toast notifications** (if time permits - 1 hour)
   - Replace alerts

9. **Edge case testing** (20 min)
   - Break things on purpose

10. **Browser compatibility** (15 min)
    - Quick checks across browsers

**Total Time Estimate:** 3-4 hours

---

## 📊 SUCCESS CRITERIA

### Before Launch, Must Have:
✅ All three booking flows work (DONE)  
⏳ Mobile usable (forms work on phone)  
⏳ Messaging works (pilots can contact providers)  
⏳ Cancellation works (slots release properly)  
⏳ No console errors (clean logs)  
⏳ Loading states on buttons (user feedback)

### Nice to Have:
⏳ Toast notifications (professional feel)  
⏳ Perfect mobile layout (every pixel)  
⏳ All edge cases handled (graceful errors)

---

## 🎬 READY TO START

When you're ready:
1. Attach the Chrome extension to localhost:3000
2. Tell me "go" 
3. I'll systematically work through this list
4. Report progress as I go
5. Flag anything that needs your decision

**Estimated completion:** 3-4 hours of focused work

Let's make this thing beautiful! 🐙🚀
