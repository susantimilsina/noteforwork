-- AlterTable
ALTER TABLE "Intake" ADD COLUMN     "accessTokenHash" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Intake_accessTokenHash_key" ON "Intake"("accessTokenHash");

