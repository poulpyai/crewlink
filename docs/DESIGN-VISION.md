# CrewLink - Design Vision & Implementation Plan

**Date:** February 10, 2026  
**Research Time:** 1 hour deep dive into marketplace UX best practices  
**Sources:** 20+ top marketplace designs analyzed (Airbnb, Fiverr, Upwork, aviation sites)

---

## 🎨 Design Philosophy

**Core Principle:** "Aviation meets modern tech"
- Clean, professional, trust-building
- Dark mode aesthetic with aviation blue accents
- Minimal but not minimal-ist (functional elegance)
- Fast, responsive, mobile-first
- Hidden delights (Easter eggs) for engaged users

---

## 📋 Your Vision Refined

### 1. **Find Examiner** (Priority 1)
**Visual:** Profile bubble grid (like Airbnb hosts)
- Large profile photos
- Key info overlay (rating, location, aircraft types)
- Hover → more details
- Click → full profile + booking

**Verification System:**
- ✅ Upload license photo
- ✅ Enter examiner number (TRE/TRI/SFE/SFI/FE/FI)
- ✅ Admin verification badge
- ✅ Types: TRE, TRI, SFE, SFI, FE, FI (all examiner types covered)

**Filters:**
- Location (map or radius search)
- Aircraft type (dropdown with icons)
- License type (PPL, CPL, ATPL, IR, etc.)
- Availability (date range picker)
- Rating (stars)
- Price range

**Profile includes:**
- Photo, name, credentials
- Examiner number + verification badge
- Aircraft types qualified (with icons)
- Reviews & ratings (5-star + written)
- Availability calendar
- Rates (per hour or flat fee)
- Bio
- Contact/book button

---

### 2. **Find Simulator** (Priority 1 - Killer Feature)
**Visual:** Calendar-first layout (our competitive advantage)

**Demo/Example Mode (Since we start empty):**
- Toggle: "View Example" button
- Loads mock data from major training centers
- "These are examples. Be the first to list!" banner
- Allows users to understand the interface before signup

**Live Calendar View:**
- Main area: Calendar showing available slots
- Color-coded by availability (green=available, yellow=limited, red=booked)
- Hover slot → popup with details (aircraft, price, time)
- Click slot → booking modal

**Top Filters:**
- Location
- Aircraft type
- Date range
- Price range
- Simulator type (FFS, FTD, FNPT, ATD)

**Sim Company Self-Service:**
- Dashboard to create/edit/delete slots
- Drag-and-drop calendar interface
- Set pricing, availability, restrictions
- View bookings, revenue, analytics

---

### 3. **Find Partner** (Priority 2)
**Visual:** Request board (like job board or Reddit feed)

**Post Format:**
```
[Profile pic] John Doe | ⭐ 4.8 (12 reviews)
Looking for: Type Rating Partner - B737
Location: London, UK
Dates: March 15-25, 2026
Experience: 2000hrs, CPL + IR, Previous type: A320
About: Looking for serious partner to split costs...
Tags: [B737] [Type Rating] [Europe] [Cost-Split]
[Contact] [View Profile]
```

**Pilot Profiles (Privacy-Controlled):**
- Pilots choose what's public:
  - ✅ Name & photo (optional)
  - ✅ Experience level & hours (optional)
  - ✅ Licenses held (optional)
  - ✅ Reviews from examiners/partners (always public if exist)
  - ✅ Contact method (direct or through platform)
- Default: Minimal public profile, full profile visible only when posting request

**Features:**
- Post your own "looking for partner" request
- Browse feed with filters (location, aircraft type, date, experience)
- Direct messaging between interested pilots
- Upvote/downvote system (optional, for relevance)
- Archive old requests automatically after dates pass

---

### 4. **Find AME** (Medical Examiners)
**Phase 1 (MVP):** Simple list/grid view with filters
- Cards with photo, name, location, classes certified
- Filter by country, license class (1/2/3), specializations
- Click → full profile with contact info

**Phase 2 (Post-Launch):** Interactive globe
- Google Maps/Mapbox integration
- Pins showing AME locations
- Click pin → popup with details
- Zoom to region → see clustered markers
- Toggle between map view and list view

**AME Profile:**
- Photo, name, clinic name
- Location (city, country)
- License classes certified (Class 1, 2, 3)
- Specializations (color blind, difficult cases, BasicMed, etc.)
- Languages spoken
- Availability/booking calendar
- Reviews & ratings
- Contact info or book appointment button

---

## 🎯 User Profile System

**Yes, absolutely need user profiles.** Here's the structure:

### **Pilot Profile**
**Public (if pilot chooses):**
- Name (or username)
- Profile photo (optional)
- Total flight hours (optional)
- Licenses held (optional)
- Aircraft types flown (optional)
- Reviews received (from examiners, training partners)

**Private (always):**
- Email, phone
- License documents
- Booking history
- Payment info
- Messages
- Saved searches
- Wishlist (saved examiners, sims, etc.)

**Profile Settings:**
- Privacy controls (toggle what's public)
- Notification preferences
- Email alerts (new sims available, examiner replied, etc.)

---

### **Examiner Profile**
**Public (always):**
- Name, photo
- Credentials (verified badge)
- Examiner number
- Aircraft types qualified
- Reviews & ratings
- Availability calendar
- Rates
- Bio

**Private:**
- License document (uploaded for verification)
- Booking history
- Earnings/payouts
- Messages
- Analytics (profile views, bookings)

---

### **Sim Company Profile**
**Public:**
- Company name, logo
- Location(s)
- Fleet (simulators available)
- Photos of facilities
- Reviews & ratings
- Contact info

**Private:**
- Slot management dashboard
- Bookings & revenue
- Analytics
- Messages

---

### **AME Profile**
**Public:**
- Name, photo, clinic name
- Location
- Classes certified
- Specializations
- Languages
- Availability
- Reviews
- Contact/booking

**Private:**
- License documents
- Appointment bookings
- Analytics

---

## 🏗️ Site Structure (Information Architecture)

```
Homepage
├── Hero: "Book simulators, examiners, partners, and medical renewals"
├── Quick search bar (smart detection)
├── 4 main sections as cards
└── How it works (for empty state)

Main Navigation
├── Find Simulator
├── Find Examiner  
├── Find Partner
├── Find AME

User Menu (dropdown)
├── My Profile
├── My Bookings
├── My Requests (if pilot)
├── My Listings (if examiner/sim company/AME)
├── Messages
├── Settings
└── Logout

Footer
├── About
├── How It Works
├── Pricing
├── Trust & Safety
├── Help/FAQ
├── Contact
├── Terms & Privacy
└── [Easter Egg hidden here] 👀
```

---

## 🎨 Visual Design Research (Best Practices)

### **Top Marketplace UX Patterns (From Research):**

**1. Airbnb-style Discovery**
- Large, high-quality photos
- Clear pricing
- Trust signals (reviews, verification badges)
- Easy filtering
- Save for later / wishlist

**2. Fiverr-style Profiles**
- Profile cards with key info upfront
- Hover states for more details
- Clear CTAs
- Ratings prominently displayed

**3. Upwork-style Request Boards**
- Feed of posts
- Filters & sorting
- Direct messaging
- Profile snippets with links to full profiles

**4. Stripe/Linear-style Modern UI**
- Dark mode with blue/cyan accents
- Clean typography (Inter, SF Pro, or Geist)
- Generous white space
- Subtle animations
- Fast perceived performance

---

### **Aviation Website Inspiration:**

**Joby Aviation (Best-in-class aviation web design):**
- Clean, modern, future-forward
- Electric blue accents on dark/light backgrounds
- Smooth animations
- Generous white space
- Premium feel

**Key Takeaways:**
- Use aviation blue (#0066CC or similar) as accent color
- Aircraft icons for type ratings
- Wing/runway motifs (subtle, not cheesy)
- Professional photography
- Trust signals everywhere (this is safety-critical industry)

---

## 🎮 Easter Eggs (Aviation-Themed)

**Examples from research:**
- Konami Code unlocks hidden features
- Click sequences reveal hidden content
- Hover effects on specific elements
- Hidden games/animations

**Aviation-Themed Ideas for CrewLink:**

1. **"Do a barrel roll" (Google-style)**
   - Type "barrel roll" in search → entire site does 360° roll animation
   - Aviation reference + fun

2. **Konami Code → Flight Sim Mini-Game**
   - Up, Up, Down, Down, Left, Right, Left, Right, B, A
   - Unlocks simple flying mini-game in corner
   - High score board for users

3. **Hidden Pilot Wings**
   - Click logo 7 times fast → pilot wings badge appears on profile
   - Achievement unlocked: "Curious Navigator"

4. **Footer Morse Code**
   - Footer contains morse code (in dots/dashes)
   - Translates to aviation quote or fun message
   - Example: "Blue skies and tailwinds" in morse

5. **404 Page Easter Egg**
   - 404 error shows "Lost in the pattern?"
   - Mini ATC radio chatter plays: "Uh, CrewLink tower, we seem to have lost [page name]..."
   - Funny aviation-themed 404 messages

6. **METAR Weather Widget**
   - Hidden weather widget showing METAR for your location
   - Click weather icon in corner → pops up
   - Easter egg for pilots who know METAR codes

7. **Aircraft Flyby Animation**
   - Random chance (1%) when loading page
   - Small aircraft flies across screen
   - Leaves contrail that fades
   - Subtle, not annoying

8. **Dark Mode Toggle Animation**
   - Switching to dark mode shows sunset animation
   - Switching to light mode shows sunrise
   - 2-second smooth transition

**Implementation Notes:**
- Easter eggs should be discoverable but not obvious
- Never interfere with core functionality
- Should work on mobile too
- Track discovery rate in analytics (fun metric)

---

## 📱 Mobile-First Approach

**From research: Mobile is baseline, not afterthought.**

### **Mobile Considerations:**

**Navigation:**
- Hamburger menu with nested categories
- Bottom navigation bar for main sections
- Floating action button for quick actions

**Calendar (Mobile):**
- Swipeable week/day view
- Tap slot → booking modal
- Filters in slide-up drawer

**Profile Cards:**
- Vertical stacking (not horizontal)
- Larger touch targets
- Swipeable image galleries

**Forms:**
- Autofill support
- Input logic (card formatting, postal codes)
- Error states inline (not at top)
- Progress indicators for multi-step flows

**Performance:**
- Lazy loading images
- Skeleton states while loading
- Optimistic UI updates
- Service worker for offline support

---

## 🔒 Trust & Safety Features

**Critical for marketplace success (from UX research):**

### **Verification Badges:**
- ✅ Examiner verified (license checked)
- ✅ Email verified
- ✅ Phone verified
- ✅ Background check completed (optional, Phase 2)

### **Review System:**
- 5-star ratings
- Written reviews
- Response from service provider
- Verified booking badge (can only review after actual booking)
- Report inappropriate review

### **Safety Features:**
- Report user/listing button
- Block user
- Secure messaging (no sharing contact info until booking confirmed)
- Escrow payments (money held until service completed)
- Dispute resolution process

### **Transparency:**
- Clear refund/cancellation policies
- Delivery/service timeline expectations
- Terms prominently displayed
- Privacy policy (GDPR compliant)

---

## 🎨 Design System (Technical)

### **Color Palette:**
```
Primary: Aviation Blue (#0066CC)
Accent: Cyan (#00D9FF)
Success: Green (#00C853)
Warning: Amber (#FFC107)
Error: Red (#FF3B30)

Dark Mode:
Background: #0A0A0A
Surface: #1A1A1A
Text: #FFFFFF
Secondary Text: #A0A0A0

Light Mode:
Background: #FFFFFF
Surface: #F5F5F5
Text: #0A0A0A
Secondary Text: #6B6B6B
```

### **Typography:**
```
Headings: Geist (or SF Pro Display)
Body: Inter (or SF Pro Text)
Mono: Geist Mono (for data, codes)

Sizes:
H1: 48px (desktop), 32px (mobile)
H2: 36px, 28px
H3: 24px, 20px
Body: 16px, 14px
Small: 14px, 12px
```

### **Spacing:**
```
8px base unit
Spacing scale: 4, 8, 12, 16, 24, 32, 48, 64, 96
Border radius: 8px (cards), 4px (buttons), 16px (modals)
```

### **Icons:**
- Lucide Icons (React) - clean, aviation-friendly
- Custom aircraft icons (SVG, created/sourced)

### **Animations:**
- Framer Motion for page transitions
- 200ms for micro-interactions
- 300ms for larger transitions
- Easing: ease-out for most interactions

---

## 🚀 MVP Implementation Priorities

### **Week 1: Core Platform (Days 1-7)**

**Day 1-2: Foundation**
- ✅ Next.js + Tailwind setup
- ✅ Supabase schema + auth
- ✅ Design system implementation (colors, typography, components)
- ✅ Navigation structure

**Day 3-4: Sim Marketplace**
- ✅ Calendar component (FullCalendar.js)
- ✅ Slot creation (sim company dashboard)
- ✅ Search & filters
- ✅ "Example mode" toggle with mock data

**Day 5-6: Examiner Marketplace**
- ✅ Profile cards grid
- ✅ Examiner profile page
- ✅ Verification upload (license photo + number)
- ✅ Basic search & filters

**Day 7: Integration**
- ✅ Connect auth to both marketplaces
- ✅ Test flows
- ✅ Bug fixes

---

### **Week 2: Booking + Launch (Days 8-14)**

**Day 8-9: Booking System**
- ✅ Booking modal/flow
- ✅ Stripe integration
- ✅ Payment processing
- ✅ Confirmation emails

**Day 10: Partner Board**
- ✅ Request feed
- ✅ Post request form
- ✅ Pilot profiles (with privacy controls)

**Day 11: AME Directory**
- ✅ AME profile cards (list view)
- ✅ Filters (country, class, specializations)
- ✅ Basic profile page
- ⚠️ Globe view = Phase 2

**Day 12: User Profiles**
- ✅ Profile pages (pilot, examiner, sim company, AME)
- ✅ Privacy settings
- ✅ My bookings page
- ✅ My listings page (for service providers)

**Day 13: Polish + Easter Eggs**
- ✅ Review system
- ✅ Messaging (basic in-platform chat)
- ✅ 2-3 Easter eggs implemented
- ✅ Mobile responsive testing

**Day 14: Testing + Deploy**
- ✅ Full flow testing
- ✅ Bug fixes
- ✅ Performance optimization
- ✅ Deploy to production

---

## 📊 Success Metrics (UX-Focused)

**To track if design is working:**

### **Discovery:**
- Time to first search result
- Filter usage rate
- Search abandonment rate

### **Engagement:**
- Profile view rate
- Click-through rate (search → profile)
- Bounce rate per section

### **Conversion:**
- Booking completion rate
- Cart abandonment rate
- Time to complete booking

### **Trust:**
- Review submission rate
- Verification badge display rate
- Report/block usage (lower = better)

### **Retention:**
- Return visit rate
- Saved items usage
- Repeat booking rate

### **Easter Eggs (Fun):**
- Discovery rate per egg
- Share rate (if users share eggs on social)

---

## 🎯 Phase 2 Enhancements (Post-MVP)

**After validating core product:**

1. **AME Globe Visualization** (Interactive map)
2. **Advanced Messaging** (Real-time chat, attachments)
3. **Mobile Apps** (iOS + Android native)
4. **Bundled Bookings** (Book sim + examiner + partner in one flow)
5. **Unified Search** (One search bar, smart detection, all results)
6. **Analytics Dashboard** (For service providers)
7. **Recurring Bookings** (For regular training)
8. **Group Bookings** (Multi-pilot courses)
9. **Ratings & Badges System** (Gamification)
10. **Advanced Easter Eggs** (More hidden features)

---

## ✅ Summary: Does This Match Your Vision?

**Your vision:**
- ✅ Find Examiner (bubble grid with filters)
- ✅ Find Simulator (live calendar, killer feature)
- ✅ Find Partner (request board)
- ✅ Find AME (list view Phase 1, globe Phase 2)
- ✅ Verification system (license upload + examiner number)
- ✅ User profiles (with privacy controls)
- ✅ Example/demo mode (for empty state)
- ✅ Easter eggs (aviation-themed)
- ✅ Modern, clean, professional design

**Additional refinements:**
- ✅ Trust & safety features (reviews, badges, reporting)
- ✅ Mobile-first responsive design
- ✅ Dark mode aesthetic
- ✅ Full design system defined
- ✅ Clear 2-week build timeline
- ✅ Phase 2 roadmap

---

**Ready to build when you are. 🐙**

Rest well, we launch in 2 weeks!
