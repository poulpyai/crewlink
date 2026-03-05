# CrewLink - Deep Competitive Research

**Research Date:** February 10, 2026 (07:55 SGT)  
**Researcher:** Poulpy (OpenClaw AI)  
**Scope:** Exhaustive competitive analysis before building

---

## 🚨 CRITICAL FINDING: Competitor Exists

### AviSim.com

**What They Do:**
- Digital marketplace for buying/selling professional aviation simulator training
- Sellers list excess simulator capacity
- Buyers find simulator hours and courses globally
- 250+ simulator operators listed
- 1000+ simulators on platform

**Launch Date:** November 23, 2017 (7+ years old)  
**Founder:** Lennart Torngren  
**Location:** Based in Luxembourg (AviSim AB)  
**Website:** https://avisim.com

**Evidence:**
- LinkedIn announcement: "Today we launched AviSim, a marketplace for buyers and sellers of professional aviation simulator training" - Nov 23, 2017
- Claims to connect 250+ simulator operators
- Claims 1000+ simulators worldwide
- Active website, modern design

---

## What AviSim Does (Confirmed)

✅ **Simulator slot booking**
- List available slots from training centers
- Search by aircraft type
- Global marketplace

✅ **Type rating courses**
- Full training packages
- Connect buyers with training organizations

✅ **Commercial aviation focus**
- References to LPC (License Proficiency Check)
- Airlines mentioned as target customers
- References to B737, A320, ATR72 in their content

---

## What AviSim Does NOT Do (Gaps Found)

❌ **No TRE/TRI examiner marketplace**
- No evidence of individual examiner profiles
- No examiner booking system
- Focus is on training centers, not independent examiners

❌ **No AME (Aviation Medical Examiner) directory**
- Zero mention of medical services
- No medical certificate renewal features

❌ **Unclear general aviation coverage**
- Website messaging targets airlines and professional pilots
- No clear focus on CPL/IR renewals for GA pilots
- No mention of FNPT/FTD (lower-level simulators common in GA)

❌ **No integrated review system visible**
- Unable to confirm if ratings/reviews exist for providers

❌ **No apparent examiner-pilot pairing**
- Platform seems to focus on packaged courses from training centers
- No evidence of independent TRE/TRI booking

---

## AviSim Business Intelligence

**Funding:** No funding data found on Crunchbase, TechCrunch, or venture databases  
**Revenue:** No public revenue data  
**Team Size:** Unknown (likely small, no large team visible on LinkedIn)  
**Market Traction:** Unknown (no user numbers published)  
**Growth:** No growth metrics available

**Assessment:** Likely bootstrapped, small operation. Lack of press/funding suggests:
- Either struggling to scale, OR
- Quietly profitable but not venture-scale, OR
- Niche player serving specific market segment

---

## Other Competitors Searched

### No Other Direct Competitors Found

**Searches Conducted:**
- "Flight simulator booking platform marketplace"
- "Aviation training marketplace startup"
- "TRE TRI examiner booking"
- "Simulator booking platform Europe Asia"
- Y Combinator aviation startups
- Crunchbase aviation training platforms
- Failed/shut down aviation marketplaces 2020-2026

**Result:** AviSim is the ONLY global simulator booking marketplace found.

**Training Companies Found (NOT competitors):**
- CAE, L3, FlightSafety (own simulators, direct booking)
- Avenger Flight Group, SimCom, Jetline Training
- Individual training centers with own booking

**Note:** These are training providers, NOT marketplaces. They compete with AviSim's suppliers, not AviSim itself.

---

## Patent & Trademark Search

**Searches:** No patents found for "simulator booking" or "aviation training marketplace"  
**Trademarks:** AviSim trademark not found in cursory search (not comprehensive)

**Legal Risk:** Low - marketplace models are generally not patentable  
**Brand Risk:** "CrewLink" appears unique (no conflicts found)

---

## Regulatory Barriers

**Research Conducted:**
- EASA training regulations: No specific marketplace regulations found
- FAA Part 141/142: Regulations apply to training providers, NOT marketplaces
- Liability: Marketplace model = lower liability (not providing training services)

**Assessment:**
✅ Low regulatory risk - we're connecting parties, not providing services  
✅ Standard marketplace legal (Terms, Privacy, liability waivers)  
⚠️ May need to verify examiner/training center credentials

---

## CrewLink Differentiation Strategy

### What We Can Do That AviSim Doesn't:

**1. TRE/TRI Examiner Marketplace**
- Individual examiner profiles
- Direct pilot-to-examiner booking
- Proficiency check scheduling
- Examiner reviews & ratings

**2. AME Directory & Booking**
- Aviation medical examiners worldwide
- Medical certificate renewals
- Specializations (Class 1, difficult cases, color blind)
- Clinic availability

**3. General Aviation Focus**
- CPL/IR renewals
- Private pilots
- FNPT/FTD/ATD bookings (not just full simulators)
- Smaller training centers

**4. True Worldwide Coverage**
- FAA (US), EASA (Europe), CASA (Australia), CAAS (Singapore), CAAC (China)
- Not just commercial aviation hubs

**5. Better UX/Tech**
- Modern tech stack (Next.js, Supabase vs their likely older platform)
- Mobile-first design
- Real-time availability
- Integrated payments (Stripe)
- Review system

---

## Market Size: Still Huge

**AviSim exists BUT:**
- Global pilot population: 750,000 US + 333,000+ commercial worldwide
- General aviation: Millions of pilots globally (mostly underserved)
- All pilots need annual renewals (recurring revenue)
- TRE/TRI market: Currently word-of-mouth/fragmented
- AME market: Government websites only (FAA locator = clunky)

**Market Reality:**
- AviSim has been around 7+ years
- Still only 250+ operators, 1000 simulators
- No evidence of market dominance
- Plenty of room for competition + differentiation

**Comparison:**
- Airbnb launched with Craigslist competition → won with better UX
- Uber launched with taxis → won with better experience
- We launch with AviSim → can win with examiner/AME features + GA focus

---

## Risk Assessment

### High Risks

❌ **AviSim has 7-year head start**
- Established relationships with training centers
- May have exclusivity agreements
- Brand recognition in commercial aviation space

❌ **Low barrier to entry if we succeed**
- AviSim could copy examiner/AME features
- Big training companies (CAE, L3) could build marketplace
- OpenAI/Anthropic could build this overnight (if aviation is strategic)

❌ **Network effects take time**
- Need examiners before pilots, pilots before examiners
- Chicken-and-egg problem (though Q's network helps)

### Medium Risks

⚠️ **Unknown: Why hasn't AviSim added examiners/AMEs?**
- Possible they tried and failed
- Possible there's no demand
- Possible regulatory issues
- Possible they're focused on bigger fish (airlines)

⚠️ **Monetization challenge**
- AviSim business model unknown (commission? listing fees?)
- If they're struggling financially, it's a red flag
- Need to validate pilots will pay for examiner booking

### Low Risks

✅ **No regulatory barriers found**  
✅ **No patents blocking us**  
✅ **Legal risk = low (marketplace model)**  
✅ **Tech = straightforward (no rocket science)**

---

## UPDATED ANALYSIS (Feb 10, 08:10 SGT)

### 🔥 CRITICAL DISCOVERY: AviSim's Fatal Weakness

**Q discovered their booking flow is manual request-based, not real-time:**

**AviSim Process (Verified):**
1. Pilot sends "booking request" (NON-BINDING)
2. Seller contacts pilot back via email
3. Manual negotiation offline
4. No payments through platform
5. Direct invoicing

**Source:** https://avisim.com/howitworks/

**This is a LEAD GENERATION platform, not a true booking system.**

### The Airbnb Moment

**This is the EXACT pattern that disrupts incumbents:**

- **Craigslist (2000s):** Email listings, meet up, negotiate → **Airbnb (2008):** Calendar, instant book, payments
- **Taxis (pre-2010):** Call dispatch, wait, pay cash → **Uber (2010):** App, see cars, book instantly
- **AviSim (2017):** Request form, email back-and-forth → **CrewLink (2026):** Real-time calendar, instant booking

**Why AviSim can't fix this:** Real-time booking requires rebuilding their entire platform. That's probably why they haven't done it in 7 years.

### CrewLink's Technical Advantage

✅ **Real-time calendar** - FullCalendar.js + WebSocket updates  
✅ **Instant booking** - Click slot, pay, confirmed  
✅ **Provider self-service** - Sim companies add/remove slots themselves  
✅ **Integrated payments** - Stripe 10% commission on real transactions  
✅ **Modern stack** - Next.js, Supabase real-time, mobile-first  

**Plus our unique features:** TRE/TRI examiners, AMEs, GA focus

---

## Go / No-Go Recommendation

### ✅ GO FOR FULL BUILD

**Reasoning:**

**FOR:**
1. ✅ Real problem exists (validated by Q + colleagues)
2. ✅ AviSim exists but doesn't cover our unique features (examiners, AMEs, GA)
3. ✅ Market is huge (millions of pilots worldwide)
4. ✅ No other competitors found
5. ✅ Q has unfair advantage (pilot network, insider knowledge)

**AGAINST:**
1. ❌ AviSim has 7-year head start
2. ❌ Unknown why they haven't added examiners/AMEs (could be a reason)
3. ❌ No evidence AviSim is wildly successful (could mean market issues)
4. ❌ Network effects take time to build

**MODIFIED STRATEGY RECOMMENDED:**

Instead of competing head-on with AviSim for simulator slots, **pivot to what they DON'T do:**

### Option A: Examiner-First Launch
- Launch ONLY TRE/TRI examiner marketplace first
- Add AMEs second
- Add simulator slots later (after proving examiner model works)
- Reduces direct competition with AviSim
- Tests unique value prop

### Option B: GA-Only Focus
- Target general aviation ONLY (not airlines)
- CPL/IR renewals, private pilots
- Smaller sims (FNPT, FTD vs full FFS)
- Examiners for GA
- Different market than AviSim's airline focus

### Option C: Geographic Niche
- Launch in Asia-Pacific first (Q's region)
- Singapore, Malaysia, Thailand, Philippines
- AviSim may have weak coverage
- Expand globally after proving model

### Option D: Build Anyway (High Risk)
- Build full platform as planned
- Better UX than AviSim
- Hope to compete and win
- Risk: Direct competition with established player

---

## Additional Research Needed

**Before committing to build:**

1. ✅ **Talk to AviSim users** - Are they satisfied? What's missing?
2. ✅ **Interview 5+ TRE/TRIs** - Would they list on a platform? Why/why not?
3. ✅ **Interview 5+ AMEs** - Would they want directory listing?
4. ✅ **Check AviSim pricing** - What do they charge? Can we undercut?
5. ✅ **Validate GA market** - Do GA pilots have trouble finding examiners/sims?

**Questions for Q:**
- Did your pilot colleagues know about AviSim when they said "very interesting"?
- Are they using AviSim now? If not, why not?
- Would CrewLink's examiner/AME features be enough differentiation?
- Are you willing to compete with a 7-year-old incumbent?

---

## Final Assessment

**AviSim exists, but there's still opportunity.**

The question isn't "Does a competitor exist?" (they do).

The question is: **"Can we build something better/different enough to win?"**

**My honest answer:** 🟡 **Maybe. But it's riskier than we thought.**

The good news: We found this BEFORE building (not halfway through like OneAgent).

**Recommendation:** 
- Don't abandon CrewLink
- But don't build the full vision yet
- **Start with MVP focused on what AviSim doesn't do** (examiners + AMEs)
- Validate THAT first
- Add sim slots later if examiner model works

This reduces risk while still pursuing the opportunity.

---

**Research Complete. Decision: Q's call.**
