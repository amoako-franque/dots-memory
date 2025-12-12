-- CreateTable
CREATE TABLE "album_view_logs" (
    "id" TEXT NOT NULL,
    "album_id" TEXT NOT NULL,
    "viewer_hash" TEXT NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "device_id" TEXT,
    "session_id" TEXT,
    "viewed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "viewed_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "album_view_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "album_view_logs_album_id_idx" ON "album_view_logs"("album_id");

-- CreateIndex
CREATE INDEX "album_view_logs_viewer_hash_idx" ON "album_view_logs"("viewer_hash");

-- CreateIndex
CREATE INDEX "album_view_logs_viewed_at_idx" ON "album_view_logs"("viewed_at");

-- CreateIndex
CREATE INDEX "album_view_logs_viewed_date_idx" ON "album_view_logs"("viewed_date");

-- CreateIndex
CREATE UNIQUE INDEX "album_view_logs_album_id_viewer_hash_viewed_date_key" ON "album_view_logs"("album_id", "viewer_hash", "viewed_date");

-- AddForeignKey
ALTER TABLE "album_view_logs" ADD CONSTRAINT "album_view_logs_album_id_fkey" FOREIGN KEY ("album_id") REFERENCES "albums"("id") ON DELETE CASCADE ON UPDATE CASCADE;
