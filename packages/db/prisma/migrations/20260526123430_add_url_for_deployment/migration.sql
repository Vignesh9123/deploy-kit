/*
  Warnings:

  - Added the required column `image_tag` to the `Deployment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `url` to the `Deployment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Deployment" ADD COLUMN     "image_tag" TEXT NOT NULL,
ADD COLUMN     "url" TEXT NOT NULL;
