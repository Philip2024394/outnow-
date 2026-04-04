-- Store date of birth so the 3-part DOB picker can be restored on reload
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS dob date;
