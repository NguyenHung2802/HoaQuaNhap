-- AlterTable
ALTER TABLE "BlogPost" ADD COLUMN     "access_token" TEXT,
ADD COLUMN     "ad_cta_text" TEXT,
ADD COLUMN     "ad_headline" TEXT,
ADD COLUMN     "ad_image_url" TEXT,
ADD COLUMN     "affiliate_url" TEXT,
ADD COLUMN     "external_id" TEXT,
ADD COLUMN     "gallery" JSONB,
ADD COLUMN     "post_type" TEXT NOT NULL DEFAULT 'blog',
ADD COLUMN     "seo_description" TEXT,
ADD COLUMN     "seo_title" TEXT,
ADD COLUMN     "source" TEXT,
ADD COLUMN     "tags" TEXT,
ADD COLUMN     "url_date" TEXT,
ADD COLUMN     "video_url" TEXT;

-- CreateTable
CREATE TABLE "ApiKey" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "key_prefix" TEXT NOT NULL,
    "key_hash" TEXT NOT NULL,
    "scopes" TEXT NOT NULL DEFAULT 'posts:write',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMP(3),

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsStatDaily" (
    "id" SERIAL NOT NULL,
    "post_id" INTEGER NOT NULL,
    "day" DATE NOT NULL,
    "event" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "NewsStatDaily_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_key_hash_key" ON "ApiKey"("key_hash");

-- CreateIndex
CREATE UNIQUE INDEX "NewsStatDaily_post_id_day_event_key" ON "NewsStatDaily"("post_id", "day", "event");

-- CreateIndex
CREATE UNIQUE INDEX "BlogPost_access_token_key" ON "BlogPost"("access_token");

-- CreateIndex
CREATE INDEX "BlogPost_post_type_is_published_published_at_idx" ON "BlogPost"("post_type", "is_published", "published_at");

-- CreateIndex
CREATE UNIQUE INDEX "BlogPost_source_external_id_key" ON "BlogPost"("source", "external_id");

-- AddForeignKey
ALTER TABLE "NewsStatDaily" ADD CONSTRAINT "NewsStatDaily_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "BlogPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

