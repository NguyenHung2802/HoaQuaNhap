-- AlterTable
ALTER TABLE "User" ADD COLUMN     "last_login_at" TIMESTAMP(3),
ALTER COLUMN "role" SET DEFAULT 'customer';
