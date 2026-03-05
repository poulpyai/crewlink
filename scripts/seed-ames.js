/**
 * Seed AME profiles from official aviation medical authority lists
 * Run once: node scripts/seed-ames.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env.local manually (no dotenv dependency needed)
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...value] = line.split('=');
  if (key && value.length) {
    env[key.trim()] = value.join('=').trim();
  }
});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY // Uses service role to bypass RLS
);

const frenchAmes = [
  {
    id: 'a1111111-1111-1111-1111-111111111111',
    email: 'contact@caema-marcq.fr',
    fullName: 'Dr. Pascal Dudenko',
    phone: '03 20 56 03 74',
    clinicName: 'CAEMA - Centre Aéronautique d\'Expertise Médicale Aéronautique',
    certificationAuthorities: ['EASA'], // DGAC = EASA Part-MED
    licenseClasses: ['Class 1'],
    specializations: ['EKG on Site', 'X-Ray on Site'],
    languages: ['French', 'English'],
    location: 'Marcq-en-Baroeul (Lille area)',
    country: 'France'
  },
  {
    id: 'a2222222-2222-2222-2222-222222222222',
    email: 'contact@cea-bordeaux.fr',
    fullName: 'Cabinet Médical d\'Expertise Libéral Aéronautique',
    phone: '06 31 87 22 43',
    clinicName: 'Cabinet Médical d\'Expertise Libéral Aéronautique',
    certificationAuthorities: ['EASA'],
    licenseClasses: ['Class 1'],
    specializations: ['EKG on Site', 'Same Day Appointments'],
    languages: ['French', 'English'],
    location: 'Bordeaux-Mérignac Airport',
    country: 'France'
  },
  {
    id: 'a3333333-3333-3333-3333-333333333333',
    email: 'dr.bernard@aviation-medical.fr',
    fullName: 'Dr. François Bernard',
    phone: '07 49 67 87 28',
    clinicName: null,
    certificationAuthorities: ['EASA'],
    licenseClasses: ['Class 1'],
    specializations: ['Same Day Appointments'],
    languages: ['French'],
    location: 'Milly-la-Forêt (Paris South)',
    country: 'France'
  },
  {
    id: 'a4444444-4444-4444-4444-444444444444',
    email: 'contact@cea-dijon.fr',
    fullName: 'Dr. Paolo Inghilleri',
    phone: '03 45 42 50 81',
    clinicName: 'Cabinet d\'Evaluation Aéro-Médicale Dijon-Bourgogne',
    certificationAuthorities: ['EASA'],
    licenseClasses: ['Class 1'],
    specializations: ['EKG on Site', 'X-Ray on Site'],
    languages: ['French', 'English'],
    location: 'Dijon',
    country: 'France'
  },
  {
    id: 'a5555555-5555-5555-5555-555555555555',
    email: 'dr.plevert@aviation-medical.fr',
    fullName: 'Dr. Thomas Plevert',
    phone: '03 28 26 05 47',
    clinicName: null,
    certificationAuthorities: ['EASA'],
    licenseClasses: ['Class 1'],
    specializations: ['Same Day Appointments'],
    languages: ['French'],
    location: 'Uxem (Nord)',
    country: 'France'
  },
  {
    id: 'a6666666-6666-6666-6666-666666666666',
    email: 'dr.ciboulet@aviation-medical.fr',
    fullName: 'Dr. Philippe Ciboulet',
    phone: '07 89 21 80 98',
    clinicName: null,
    certificationAuthorities: ['EASA'],
    licenseClasses: ['Class 1'],
    specializations: ['Same Day Appointments'],
    languages: ['French'],
    location: 'Douvaine (near Geneva)',
    country: 'France'
  },
  {
    id: 'a7777777-7777-7777-7777-777777777777',
    email: 'dr.lely@aviation-medical.fr',
    fullName: 'Dr. Laurent Lely',
    phone: '06 30 22 72 93',
    clinicName: 'Cabinet d\'Expertise Médicale en Médecine Aéronautique de Cornouaille',
    certificationAuthorities: ['EASA'],
    licenseClasses: ['Class 1'],
    specializations: ['Same Day Appointments'],
    languages: ['French'],
    location: 'Quimperlé (Brittany)',
    country: 'France'
  },
  {
    id: 'a8888888-8888-8888-8888-888888888888',
    email: 'contact@chru-nancy-sport.fr',
    fullName: 'Dr. Bruno Chenuel',
    phone: '03 83 15 55 20',
    clinicName: 'Centre Universitaire de Médecine du Sport - CHRU Nancy',
    certificationAuthorities: ['EASA'],
    licenseClasses: ['Class 1'],
    specializations: ['EKG on Site', 'X-Ray on Site', 'Difficult Cases'],
    languages: ['French', 'English'],
    location: 'Vandoeuvre-lès-Nancy',
    country: 'France'
  }
];

async function seedAmes() {
  console.log('🏥 Seeding AME profiles...\n');

  let successCount = 0;
  let skipCount = 0;

  for (const ame of frenchAmes) {
    try {
      // Check if already exists
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('id', ame.id)
        .single();

      if (existing) {
        console.log(`⏭️  Skipping ${ame.fullName} (already exists)`);
        skipCount++;
        continue;
      }

      // Insert user
      const { error: userError } = await supabase
        .from('users')
        .insert([{
          id: ame.id,
          email: ame.email,
          full_name: ame.fullName,
          role: 'ame',
          phone: ame.phone
        }]);

      if (userError) throw userError;

      // Insert AME profile
      const { error: ameError } = await supabase
        .from('ame_profiles')
        .insert([{
          user_id: ame.id,
          clinic_name: ame.clinicName,
          license_classes: ame.licenseClasses,
          certification_authorities: ame.certificationAuthorities,
          specializations: ame.specializations,
          languages: ame.languages,
          location: ame.location,
          country: ame.country
        }]);

      if (ameError) throw ameError;

      console.log(`✅ Added ${ame.fullName} (${ame.location})`);
      successCount++;

    } catch (error) {
      console.error(`❌ Failed to add ${ame.fullName}:`, error.message);
    }
  }

  console.log(`\n🎉 Done! Added ${successCount} AMEs, skipped ${skipCount}`);
}

// Run
seedAmes()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
