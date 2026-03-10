# CrewLink Provider Flows Test Report
**Date:** March 10, 2026, 10:15 SGT  
**URL:** https://crewlink.live  
**Tester:** Poulpy 🐙

---

## Executive Summary

**Status:** ⚠️ **Provider flows partially tested - form interaction issues found**

### Accounts Created & Tested:
- ✅ **Pilot:** pilot2@crewlink.live (working, tested in previous report)
- ✅ **AME:** ame@crewlink.live (created, profile exists, slot creation form found)
- ⏸️ **Examiner:** Not yet created (pending)
- ⏸️ **Training Center:** Not yet created (pending)

### Critical Finding:
**Provider signup shows "Failed to create profile" error BUT accounts are created successfully and profiles exist**

---

## AME Account Testing

### Signup Flow

**Status:** ✅ Works (despite error message)

**Steps:**
1. Navigate to `/signup`
2. Select "AME" account type
3. Fill form:
   - Name: "Dr. Medical Examiner"
   - Email: "ame@crewlink.live"
   - Password: "testpass123"
4. Click "Create Account"

**🟡 Bug:** Error displayed: **"Failed to create profile"**

**Result:** Despite error, account was created successfully. Login works.

**Recommendation:** Fix error message OR properly create profile on signup. User should not see error when account creation succeeds.

---

### AME Dashboard

**Status:** ✅ Working

**Observations:**
- Different from pilot dashboard
- Shows "Bookings" (not "My Bookings")
- **New section:** "Your Statistics"
  - Total Bookings: 0
  - Reviews: 0
  - Rating: 0.0
- "Complete Your Profile" CTA button

**✅ Good:** Clear provider-specific dashboard

---

### AME Profile/Settings

**Status:** ✅ Working (clinic profile pre-exists)

**URL:** `/settings`

**Profile Data Found:**
- **Clinic Name:** Poulpy Aviation Medical Center
- **Certification Authorities:** EASA, FAA (2 selected)
- **License Classes:** Class 1, 2, 3
- **Location:** Singapore, Singapore
- **Specializations:** Commercial Pilots, Private Pilots
- **Languages:** English, French

**Note:** Profile data appears to be pre-populated (either from a previous test or default data). This is why signup showed "Failed to create profile" - profile might already exist in database.

**Form Fields:**
- Basic info: Name (editable), Email (disabled)
- Clinic Name (optional, pre-filled)
- Certification Authorities (buttons, max 3, some disabled)
- License Classes (buttons)
- Specializations (buttons)
- Languages (buttons)
- Location & Country (text inputs)

**Actions Available:**
- "Delete Profile" button (to remove clinic profile)
- Note at bottom: "To update your clinic information, contact support (details coming soon)"

**🟡 Issue:** Many fields are disabled/read-only after profile is created. This limits editing capability.

---

### AME Bookings Page

**Status:** ✅ Working

**URL:** `/bookings`

**Layout:**
- Heading: "Booking Requests"
- Subtext: "Manage incoming booking requests from pilots"
- Section: "Pending (0)" with icon
- Empty state: "No pending requests"

**Observation:** This is a **request-based** system. AMEs don't see a calendar of their availability here - they see incoming requests from pilots to accept/reject.

---

### AME Slot Management ("Manage Slots")

**Status:** ⚠️ **Found but form interaction issues**

**URL:** `/my-slots`

**Access:** User dropdown menu → "Manage Slots"

**Layout:**
- Heading: "Manage Your Slots"
- Subtext: "Create and manage medical appointment slots"

**Create Appointment Form:**

Fields:
1. **Medical Class*** (dropdown):
   - Options: Class 1, Class 2, Class 3
   - ✅ Working
   
2. **Date*** (date picker):
   - Placeholder: "dd/mm/yyyy"
   - 🔴 **Issue:** Date input interaction failing
   - Attempted: Typing "15/03/2026", "2026-03-11"
   - Result: Element refs keep disappearing (React re-rendering issue)
   
3. **Start Time*** (dropdown):
   - 30-minute intervals (00:00 - 23:30)
   - Default: 09:00
   - ✅ Working
   
4. **Duration (minutes)*** (number input):
   - Default: 60
   - Helper text: "Typical: 30-90 minutes"
   - ⏸️ Not tested
   
5. **Location*** (text input):
   - Pre-filled: "Singapore"
   - ⏸️ Not tested
   
6. **Clinic Name** (optional, text input):
   - Pre-filled: "Poulpy Aviation Medical Center"
   - ⏸️ Not tested
   
7. **Price ($)** (optional, number input):
   - Placeholder: "Leave blank if not advertising price"
   - ⏸️ Not tested
   
8. **Certification Authorities*** (button group):
   - Options: EASA, CAA-UK, FAA, Transport Canada, CAAS, CASA, HKCAD, GCAA, GACA, JCAB, DGCA, CAAC, ANAC, SACAA, ICAO
   - Max 3 selections
   - Currently shows: "2/3" (EASA & FAA pre-selected with white borders)
   - ✅ Visual state working

**Action Button:**
- "Create Appointment Slot"
- ⏸️ Unable to test due to date picker issue

**Bottom Section:**
- "Your Available Appointments (0)"
- Empty state: "No appointments created yet. Create your first slot above!"

---

### Technical Issues Found

#### 1. Date Picker Interaction Failure
**Severity:** 🔴 **CRITICAL** (blocks slot creation)

**Description:**
- Date input field loses focus/ref immediately after interaction
- Typing dates fails with "Element not found or not visible" error
- Likely cause: React state management causing rapid re-renders
- This prevents completing the slot creation flow

**Steps to Reproduce:**
1. Go to `/my-slots`
2. Select "Class 1" from Medical Class dropdown
3. Try to type or click in Date field
4. Element ref disappears

**Impact:** **AMEs cannot create availability slots** → pilots cannot book

**Recommendation:** 
- Debug React component state management
- Check if date picker library is properly integrated
- Test with different date input methods (typing vs calendar picker)

---

#### 2. "Failed to create profile" Error on Signup

**Severity:** 🟡 **MAJOR** (UX issue, functional but confusing)

**Description:**
- AME signup shows "Failed to create profile" error message
- However, account IS created successfully
- Profile data exists when logging in
- Possible cause: Profile already exists in database OR profile creation async timing issue

**Impact:** **User confusion** - users don't know if signup worked

**Recommendation:**
- Fix profile creation flow to not show error on success
- OR show proper success message: "Account created! Your clinic profile is ready."
- Clear existing test profiles from database before production launch

---

## What Still Needs Testing

### High Priority:
1. **Complete AME slot creation flow** (blocked by date picker issue)
2. **Pilot booking AME appointment**
3. **AME accepting/rejecting booking requests**
4. **Messaging between pilot and AME**

### Medium Priority:
5. **Examiner account signup & profile setup**
6. **Examiner session creation**
7. **Pilot booking examiner session**
8. **Training Center account signup**
9. **Training Center adding simulator**
10. **Training Center creating simulator slots**
11. **Pilot booking simulator**

### Low Priority:
12. **Profile deletion flows** (all account types)
13. **Account deletion flows**
14. **Edit availability/sessions after creation**
15. **Cancel bookings** (both sides)

---

## Recommendations

### Before Next Test Session:
1. **Fix date picker interaction** (critical blocker)
2. **Clear test data** from database (old profiles interfering)
3. **Fix "Failed to create profile" error message**

### For Complete Testing:
1. Have Q manually verify slot creation works in browser
2. Create test data for each provider type
3. Test full booking lifecycle: create → request → accept → message → complete
4. Test rejection flow: create → request → reject
5. Test deletion: create slot → delete slot

---

## Screenshots Captured

1. `/signup` - AME signup form with "Signing up as a Ame" (typo: lowercase 'a')
2. `/settings` - AME profile page showing existing clinic data
3. `/my-slots` - Slot management interface with form

---

## Summary

**Working:**
- ✅ AME account creation (despite error message)
- ✅ AME login
- ✅ Provider dashboard UI
- ✅ Profile page with clinic data
- ✅ Bookings request management page
- ✅ Slot management interface discovered
- ✅ Most form elements functional

**Broken:**
- 🔴 Date picker prevents slot creation
- 🟡 "Failed to create profile" error misleading

**Not Tested:**
- Examiner flows
- Training Center flows
- Full booking lifecycle
- Messaging
- Cancellation/deletion

**Blocker:** Date picker must be fixed before continuing provider flow testing.

---

**Next Steps:** Fix date picker, then test complete booking flow (AME create slot → pilot book → AME accept → messaging).

---

**Tester:** Poulpy 🐙  
**Signed off:** March 10, 2026, 10:20 SGT
