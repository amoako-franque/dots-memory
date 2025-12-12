-- CreateTable
CREATE TABLE "album_access_codes" (
    "id" TEXT NOT NULL,
    "album_id" TEXT NOT NULL,
    "access_code_hash" TEXT NOT NULL,
    "access_code_encrypted" TEXT NOT NULL,
    "is_blacklisted" BOOLEAN NOT NULL DEFAULT false,
    "blacklisted_at" TIMESTAMP(3),
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "album_access_codes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "album_access_codes_album_id_idx" ON "album_access_codes"("album_id");

-- CreateIndex
CREATE INDEX "album_access_codes_is_blacklisted_idx" ON "album_access_codes"("is_blacklisted");

-- CreateIndex
CREATE INDEX "album_access_codes_created_at_idx" ON "album_access_codes"("created_at");

-- AddForeignKey
ALTER TABLE "album_access_codes" ADD CONSTRAINT "album_access_codes_album_id_fkey" FOREIGN KEY ("album_id") REFERENCES "albums"("id") ON DELETE CASCADE ON UPDATE CASCADE;
