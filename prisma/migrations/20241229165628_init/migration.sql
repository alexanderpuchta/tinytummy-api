-- CreateTable
CREATE TABLE "Baby" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "birth" TEXT NOT NULL,
    "gender" TEXT NOT NULL,

    CONSTRAINT "Baby_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "first" TEXT NOT NULL,
    "last" TEXT NOT NULL,
    "email" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Baby_id_key" ON "Baby"("id");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
