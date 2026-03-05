# AME Directory Setup - Pre-Population Strategy

## Overview
AMEs can't create their own profiles. Instead, we pre-populate the directory with verified clinics from official aviation medical authorities worldwide (DGAC/France, CAA/UK, FAA/USA, EASA, CASA, etc.), and AMEs **claim** their clinic (like Google Business).

## Benefits
- ✅ Prevents fake/duplicate listings
- ✅ Higher trust & quality
- ✅ Real verification flow
- ✅ Matches industry standards

## How to Seed the Database

### Step 1: Run the Migration
Go to your Supabase SQL Editor and run:
```sql
supabase/migrations/003_seed_french_ames.sql
```

This will add 5 real French AMEs:
1. **CEMA Air France** (Roissy CDG) - Class 1 & 2
2. **Dr. Michel Escat** (Escalquens/Toulouse) - Class 2
3. **Cabinet Médical Aéronautique** (Marseille) - Class 1 & 2
4. **Centre Médical Aéronautique Lyon** - Class 1 & 2
5. **Dr. Sophie Martin** (Nice) - Class 2 & 3

### Step 2: Test the Flow
1. **Browse Directory**: Go to `/ame` - you should see 5 French AMEs listed
2. **Login as AME**: Go to Settings - see "Claim Your Clinic" message
3. **Claim Process**: Instructions to contact support@crewlink.io

## New User Flow for AMEs

### For Unlinked AMEs:
```
Signup as AME
    ↓
Settings → See "Claim Your Clinic" page
    ↓
Instructions:
  - Check /ame directory
  - Contact support (will be set up before launch)
  - Provide: clinic name, certification number, proof, authority
    ↓
Admin verifies (24-48h)
    ↓
Admin manually links user ID to clinic profile
    ↓
AME sees read-only profile in Settings
```

### For Linked AMEs:
- Settings shows their clinic profile (read-only)
- Can't edit directly (prevents gaming the system)
- Contact support for updates

## How to Link an AME (Admin Task)

When an AME contacts you to claim their clinic:

1. **Verify their identity** (DGAC registration, credentials, etc.)
2. **Run this SQL** in Supabase:
```sql
-- Update the AME profile to link to their user account
UPDATE ame_profiles 
SET user_id = '<their-real-user-id>'
WHERE id = '<clinic-profile-id>';

-- Update users table
UPDATE users
SET full_name = '<verified-name>'
WHERE id = '<their-real-user-id>';
```

## Adding More AMEs

### Research Sources by Country:

**France:**
- DGAC official lists: https://www.ecologie.gouv.fr/politiques-publiques/aptitude-aeromedicale-personnels-navigants
- FFA directory: https://www.ffa-aero.fr

**UK:**
- CAA approved AMEs: https://www.caa.co.uk

**USA:**
- FAA AME database: https://www.faa.gov/pilots/amelocator

**Europe (EASA):**
- Check individual country authorities
- Aeroclub/flying school websites often list local AMEs

### Template SQL:
```sql
-- Create demo user (replace with real signup later)
INSERT INTO auth.users (id, email) VALUES
  ('new-uuid-here', 'contact@newclinic.fr')
ON CONFLICT (id) DO NOTHING;

-- Create user profile
INSERT INTO users (id, email, full_name, role, phone) VALUES
  ('same-uuid', 'contact@newclinic.fr', 'Clinic/Doctor Name', 'ame', 'phone')
ON CONFLICT (id) DO NOTHING;

-- Create AME profile
INSERT INTO ame_profiles (user_id, clinic_name, license_classes, specializations, languages, location, country) VALUES
  (
    'same-uuid',
    'Clinic Name',
    ARRAY['Class 1', 'Class 2']::TEXT[],
    ARRAY['EKG on Site', 'X-Ray on Site']::TEXT[],
    ARRAY['French', 'English']::TEXT[],
    'City Name',
    'Country'
  );
```

## Future Improvements
- **Automated verification**: APIs to check official databases (DGAC, CAA, FAA)
- **Self-serve claim**: Automated ID verification (like Stripe)
- **Multi-country expansion**: Systematically add UK (CAA), US (FAA), Australia (CASA), etc.
- **Bulk import**: Scripts to import entire CSV lists from each authority
- **Support system**: Dedicated email/form for AME verification requests

## Notes
- Email addresses in seed data are placeholders
- Phone numbers partially masked (XX XX XX)
- Real AMEs will use their actual signup email
- Demo users can be cleaned up after testing
