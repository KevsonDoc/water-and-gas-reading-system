-- CreateEnum
CREATE TYPE "measure_type_enum" AS ENUM ('WATER', 'GAS');

-- CreateTable
CREATE TABLE "monitor" (
    "id" TEXT NOT NULL,
    "customer_code" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "has_confirmed" BOOLEAN NOT NULL,
    "measure_type" "measure_type_enum" NOT NULL,
    "measure_datetime" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "monitor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "image_link" (
    "id" TEXT NOT NULL,
    "expiresIn" TIMESTAMP(3) NOT NULL,
    "monitorId" TEXT NOT NULL,

    CONSTRAINT "image_link_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "image_link" ADD CONSTRAINT "image_link_monitorId_fkey" FOREIGN KEY ("monitorId") REFERENCES "monitor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
