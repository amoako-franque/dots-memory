-- CreateTable
CREATE TABLE "deleted_user_emails" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "user_id" TEXT,
    "deleted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "trial_ended_at" TIMESTAMP(3),
    "reason" TEXT,

    CONSTRAINT "deleted_user_emails_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "deleted_user_emails_email_key" ON "deleted_user_emails"("email");

-- CreateIndex
CREATE INDEX "deleted_user_emails_email_idx" ON "deleted_user_emails"("email");
