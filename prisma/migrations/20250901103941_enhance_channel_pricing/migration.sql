-- CreateTable
CREATE TABLE "channel_price_history" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "channelPriceId" TEXT NOT NULL,
    "oldPrice" REAL NOT NULL,
    "newPrice" REAL NOT NULL,
    "priceChange" REAL NOT NULL,
    "percentageChange" REAL NOT NULL,
    "changeType" TEXT NOT NULL,
    "reason" TEXT,
    "changeDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "businessId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "channel_price_history_channelPriceId_fkey" FOREIGN KEY ("channelPriceId") REFERENCES "channel_prices" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "channel_price_history_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_channel_prices" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "price" REAL NOT NULL,
    "finalPrice" REAL NOT NULL DEFAULT 0,
    "commission" REAL NOT NULL DEFAULT 0,
    "taxRate" REAL NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "recipeId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "channel_prices_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "sales_channels" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "channel_prices_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "recipes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_channel_prices" ("channelId", "createdAt", "finalPrice", "id", "price", "recipeId", "updatedAt") SELECT "channelId", "createdAt", "finalPrice", "id", "price", "recipeId", "updatedAt" FROM "channel_prices";
DROP TABLE "channel_prices";
ALTER TABLE "new_channel_prices" RENAME TO "channel_prices";
CREATE UNIQUE INDEX "channel_prices_recipeId_channelId_key" ON "channel_prices"("recipeId", "channelId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
