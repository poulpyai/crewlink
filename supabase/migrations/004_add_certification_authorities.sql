-- Add certification authorities field to AME profiles
-- This defines which license types the AME can issue (EASA, FAA, CASA, GCAA, etc.)

ALTER TABLE ame_profiles
ADD COLUMN IF NOT EXISTS certification_authorities TEXT[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN ame_profiles.certification_authorities IS 'Aviation authorities this AME is certified under (EASA, FAA, CASA, GCAA, Transport Canada, CAAC, etc.)';

-- Update existing French AMEs with EASA (DGAC = EASA Part-MED)
UPDATE ame_profiles
SET certification_authorities = ARRAY['EASA']::TEXT[]
WHERE country = 'France';

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_ame_cert_authorities ON ame_profiles USING GIN(certification_authorities);
