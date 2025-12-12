-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('FREE', 'PREMIUM', 'PRO', 'ADMIN');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'DELETED');

-- CreateEnum
CREATE TYPE "AlbumStatus" AS ENUM ('ACTIVE', 'ARCHIVED', 'DELETED');

-- CreateEnum
CREATE TYPE "AlbumPrivacy" AS ENUM ('PRIVATE', 'PUBLIC');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'VIDEO');

-- CreateEnum
CREATE TYPE "MediaStatus" AS ENUM ('UPLOADING', 'PROCESSING', 'READY', 'FAILED', 'DELETED');

-- CreateEnum
CREATE TYPE "AnalyticsEventType" AS ENUM ('ALBUM_VIEW', 'ALBUM_SCAN', 'MEDIA_UPLOAD', 'MEDIA_VIEW', 'MEDIA_DOWNLOAD', 'BULK_DOWNLOAD');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'FREE',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "email_verified_at" TIMESTAMP(3),
    "subscription_tier" TEXT,
    "subscription_status" TEXT,
    "subscription_expires_at" TIMESTAMP(3),
    "stripe_customer_id" TEXT,
    "stripe_subscription_id" TEXT,
    "storage_used_bytes" BIGINT NOT NULL DEFAULT 0,
    "album_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_login_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_resets" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_resets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "albums" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "slug" TEXT NOT NULL,
    "qr_code_id" TEXT NOT NULL,
    "nfc_id" TEXT NOT NULL,
    "short_url" TEXT NOT NULL,
    "status" "AlbumStatus" NOT NULL DEFAULT 'ACTIVE',
    "privacy" "AlbumPrivacy" NOT NULL DEFAULT 'PRIVATE',
    "max_file_size_mb" INTEGER NOT NULL DEFAULT 100,
    "max_video_length_sec" INTEGER NOT NULL DEFAULT 300,
    "allow_videos" BOOLEAN NOT NULL DEFAULT true,
    "require_contributor_name" BOOLEAN NOT NULL DEFAULT false,
    "enable_reactions" BOOLEAN NOT NULL DEFAULT false,
    "event_date" TIMESTAMP(3),
    "event_location" TEXT,
    "expires_at" TIMESTAMP(3),
    "auto_archive_at" TIMESTAMP(3),
    "media_count" INTEGER NOT NULL DEFAULT 0,
    "total_size_bytes" BIGINT NOT NULL DEFAULT 0,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "download_count" INTEGER NOT NULL DEFAULT 0,
    "unique_contributors" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_activity_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "albums_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media" (
    "id" TEXT NOT NULL,
    "album_id" TEXT NOT NULL,
    "type" "MediaType" NOT NULL,
    "status" "MediaStatus" NOT NULL DEFAULT 'UPLOADING',
    "file_name" TEXT NOT NULL,
    "original_file_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "file_size_bytes" BIGINT NOT NULL,
    "s3_key" TEXT NOT NULL,
    "s3_bucket" TEXT NOT NULL,
    "cdn_url" TEXT NOT NULL,
    "thumbnail_url" TEXT,
    "thumbnail_s3_key" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "aspect_ratio" DOUBLE PRECISION,
    "duration_seconds" INTEGER,
    "video_codec" TEXT,
    "audio_bitrate" INTEGER,
    "exif_data" JSONB,
    "location" JSONB,
    "contributor_name" TEXT,
    "contributor_device_id" TEXT,
    "contributor_ip" TEXT,
    "contributor_user_agent" TEXT,
    "caption" TEXT,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "download_count" INTEGER NOT NULL DEFAULT 0,
    "reaction_count" INTEGER NOT NULL DEFAULT 0,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reactions" (
    "id" TEXT NOT NULL,
    "media_id" TEXT NOT NULL,
    "device_id" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "album_analytics" (
    "id" TEXT NOT NULL,
    "album_id" TEXT NOT NULL,
    "event_type" "AnalyticsEventType" NOT NULL,
    "device_id" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "country" TEXT,
    "city" TEXT,
    "metadata" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "album_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rate_limit_logs" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "request_count" INTEGER NOT NULL DEFAULT 1,
    "window_start" TIMESTAMP(3) NOT NULL,
    "blocked" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rate_limit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blocked_devices" (
    "id" TEXT NOT NULL,
    "device_id" TEXT NOT NULL,
    "album_id" TEXT,
    "reason" TEXT NOT NULL,
    "blocked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),

    CONSTRAINT "blocked_devices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_stripe_customer_id_key" ON "users"("stripe_customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_stripe_subscription_id_key" ON "users"("stripe_subscription_id");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_stripe_customer_id_idx" ON "users"("stripe_customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_token_idx" ON "refresh_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "password_resets_token_key" ON "password_resets"("token");

-- CreateIndex
CREATE INDEX "password_resets_token_idx" ON "password_resets"("token");

-- CreateIndex
CREATE INDEX "password_resets_user_id_idx" ON "password_resets"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "albums_slug_key" ON "albums"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "albums_qr_code_id_key" ON "albums"("qr_code_id");

-- CreateIndex
CREATE UNIQUE INDEX "albums_nfc_id_key" ON "albums"("nfc_id");

-- CreateIndex
CREATE UNIQUE INDEX "albums_short_url_key" ON "albums"("short_url");

-- CreateIndex
CREATE INDEX "albums_owner_id_idx" ON "albums"("owner_id");

-- CreateIndex
CREATE INDEX "albums_qr_code_id_idx" ON "albums"("qr_code_id");

-- CreateIndex
CREATE INDEX "albums_nfc_id_idx" ON "albums"("nfc_id");

-- CreateIndex
CREATE INDEX "albums_short_url_idx" ON "albums"("short_url");

-- CreateIndex
CREATE INDEX "albums_slug_idx" ON "albums"("slug");

-- CreateIndex
CREATE INDEX "albums_status_idx" ON "albums"("status");

-- CreateIndex
CREATE INDEX "media_album_id_idx" ON "media"("album_id");

-- CreateIndex
CREATE INDEX "media_status_idx" ON "media"("status");

-- CreateIndex
CREATE INDEX "media_contributor_device_id_idx" ON "media"("contributor_device_id");

-- CreateIndex
CREATE INDEX "media_uploaded_at_idx" ON "media"("uploaded_at");

-- CreateIndex
CREATE INDEX "reactions_media_id_idx" ON "reactions"("media_id");

-- CreateIndex
CREATE UNIQUE INDEX "reactions_media_id_device_id_emoji_key" ON "reactions"("media_id", "device_id", "emoji");

-- CreateIndex
CREATE INDEX "album_analytics_album_id_idx" ON "album_analytics"("album_id");

-- CreateIndex
CREATE INDEX "album_analytics_event_type_idx" ON "album_analytics"("event_type");

-- CreateIndex
CREATE INDEX "album_analytics_timestamp_idx" ON "album_analytics"("timestamp");

-- CreateIndex
CREATE INDEX "rate_limit_logs_identifier_idx" ON "rate_limit_logs"("identifier");

-- CreateIndex
CREATE INDEX "rate_limit_logs_window_start_idx" ON "rate_limit_logs"("window_start");

-- CreateIndex
CREATE UNIQUE INDEX "rate_limit_logs_identifier_endpoint_window_start_key" ON "rate_limit_logs"("identifier", "endpoint", "window_start");

-- CreateIndex
CREATE UNIQUE INDEX "blocked_devices_device_id_key" ON "blocked_devices"("device_id");

-- CreateIndex
CREATE INDEX "blocked_devices_device_id_idx" ON "blocked_devices"("device_id");

-- CreateIndex
CREATE INDEX "blocked_devices_album_id_idx" ON "blocked_devices"("album_id");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_resets" ADD CONSTRAINT "password_resets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "albums" ADD CONSTRAINT "albums_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media" ADD CONSTRAINT "media_album_id_fkey" FOREIGN KEY ("album_id") REFERENCES "albums"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reactions" ADD CONSTRAINT "reactions_media_id_fkey" FOREIGN KEY ("media_id") REFERENCES "media"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "album_analytics" ADD CONSTRAINT "album_analytics_album_id_fkey" FOREIGN KEY ("album_id") REFERENCES "albums"("id") ON DELETE CASCADE ON UPDATE CASCADE;
