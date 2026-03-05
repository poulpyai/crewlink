# 🚀 CrewLink Booking System Implementation

## Overview
Complete booking, messaging, and notification system with partner matching.

## 🗄️ Database Migration

**Run this first in Supabase SQL Editor:**
```
supabase/migrations/004_booking_system.sql
```

**What it creates:**
- ✅ `booking_requests` - Universal booking system (sim/examiner/AME)
- ✅ `conversations` & `messages` - DM system
- ✅ `pilot_preferences` - Smart matching preferences
- ✅ `notifications` - Platform notification system
- ✅ Enhanced `simulator_slots` with partner matching fields
- ✅ Triggers for auto-updates (slot status, unread counts)
- ✅ RLS policies for security

---

## 📋 Implementation Phases

### Phase 1: Booking Request System (Days 1-2)
**Goal:** Pilots can request bookings, providers confirm/decline

#### Components to Build:
1. **Simulator Slot Booking**
   - [ ] "Request Booking" button on slot cards
   - [ ] Booking modal (partner matching: needs examiner/copilot?)
   - [ ] Slot reservation (status → pending for 24-48h)
   
2. **Examiner/AME Booking**
   - [ ] "Request Booking" button on profiles
   - [ ] Simple confirmation modal (no forms)
   - [ ] Auto-create booking request

3. **Provider Dashboard**
   - [ ] `/bookings` page - incoming requests
   - [ ] Request card with pilot info
   - [ ] Confirm/Decline buttons with optional message

4. **Pilot Dashboard**
   - [ ] `/my-bookings` page - track all requests
   - [ ] Status badges (pending/confirmed/declined)
   - [ ] Cancel request option

---

### Phase 2: Partner Matching (Days 3-4)
**Goal:** Smart matching - what's included vs what pilot needs

#### Slot Creation Enhancement:
- [ ] Add "What's Included?" section in slot creation form
  - [ ] Examiner available checkbox + type (TRE/TRI/FI) + rate
  - [ ] Instructor available checkbox + rate
  - [ ] Copilot available checkbox + rate
  - [ ] Auto-calculate package types & prices

#### Booking Flow Enhancement:
- [ ] "What do you need?" section in booking modal
  - [ ] "I have examiner" checkbox
  - [ ] "I need examiner" checkbox
  - [ ] Same for copilot/instructor
  - [ ] Show warnings if mismatch (slot has no examiner but pilot needs one)
  - [ ] Show package price breakdown

#### Browse Page Filters:
- [ ] Add filters: "Examiner available", "Instructor available", "Full package"
- [ ] Show badges on slot cards: "✅ TRE Included", "✅ Full Crew Package"

---

### Phase 3: Messaging System (Days 4-5)
**Goal:** DMs unlock after booking response (confirmed or declined)

#### Components:
1. **Conversation Creation**
   - [ ] Auto-create conversation when booking is confirmed/declined
   - [ ] Auto-generated subject: "Re: A320 Simulator - March 15"

2. **Inbox Page** (`/messages`)
   - [ ] List all conversations
   - [ ] Unread badge counters
   - [ ] Last message preview
   - [ ] Filter by status (active/archived)

3. **Chat Thread View** (`/messages/[id]`)
   - [ ] WhatsApp-style message bubbles
   - [ ] Real-time updates (Supabase real-time subscriptions)
   - [ ] Message input + send button
   - [ ] Related booking info sidebar

4. **Notifications**
   - [ ] Email notification on new message
   - [ ] Platform notification bell (unread count)

---

### Phase 4: Smart Notifications (Days 5-6)
**Goal:** Match pilots to opportunities automatically

#### Pilot Preferences:
- [ ] `/settings` → "Preferences" tab
  - [ ] Aircraft types multi-select
  - [ ] Rating needs checkboxes
  - [ ] Preferred locations multi-select
  - [ ] Notification frequency (instant/daily/weekly)
  - [ ] "Available as copilot" toggle

#### Matching Engine:
- [ ] Backend function: `notifyMatchingPilots(slotId)`
  - [ ] Query pilots matching aircraft type + location
  - [ ] Filter by active users (logged in last 30 days)
  - [ ] Create notifications for matches
  - [ ] Send email alerts

#### Notifications Page:
- [ ] `/notifications` - list all notifications
- [ ] Notification bell in header (unread count)
- [ ] Mark as read on click
- [ ] Auto-delete after 30 days

#### Notification Types:
- [ ] `slot_match` - "A320 slot matches your profile!"
- [ ] `booking_request` - "New booking request from [Pilot]"
- [ ] `booking_confirmed` - "Your booking was confirmed!"
- [ ] `booking_declined` - "Booking declined: [reason]"
- [ ] `new_message` - "New message from [Provider]"

---

### Phase 5: Polish & Testing (Day 7)
- [ ] Email templates (all notification types)
- [ ] Mobile responsive (all pages)
- [ ] Loading states & error handling
- [ ] Test all user flows:
  - [ ] Pilot → Simulator booking (with/without examiner)
  - [ ] Pilot → Examiner booking
  - [ ] Pilot → AME booking
  - [ ] Provider confirms → DM unlocks
  - [ ] Provider declines → DM unlocks
  - [ ] Real-time messaging works
  - [ ] Notifications appear instantly
- [ ] Performance optimization (pagination, caching)

---

## 🎯 Key Features

### Smart Slot Reservation:
- Pilot requests → slot status = "pending" (24-48h hold)
- Provider confirms → slot status = "booked" (locked)
- Provider declines → slot status = "available" (released)
- Auto-expire if no response in 48h → slot released

### Partner Matching Logic:
```javascript
// Example: Pilot needs examiner, slot has examiner
if (pilot.needsExaminer && slot.examinerAvailable) {
  packagePrice = slot.basePrice + slot.examinerRate;
  showSuccess("Perfect match! Examiner included.");
}

// Example: Pilot needs examiner, slot doesn't have one
if (pilot.needsExaminer && !slot.examinerAvailable) {
  showWarning("This slot doesn't include examiner. You'll need to bring your own.");
}
```

### Notification Matching:
```javascript
// When slot is created, find matching pilots
const matches = pilots.filter(p => 
  p.aircraftTypes.includes(slot.aircraftType) &&
  p.preferredLocations.includes(slot.location) &&
  p.notificationEmail === true &&
  p.lastActiveWithin30Days
);

// Send notifications
matches.forEach(pilot => {
  createNotification(pilot.id, {
    type: 'slot_match',
    title: `${slot.aircraftType} slot matches your profile!`,
    linkTo: `/simulators/${slot.id}`
  });
  sendEmail(pilot.email, 'slot_match_template', slot);
});
```

---

## 📊 Success Metrics

**After Week 2:**
- [ ] 10+ booking requests sent
- [ ] 5+ bookings confirmed
- [ ] 20+ DM conversations started
- [ ] 50+ pilots set preferences
- [ ] 100+ notifications sent

---

## 🔐 Security Notes

**Already handled by migration:**
- ✅ RLS policies (pilots see their bookings, providers see theirs)
- ✅ Auth checks on all tables
- ✅ Triggers prevent race conditions (double-booking)

**Frontend validation needed:**
- [ ] Can't request already booked slot
- [ ] Can't spam booking requests (rate limiting)
- [ ] Message length limits (5000 chars)

---

## 🚀 Next Steps After MVP

### Phase 6: Advanced Features (Month 2)
- [ ] Reverse marketplace ("Looking For" board - pilots post needs)
- [ ] Copilot marketplace (pilots offer services as safety pilots)
- [ ] Calendar integration (sync bookings to Google Calendar)
- [ ] Booking reminders (email 24h before session)
- [ ] Rating/review system (after completed bookings)
- [ ] Package deals (3 pilots + 1 examiner bundle bookings)

### Phase 7: Monetization (Month 3)
- [ ] Provider subscriptions (€29/mo for premium placement)
- [ ] Lead tracking (providers see # of booking requests)
- [ ] Analytics dashboard (conversion rates, response times)
- [ ] Verified badges (manual verification by CrewLink team)

---

**Let's build! 🐙⚡**
