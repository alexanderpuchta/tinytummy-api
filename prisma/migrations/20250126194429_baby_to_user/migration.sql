/*
  Warnings:

  - Added the required column `parentId` to the `Baby` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Baby" ADD COLUMN     "parentId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Baby" ADD CONSTRAINT "Baby_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
