/*
  Warnings:

  - You are about to drop the column `description` on the `Deployment` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Deployment" DROP COLUMN "description",
ALTER COLUMN "image_tag" DROP NOT NULL;
