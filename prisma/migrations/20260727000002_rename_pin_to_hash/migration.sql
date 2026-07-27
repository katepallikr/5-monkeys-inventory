-- Rename User.pinCode to User.pinHash. The application now stores a bcrypt hash
-- of the PIN instead of the plaintext PIN, so any existing plaintext values must
-- be re-hashed by the app/seed after this migration runs (see prisma/seed.ts).
ALTER TABLE "User" RENAME COLUMN "pinCode" TO "pinHash";
