-- Add email verification fields to users table
ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN verification_token TEXT;
ALTER TABLE users ADD COLUMN verification_expires DATETIME;
ALTER TABLE users ADD COLUMN verification_sent_at DATETIME;

-- Create index for verification tokens for faster lookups
CREATE INDEX idx_users_verification_token ON users(verification_token);
CREATE INDEX idx_users_email_verified ON users(email_verified);

-- Update existing users to be verified (since they're already using the system)
UPDATE users SET email_verified = TRUE WHERE email_verified IS NULL;