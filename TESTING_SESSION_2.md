# CrewLink Testing Session 2 - Examiner & Simulator Flows
**Date:** 2026-02-25  
**Tester:** Poulpy 🐙  
**Status:** In Progress

---

## Session Goals
1. ✅ Test Examiner booking flow (E2E)
2. ⏳ Test Simulator booking flow (E2E)
3. ⏳ Mobile responsiveness check
4. ⏳ UI consistency audit
5. 📋 Document all findings + fixes

---

## Test 1: Examiner Booking Flow

### Setup
- **Examiner:** tinoudelarre@gmail.com (TRE/TRI)
- **Pilot:** qdelarre1@gmail.com
- **Password:** qazwsxedc

### Test Steps
1. Log in as examiner → create slot with aircraft type
2. Log in as pilot → browse examiners → book slot
3. Log in as examiner → confirm booking
4. **Verify:** Slot status updates to "booked"
5. **Verify:** Booked slot no longer bookable by other pilots
6. **Verify:** Messaging system opens

### Results
_Testing in progress..._

---

## Test 2: Simulator Booking Flow

### Setup
- **Sim Company:** qdelarre@gmail.com
- **Pilot:** qdelarre1@gmail.com
- **Password:** qazwsxedc

### Test Steps
1. Log in as sim company → create slot
2. Log in as pilot → browse simulators → book with examiner add-on
3. Log in as sim company → confirm booking
4. **Verify:** Slot status updates to "booked"
5. **Verify:** Add-on pricing correct
6. **Verify:** Messaging works

### Results
_Pending..._

---

## Test 3: Mobile Responsiveness

### Check List
- [ ] Forms (create slots, profile)
- [ ] Booking modals
- [ ] Navigation menu
- [ ] Cards (slots, bookings)
- [ ] Tables (if any)

### Results
_Pending..._

---

## Test 4: UI Consistency Audit

### Areas to Review
- [ ] Form styling (all create/edit forms)
- [ ] Card components (spacing, badges)
- [ ] Button styles (primary vs secondary)
- [ ] Status badges (Available/Pending/Booked)
- [ ] Empty states
- [ ] Error messages
- [ ] Success confirmations

### Results
_Pending..._

---

## Bugs Found & Fixed
_Will document as found..._

---

## Final Report
_Will compile at end of session..._
