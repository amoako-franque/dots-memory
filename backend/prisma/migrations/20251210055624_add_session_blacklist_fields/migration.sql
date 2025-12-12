-- AlterTable
ALTER TABLE "access_code_sessions" ADD COLUMN     "blacklisted_at" TIMESTAMP(3),
ADD COLUMN     "is_blacklisted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "revoked_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "access_code_sessions_is_blacklisted_idx" ON "access_code_sessions"("is_blacklisted");
