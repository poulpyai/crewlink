-- Add rating_types column to examiner_profiles
ALTER TABLE examiner_profiles
ADD COLUMN IF NOT EXISTS rating_types TEXT[] NOT NULL DEFAULT '{}';

-- Add comment
COMMENT ON COLUMN examiner_profiles.rating_types IS 'Rating types examiner can examine for (IR, SEP, MEP, etc.)';
