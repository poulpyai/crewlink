# CrewLink Database Schema

## Core Tables

### 1. users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('pilot', 'examiner', 'sim_company', 'ame', 'admin')),
  license_number TEXT, -- For pilots/examiners
  license_type TEXT, -- CPL, ATPL, etc.
  country TEXT,
  timezone TEXT,
  phone TEXT,
  avatar_url TEXT,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2. examiner_profiles
```sql
CREATE TABLE examiner_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  bio TEXT,
  aircraft_types TEXT[], -- ['A320', 'B737', 'A330']
  examiner_types TEXT[], -- ['TRE', 'TRI', 'FE', 'FI']
  hourly_rate DECIMAL(10,2),
  location TEXT, -- City or airport code
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  available_for_travel BOOLEAN DEFAULT FALSE,
  certificate_url TEXT, -- Document upload
  certificate_verified BOOLEAN DEFAULT FALSE,
  rating DECIMAL(3,2) DEFAULT 0, -- 0-5 stars
  total_reviews INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3. sim_companies
```sql
CREATE TABLE sim_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  description TEXT,
  location TEXT NOT NULL,
  address TEXT,
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  phone TEXT,
  email TEXT,
  website TEXT,
  logo_url TEXT,
  rating DECIMAL(3,2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4. sim_slots
```sql
CREATE TABLE sim_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sim_company_id UUID REFERENCES sim_companies(id) ON DELETE CASCADE,
  aircraft_type TEXT NOT NULL, -- 'A320', 'B737', etc.
  simulator_name TEXT, -- 'Sim 1', 'FFS-A320-001'
  simulator_level TEXT, -- 'FFS', 'FTD', 'FNPT'
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_hours DECIMAL(4,2),
  price_per_hour DECIMAL(10,2),
  total_price DECIMAL(10,2),
  includes TEXT, -- 'Instructor included', 'Self-study'
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'booked', 'pending', 'cancelled')),
  booked_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 5. ame_profiles
```sql
CREATE TABLE ame_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  clinic_name TEXT NOT NULL,
  address TEXT NOT NULL,
  location TEXT NOT NULL,
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  phone TEXT NOT NULL,
  email TEXT,
  website TEXT,
  certifications TEXT[], -- ['FAA', 'EASA', 'CASA']
  specializations TEXT[], -- ['Class 1', 'Difficult cases', 'Color blind', etc.]
  languages TEXT[],
  rating DECIMAL(3,2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 6. bookings
```sql
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('sim_slot', 'examiner', 'ame')),
  
  -- References (nullable, depends on type)
  sim_slot_id UUID REFERENCES sim_slots(id),
  examiner_id UUID REFERENCES examiner_profiles(id),
  ame_id UUID REFERENCES ame_profiles(id),
  
  -- Parties
  pilot_id UUID REFERENCES users(id) NOT NULL,
  
  -- Booking details
  date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  aircraft_type TEXT, -- For examiner bookings
  service_type TEXT, -- 'Type rating', 'IR renewal', 'Proficiency check'
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'disputed')),
  
  -- Payment
  price DECIMAL(10,2) NOT NULL,
  commission DECIMAL(10,2), -- Our 10%
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  stripe_payment_intent_id TEXT,
  
  -- Communication
  notes TEXT,
  cancellation_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 7. reviews
```sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES users(id),
  reviewee_id UUID REFERENCES users(id), -- Examiner or sim company user
  reviewee_type TEXT CHECK (reviewee_type IN ('examiner', 'sim_company', 'ame')),
  
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 8. availability (for examiners)
```sql
CREATE TABLE availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  examiner_id UUID REFERENCES examiner_profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'booked', 'blocked')),
  recurring BOOLEAN DEFAULT FALSE,
  recurring_pattern TEXT, -- 'weekly', 'monthly'
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 9. notifications
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'booking_request', 'booking_confirmed', 'review_received'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Indexes

```sql
-- Performance indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

CREATE INDEX idx_examiner_aircraft ON examiner_profiles USING GIN(aircraft_types);
CREATE INDEX idx_examiner_location ON examiner_profiles(location);
CREATE INDEX idx_examiner_active ON examiner_profiles(active) WHERE active = TRUE;

CREATE INDEX idx_sim_slots_date ON sim_slots(date);
CREATE INDEX idx_sim_slots_aircraft ON sim_slots(aircraft_type);
CREATE INDEX idx_sim_slots_status ON sim_slots(status) WHERE status = 'available';

CREATE INDEX idx_bookings_pilot ON bookings(pilot_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_type ON bookings(type);

CREATE INDEX idx_reviews_reviewee ON reviews(reviewee_id, reviewee_type);
```

---

## Row Level Security (RLS)

```sql
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE examiner_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sim_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE sim_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE ame_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policies (examples)

-- Users can read their own data
CREATE POLICY users_select ON users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own data
CREATE POLICY users_update ON users
  FOR UPDATE USING (auth.uid() = id);

-- Everyone can read active examiner profiles
CREATE POLICY examiners_select ON examiner_profiles
  FOR SELECT USING (active = TRUE);

-- Examiners can update their own profile
CREATE POLICY examiners_update ON examiner_profiles
  FOR UPDATE USING (user_id = auth.uid());

-- Everyone can read available sim slots
CREATE POLICY sim_slots_select ON sim_slots
  FOR SELECT USING (status = 'available' OR booked_by = auth.uid());

-- Sim companies can manage their slots
CREATE POLICY sim_slots_all ON sim_slots
  FOR ALL USING (
    sim_company_id IN (
      SELECT id FROM sim_companies WHERE user_id = auth.uid()
    )
  );

-- Pilots can read their bookings
CREATE POLICY bookings_select ON bookings
  FOR SELECT USING (pilot_id = auth.uid());

-- Reviews are public
CREATE POLICY reviews_select ON reviews
  FOR SELECT USING (TRUE);
```

---

## Initial Data / Seed

```sql
-- Admin user (manually created via Supabase Auth)
-- Then update role:
UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';

-- Sample aircraft types reference (could be separate table)
-- A320, A330, A350, A380, B737, B747, B777, B787, CRJ, E190, ATR72, etc.
```

---

## Notes

- Use Supabase Auth for user management
- All timestamps in UTC
- Use PostGIS extension for geolocation if needed (future)
- Stripe customer_id and payment_intent_id stored in bookings
- Document uploads (certificates) stored in Supabase Storage
