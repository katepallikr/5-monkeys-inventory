-- Baseline migration: records schema changes (SalesBatch table, PurchaseOrder.sourceFile
-- column) that were already applied directly to the dev database outside of the
-- migration history. This migration is marked as already-applied via
-- `prisma migrate resolve --applied` rather than executed, since the dev database
-- already has these objects.

-- AlterTable
ALTER TABLE "PurchaseOrder" ADD COLUMN "sourceFile" TEXT;

-- CreateTable
CREATE TABLE "SalesBatch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "filename" TEXT NOT NULL,
    "processedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startDate" DATETIME,
    "endDate" DATETIME,
    "totalUnits" REAL NOT NULL DEFAULT 0.0
);

-- CreateIndex
CREATE UNIQUE INDEX "SalesBatch_filename_key" ON "SalesBatch"("filename");
