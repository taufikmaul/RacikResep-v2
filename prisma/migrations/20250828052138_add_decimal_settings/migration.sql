-- CreateTable
CREATE TABLE "decimal_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "businessId" TEXT NOT NULL,
    "decimalPlaces" INTEGER NOT NULL DEFAULT 2,
    "roundingMethod" TEXT NOT NULL DEFAULT 'round',
    "thousandSeparator" TEXT NOT NULL DEFAULT ',',
    "decimalSeparator" TEXT NOT NULL DEFAULT '.',
    "currencySymbol" TEXT NOT NULL DEFAULT 'Rp',
    "currencyPosition" TEXT NOT NULL DEFAULT 'before',
    "showTrailingZeros" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "decimal_settings_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "decimal_settings_businessId_key" ON "decimal_settings"("businessId");
