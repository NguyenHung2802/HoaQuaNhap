-- Additive migration: keep Product.category_id as the primary category for backward compatibility.
CREATE TABLE "ProductCategory" (
    "product_id" INTEGER NOT NULL,
    "category_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProductCategory_pkey" PRIMARY KEY ("product_id", "category_id")
);

CREATE INDEX "ProductCategory_category_id_idx" ON "ProductCategory"("category_id");

ALTER TABLE "ProductCategory" ADD CONSTRAINT "ProductCategory_product_id_fkey"
FOREIGN KEY ("product_id") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProductCategory" ADD CONSTRAINT "ProductCategory_category_id_fkey"
FOREIGN KEY ("category_id") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "ProductCategory" ("product_id", "category_id")
SELECT "id", "category_id" FROM "Product"
ON CONFLICT ("product_id", "category_id") DO NOTHING;
