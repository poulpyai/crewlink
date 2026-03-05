# CrewLink

**Global aviation training marketplace - Connecting pilots with simulators, examiners, and medical services.**

## 🚀 Project Status

**Phase:** MVP Development (Week 1, Day 1)  
**Timeline:** 2 weeks  
**Launch Target:** February 24, 2026

---

## 🎯 What We're Building

### Core Features (MVP)
1. **Simulator Marketplace** - Real-time calendar, instant booking
2. **Examiner Directory** - TRE/TRI/SFE/SFI/FE/FI profiles with verification
3. **Training Partner Board** - Pilot-to-pilot matching for type ratings
4. **AME Directory** - Aviation medical examiners worldwide

### Competitive Advantage
- **Real-time booking** vs AviSim's manual request forms
- **Instant confirmation** vs email back-and-forth
- **Multi-service platform** vs fragmented solutions

---

## 🛠️ Tech Stack

- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend:** Supabase (PostgreSQL, Auth, Storage, Real-time)
- **Payments:** Stripe
- **Calendar:** FullCalendar.js
- **Icons:** Lucide React
- **Animations:** Framer Motion
- **Hosting:** Vercel (frontend) + Supabase (backend)

---

## 📁 Project Structure

```
crewlink/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth pages (login, signup)
│   ├── (main)/            # Main app pages
│   │   ├── simulators/    # Sim marketplace
│   │   ├── examiners/     # Examiner directory
│   │   ├── partners/      # Partner board
│   │   └── ame/           # AME directory
│   ├── api/               # API routes
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── ui/               # Base UI components
│   ├── calendar/         # Calendar components
│   ├── profiles/         # Profile cards/pages
│   └── booking/          # Booking flow
├── lib/                  # Utilities
│   ├── supabase/        # Supabase client
│   ├── stripe/          # Stripe integration
│   └── utils.ts         # Helper functions
├── types/               # TypeScript types
├── public/              # Static assets
└── docs/                # Project documentation
```

---

## 🚦 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account
- Stripe account (for payments)

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.local.example .env.local
# Edit .env.local with your credentials

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📊 Database Schema

See `docs/DATABASE-SCHEMA.md` for full schema.

**Main Tables:**
- `users` - All user types (pilot, examiner, sim_company, ame)
- `examiner_profiles` - TRE/TRI credentials
- `sim_companies` - Training center profiles
- `sim_slots` - Available simulator time slots
- `ame_profiles` - Medical examiner profiles
- `bookings` - All booking types
- `reviews` - Ratings & feedback
- `partner_requests` - Training partner posts

---

## 🎨 Design System

### Colors
- **Primary:** Aviation Blue (#0066CC)
- **Accent:** Cyan (#00D9FF)
- **Background:** Dark (#0A0A0A) / Light (#FFFFFF)

### Typography
- **Headings:** Geist / SF Pro Display
- **Body:** Inter / SF Pro Text

### Components
- Tailwind CSS for styling
- Custom component library in `/components/ui`
- Dark mode support

---

## 🔐 Security & Privacy

- Row Level Security (RLS) in Supabase
- Verification required for examiners (license upload)
- Privacy controls for pilot profiles
- Secure payment processing via Stripe
- GDPR compliant

---

## 📈 Development Timeline

### Week 1 (Feb 10-16)
- [x] Day 1: Project setup, design system
- [ ] Day 2: Supabase schema, auth
- [ ] Day 3-4: Simulator calendar
- [ ] Day 5-6: Examiner profiles
- [ ] Day 7: Integration & testing

### Week 2 (Feb 17-23)
- [ ] Day 8-9: Booking flow + Stripe
- [ ] Day 10: Partner board
- [ ] Day 11: AME directory
- [ ] Day 12: User profiles
- [ ] Day 13: Polish + Easter eggs
- [ ] Day 14: Testing + Deploy

---

## 🐙 Team

- **Q** - Product vision, pilot domain expert
- **Poulpy** - Full-stack development, design implementation

---

## 📚 Documentation

- `docs/PROJECT-PLAN.md` - Full project plan & market validation
- `docs/DATABASE-SCHEMA.md` - Complete database schema
- `docs/DESIGN-VISION.md` - Design system & UX decisions
- `docs/COMPETITIVE-RESEARCH.md` - Market analysis
- `docs/EXEC-SUMMARY.md` - Quick overview for stakeholders

---

## 🎮 Easter Eggs

Hidden aviation-themed features throughout the site. Find them all! 👀

---

## 📝 License

Proprietary - All rights reserved

---

**Let's build the future of aviation training. 🚀**
