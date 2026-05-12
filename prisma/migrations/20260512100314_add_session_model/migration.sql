-- DropIndex
DROP INDEX "PointHistory_order_id_idx";

-- DropIndex
DROP INDEX "PointHistory_user_id_idx";

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "flash_sale_end" TIMESTAMP(3),
ADD COLUMN     "flash_sale_price" DECIMAL(10,2),
ADD COLUMN     "is_flash_sale" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sid" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Session_sid_key" ON "Session"("sid");
