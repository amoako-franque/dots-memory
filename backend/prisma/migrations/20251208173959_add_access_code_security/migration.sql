-- CreateTable
CREATE TABLE "access_code_attempts" (
    "id" TEXT NOT NULL,
    "album_id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "ip_address" TEXT NOT NULL,
    "device_id" TEXT,
    "success" BOOLEAN NOT NULL DEFAULT false,
    "attempted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_code_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_code_sessions" (
    "id" TEXT NOT NULL,
    "album_id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "session_token" TEXT NOT NULL,
    "device_id" TEXT,
    "ip_address" TEXT NOT NULL,
    "user_agent" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_used_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_code_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "access_code_attempts_album_id_ip_address_idx" ON "access_code_attempts"("album_id", "ip_address");

-- CreateIndex
CREATE INDEX "access_code_attempts_identifier_ip_address_idx" ON "access_code_attempts"("identifier", "ip_address");

-- CreateIndex
CREATE INDEX "access_code_attempts_attempted_at_idx" ON "access_code_attempts"("attempted_at");

-- CreateIndex
CREATE UNIQUE INDEX "access_code_sessions_session_token_key" ON "access_code_sessions"("session_token");

-- CreateIndex
CREATE INDEX "access_code_sessions_album_id_session_token_idx" ON "access_code_sessions"("album_id", "session_token");

-- CreateIndex
CREATE INDEX "access_code_sessions_identifier_session_token_idx" ON "access_code_sessions"("identifier", "session_token");

-- CreateIndex
CREATE INDEX "access_code_sessions_expires_at_idx" ON "access_code_sessions"("expires_at");

-- CreateIndex
CREATE INDEX "albums_expires_at_idx" ON "albums"("expires_at");

-- AddForeignKey
ALTER TABLE "access_code_attempts" ADD CONSTRAINT "access_code_attempts_album_id_fkey" FOREIGN KEY ("album_id") REFERENCES "albums"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_code_sessions" ADD CONSTRAINT "access_code_sessions_album_id_fkey" FOREIGN KEY ("album_id") REFERENCES "albums"("id") ON DELETE CASCADE ON UPDATE CASCADE;
