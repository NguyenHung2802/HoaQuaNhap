-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "shipping_campaign_id" INTEGER,
ADD COLUMN     "shipping_discount_amount" DECIMAL(12,2) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "ShippingCampaign" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "value" DECIMAL(10,2) NOT NULL,
    "min_order_value" DECIMAL(12,2),
    "max_discount_value" DECIMAL(12,2),
    "start_at" TIMESTAMP(3),
    "end_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShippingCampaign_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_shipping_campaign_id_fkey" FOREIGN KEY ("shipping_campaign_id") REFERENCES "ShippingCampaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;
