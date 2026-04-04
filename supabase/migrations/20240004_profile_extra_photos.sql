-- Add extra gallery photos to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS extra_photos text[] DEFAULT '{}';
