-- Users: single role → list of roles (data-preserving).
ALTER TABLE "User" ADD COLUMN "roles" "Role"[] NOT NULL DEFAULT ARRAY[]::"Role"[];
UPDATE "User" SET "roles" = ARRAY["role"];
ALTER TABLE "User" DROP COLUMN "role";

-- Review: claim lock + decline message.
ALTER TABLE "Review" ADD COLUMN "lockExpiresAt" TIMESTAMP(3),
ADD COLUMN "declineMessage" TEXT,
ADD COLUMN "revokedReason" TEXT;

-- Note: QR token hash is set when the PDF is rendered; revocation fields.
ALTER TABLE "Note" ALTER COLUMN "qrTokenHash" DROP NOT NULL,
ADD COLUMN "revokedAt" TIMESTAMP(3),
ADD COLUMN "revokedReason" TEXT;
