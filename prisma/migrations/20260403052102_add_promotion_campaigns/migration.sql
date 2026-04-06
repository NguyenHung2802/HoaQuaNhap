-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "promotion_id" INTEGER;

-- CreateTable
CREATE TABLE "PromotionCampaign" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "value" DECIMAL(10,2) NOT NULL,
    "min_order_value" DECIMAL(12,2),
    "max_discount_value" DECIMAL(12,2),
    "apply_type" TEXT NOT NULL DEFAULT 'auto',
    "target_type" TEXT NOT NULL DEFAULT 'all',
    "start_at" TIMESTAMP(3),
    "end_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromotionCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromotionCategory" (
    "promotion_id" INTEGER NOT NULL,
    "category_id" INTEGER NOT NULL,

    CONSTRAINT "PromotionCategory_pkey" PRIMARY KEY ("promotion_id","category_id")
);

-- CreateTable
CREATE TABLE "PromotionProduct" (
    "promotion_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,

    CONSTRAINT "PromotionProduct_pkey" PRIMARY KEY ("promotion_id","product_id")
);

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_promotion_id_fkey" FOREIGN KEY ("promotion_id") REFERENCES "PromotionCampaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionCategory" ADD CONSTRAINT "PromotionCategory_promotion_id_fkey" FOREIGN KEY ("promotion_id") REFERENCES "PromotionCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionCategory" ADD CONSTRAINT "PromotionCategory_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionProduct" ADD CONSTRAINT "PromotionProduct_promotion_id_fkey" FOREIGN KEY ("promotion_id") REFERENCES "PromotionCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionProduct" ADD CONSTRAINT "PromotionProduct_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
