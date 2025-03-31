/*
  Warnings:

  - You are about to drop the column `userId` on the `Diaper` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Food` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Med` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Sleep` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Diaper" DROP CONSTRAINT "Diaper_userId_fkey";

-- DropForeignKey
ALTER TABLE "Food" DROP CONSTRAINT "Food_userId_fkey";

-- DropForeignKey
ALTER TABLE "Med" DROP CONSTRAINT "Med_userId_fkey";

-- DropForeignKey
ALTER TABLE "Sleep" DROP CONSTRAINT "Sleep_userId_fkey";

-- AlterTable
ALTER TABLE "Diaper" DROP COLUMN "userId";

-- AlterTable
ALTER TABLE "Food" DROP COLUMN "userId";

-- AlterTable
ALTER TABLE "Med" DROP COLUMN "userId";

-- AlterTable
ALTER TABLE "Sleep" DROP COLUMN "userId";
