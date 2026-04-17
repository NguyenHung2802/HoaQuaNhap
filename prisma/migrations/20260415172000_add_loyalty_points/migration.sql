ALTER TABLE "User"
ADD COLUMN "reward_points" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "PointHistory" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "order_id" INTEGER,
    "type" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PointHistory_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PointHistory_user_id_idx" ON "PointHistory"("user_id");
CREATE INDEX "PointHistory_order_id_idx" ON "PointHistory"("order_id");

ALTER TABLE "PointHistory"
ADD CONSTRAINT "PointHistory_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PointHistory"
ADD CONSTRAINT "PointHistory_order_id_fkey"
FOREIGN KEY ("order_id") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
