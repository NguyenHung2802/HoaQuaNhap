-- DropIndex
DROP INDEX IF EXISTS "PointHistory_order_id_idx";

-- DropIndex
DROP INDEX IF EXISTS "PointHistory_user_id_idx";

-- AlterTable
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "flash_sale_end" TIMESTAMP(3);
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "flash_sale_price" DECIMAL(10,2);
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "is_flash_sale" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE IF NOT EXISTS "Session" (
    "id" TEXT NOT NULL,
    "sid" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Session_sid_key" ON "Session"("sid");
