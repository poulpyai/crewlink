# CrewLink - Aviation Training Marketplace

**Tagline:** "Connect. Train. Fly."

**Mission:** Connect pilots with simulators, examiners, and medical services worldwide.

---

## Market Validation

✅ **Validated with colleagues** - pilots find it "very interesting"  
✅ **Real pain point** - sim slot shortage (41% training delays documented)  
✅ **No competitor** - no existing global marketplace  
✅ **Willingness to pay** - "if data given is valuable"

---

## Core Features (MVP)

### For Pilots
- [ ] Search sim slots by location + aircraft type
- [ ] Find TRE/TRI examiners for check rides
- [ ] Find AMEs for medical renewals
- [ ] Filter by: location, date, aircraft type, price
- [ ] Book slots/examiners
- [ ] Reviews & ratings

### For Sim Companies
- [ ] List available slots
- [ ] Manage bookings
- [ ] Set pricing
- [ ] Track revenue

### For TRE/TRI Examiners
- [ ] Create profile (credentials, aircraft types, rates)
- [ ] Manage availability calendar
- [ ] Accept/decline bookings
- [ ] Reviews & ratings

### For AMEs (Aviation Medical Examiners)
- [ ] Directory listing
- [ ] Clinic locations
- [ ] Specializations
- [ ] Contact info

---

## Tech Stack

### Backend
- **Framework:** Node.js + Express
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth
- **Payments:** Stripe
- **Storage:** Supabase Storage (for documents, credentials)

### Frontend
- **Framework:** Next.js (React)
- **Styling:** Tailwind CSS
- **Maps:** Google Maps API (location search)
- **Calendar:** FullCalendar.js

### Infrastructure
- **Hosting:** Vercel (frontend) + Railway (backend)
- **Email:** Resend or SendGrid
- **Domain:** crewlink.io (to be purchased)

---

## Revenue Model (Hybrid)

### Free Tier
- Pilots: Free search & browse
- Examiners: Basic profile (1 listing)
- Sim companies: 1 free listing

### Paid Tier
- **Commission:** 10% on bookings (pilot pays, we collect, pay examiner/sim company 90%)
- **Examiner Pro:** $29/month (unlimited listings, calendar sync, analytics)
- **Sim Company Pro:** $99/month (unlimited slots, priority placement, analytics)
- **AME Listing:** $19/month (directory + booking system)

---

## MVP Timeline (2 Weeks)

### Week 1: Core Platform
**Days 1-2:** Database + Auth
- Supabase setup
- User roles: pilot, examiner, sim_company, ame
- Authentication flow

**Days 3-4:** Listing System
- Sim slot listings (CRUD)
- Examiner profiles (CRUD)
- AME directory

**Days 5-7:** Search & Browse
- Search by location, aircraft type, date
- Filters
- Basic UI/UX

### Week 2: Bookings + Launch
**Days 8-10:** Booking System
- Request booking
- Accept/decline
- Basic calendar

**Days 11-12:** Payments
- Stripe integration
- Commission split
- Invoicing

**Days 13-14:** Polish + Launch
- Reviews/ratings
- Email notifications
- Beta launch to 50 pilots

---

## Success Metrics

### Month 1 (Beta)
- 50 pilot signups
- 10 examiner profiles
- 5 sim company listings
- 3 bookings completed

### Month 3
- 200 pilots
- 30 examiners
- 15 sim companies
- 50 bookings ($10k GMV - gross merchandise value)

### Month 6
- 1,000 pilots
- 100 examiners
- 50 sim companies
- 500 bookings ($100k GMV, $10k revenue @ 10% commission)

---

## Legal & Compliance

### Required
- [ ] Terms of Service
- [ ] Privacy Policy
- [ ] Liability waiver (we're a marketplace, not training provider)
- [ ] Credential verification system (TRE/TRI certificates)
- [ ] Payment processor agreement (Stripe)

### Optional (Later)
- [ ] Insurance (E&O for marketplace)
- [ ] GDPR compliance (EU users)
- [ ] Business entity (LLC/Ltd)

---

## Competitive Advantages

1. **First Mover** - No existing global marketplace
2. **Pilot-Built** - You understand the pain
3. **Network Effect** - More examiners = more pilots = more sim companies
4. **Global from Day 1** - Not limited to one country/region
5. **Multi-Service** - Sims + Examiners + AMEs (not just one)

---

## Risks & Mitigation

### Risk 1: Chicken & Egg Problem
**Risk:** No pilots without examiners, no examiners without pilots  
**Mitigation:** Seed with 10-20 examiner profiles from your network first

### Risk 2: Sim Companies Don't Join
**Risk:** Big companies (CAE, L3) ignore us  
**Mitigation:** Start with smaller FTOs, independent operators, prove value

### Risk 3: Low Transaction Volume
**Risk:** Only 1-2 bookings per month  
**Mitigation:** Freemium model (listing fees, not just commission)

### Risk 4: Credential Fraud
**Risk:** Fake TRE/TRI profiles  
**Mitigation:** Manual verification of certificates before profile goes live

---

## Next Steps

1. **TODAY:** Set up project structure + database schema
2. **Tomorrow:** Build core listing system
3. **Week 1:** MVP functional
4. **Week 2:** Beta launch to pilot network

---

**Let's build this properly. No shortcuts. Real validation. Real execution.**
