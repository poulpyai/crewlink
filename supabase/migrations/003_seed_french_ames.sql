-- Seed French AMEs (Aviation Medical Examiners)
-- Data sourced from official DGAC list dated 29/01/2026
-- Source: https://www.ecologie.gouv.fr (official French government aviation authority)

-- Note: These are placeholder user IDs - in production, admin would link real user accounts

-- Insert demo users for AMEs (Class 1 certified - official DGAC list)
INSERT INTO auth.users (id, email) VALUES
  ('a1111111-1111-1111-1111-111111111111', 'contact@caema-marcq.fr'),
  ('a2222222-2222-2222-2222-222222222222', 'contact@cea-bordeaux.fr'),
  ('a3333333-3333-3333-3333-333333333333', 'dr.bernard@aviation-medical.fr'),
  ('a4444444-4444-4444-4444-444444444444', 'contact@cea-dijon.fr'),
  ('a5555555-5555-5555-5555-555555555555', 'dr.plevert@aviation-medical.fr'),
  ('a6666666-6666-6666-6666-666666666666', 'dr.ciboulet@aviation-medical.fr'),
  ('a7777777-7777-7777-7777-777777777777', 'dr.lely@aviation-medical.fr'),
  ('a8888888-8888-8888-8888-888888888888', 'contact@chru-nancy-sport.fr')
ON CONFLICT (id) DO NOTHING;

-- Insert corresponding user profiles
INSERT INTO users (id, email, full_name, role, phone) VALUES
  ('a1111111-1111-1111-1111-111111111111', 'contact@caema-marcq.fr', 'Dr. Pascal Dudenko', 'ame', '03 20 56 03 74'),
  ('a2222222-2222-2222-2222-222222222222', 'contact@cea-bordeaux.fr', 'Cabinet Médical d''Expertise Libéral Aéronautique', 'ame', '06 31 87 22 43'),
  ('a3333333-3333-3333-3333-333333333333', 'dr.bernard@aviation-medical.fr', 'Dr. François Bernard', 'ame', '07 49 67 87 28'),
  ('a4444444-4444-4444-4444-444444444444', 'contact@cea-dijon.fr', 'Dr. Paolo Inghilleri', 'ame', '03 45 42 50 81'),
  ('a5555555-5555-5555-5555-555555555555', 'dr.plevert@aviation-medical.fr', 'Dr. Thomas Plevert', 'ame', '03 28 26 05 47'),
  ('a6666666-6666-6666-6666-666666666666', 'dr.ciboulet@aviation-medical.fr', 'Dr. Philippe Ciboulet', 'ame', '07 89 21 80 98'),
  ('a7777777-7777-7777-7777-777777777777', 'dr.lely@aviation-medical.fr', 'Dr. Laurent Lely', 'ame', '06 30 22 72 93'),
  ('a8888888-8888-8888-8888-888888888888', 'contact@chru-nancy-sport.fr', 'Dr. Bruno Chenuel', 'ame', '03 83 15 55 20')
ON CONFLICT (id) DO NOTHING;

-- Insert AME profiles with real DGAC-verified data
INSERT INTO ame_profiles (user_id, clinic_name, license_classes, specializations, languages, location, country) VALUES
  (
    'a1111111-1111-1111-1111-111111111111',
    'CAEMA - Centre Aéronautique d''Expertise Médicale Aéronautique',
    ARRAY['Class 1']::TEXT[],
    ARRAY['EKG on Site', 'X-Ray on Site']::TEXT[],
    ARRAY['French', 'English']::TEXT[],
    'Marcq-en-Baroeul (Lille area)',
    'France'
  ),
  (
    'a2222222-2222-2222-2222-222222222222',
    'Cabinet Médical d''Expertise Libéral Aéronautique',
    ARRAY['Class 1']::TEXT[],
    ARRAY['EKG on Site', 'Same Day Appointments']::TEXT[],
    ARRAY['French', 'English']::TEXT[],
    'Bordeaux-Mérignac Airport',
    'France'
  ),
  (
    'a3333333-3333-3333-3333-333333333333',
    NULL, -- Uses doctor name
    ARRAY['Class 1']::TEXT[],
    ARRAY['Same Day Appointments']::TEXT[],
    ARRAY['French']::TEXT[],
    'Milly-la-Forêt (Paris South)',
    'France'
  ),
  (
    'a4444444-4444-4444-4444-444444444444',
    'Cabinet d''Evaluation Aéro-Médicale Dijon-Bourgogne',
    ARRAY['Class 1']::TEXT[],
    ARRAY['EKG on Site', 'X-Ray on Site']::TEXT[],
    ARRAY['French', 'English']::TEXT[],
    'Dijon',
    'France'
  ),
  (
    'a5555555-5555-5555-5555-555555555555',
    NULL, -- Uses doctor name
    ARRAY['Class 1']::TEXT[],
    ARRAY['Same Day Appointments']::TEXT[],
    ARRAY['French']::TEXT[],
    'Uxem (Nord)',
    'France'
  ),
  (
    'a6666666-6666-6666-6666-666666666666',
    NULL, -- Uses doctor name
    ARRAY['Class 1']::TEXT[],
    ARRAY['Same Day Appointments']::TEXT[],
    ARRAY['French']::TEXT[],
    'Douvaine (near Geneva)',
    'France'
  ),
  (
    'a7777777-7777-7777-7777-777777777777',
    'Cabinet d''Expertise Médicale en Médecine Aéronautique de Cornouaille',
    ARRAY['Class 1']::TEXT[],
    ARRAY['Same Day Appointments']::TEXT[],
    ARRAY['French']::TEXT[],
    'Quimperlé (Brittany)',
    'France'
  ),
  (
    'a8888888-8888-8888-8888-888888888888',
    'Centre Universitaire de Médecine du Sport - CHRU Nancy',
    ARRAY['Class 1']::TEXT[],
    ARRAY['EKG on Site', 'X-Ray on Site', 'Difficult Cases']::TEXT[],
    ARRAY['French', 'English']::TEXT[],
    'Vandoeuvre-lès-Nancy',
    'France'
  )
ON CONFLICT DO NOTHING;

-- Add comment
COMMENT ON TABLE ame_profiles IS 'Pre-populated with DGAC-certified Class 1 AMEs from official government list (dated 29/01/2026). AMEs can claim their clinic by contacting admin.';

-- Note: This list includes only French-based AMEs from the DGAC list
-- International AMEs from the list (Dubai, Singapore, Dakar, etc.) can be added in future migrations
