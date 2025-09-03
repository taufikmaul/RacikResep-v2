/*
  Warnings:

  - You are about to drop the column `isActive` on the `channel_prices` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_channel_prices" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "price" REAL NOT NULL,
    "finalPrice" REAL NOT NULL DEFAULT 0,
    "commission" REAL NOT NULL DEFAULT 0,
    "taxRate" REAL NOT NULL DEFAULT 0,
    "recipeId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "channel_prices_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "sales_channels" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "channel_prices_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "recipes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_channel_prices" ("channelId", "commission", "createdAt", "finalPrice", "id", "price", "recipeId", "taxRate", "updatedAt") SELECT "channelId", "commission", "createdAt", "finalPrice", "id", "price", "recipeId", "taxRate", "updatedAt" FROM "channel_prices";
DROP TABLE "channel_prices";
ALTER TABLE "new_channel_prices" RENAME TO "channel_prices";
CREATE UNIQUE INDEX "channel_prices_recipeId_channelId_key" ON "channel_prices"("recipeId", "channelId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
