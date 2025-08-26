-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ingredients" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "purchasePrice" REAL NOT NULL,
    "packageSize" REAL NOT NULL,
    "conversionFactor" REAL NOT NULL DEFAULT 1,
    "costPerUnit" REAL NOT NULL,
    "categoryId" TEXT,
    "purchaseUnitId" TEXT NOT NULL,
    "usageUnitId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ingredients_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ingredients_purchaseUnitId_fkey" FOREIGN KEY ("purchaseUnitId") REFERENCES "units" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ingredients_usageUnitId_fkey" FOREIGN KEY ("usageUnitId") REFERENCES "units" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ingredients_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ingredients" ("businessId", "categoryId", "costPerUnit", "createdAt", "description", "id", "name", "packageSize", "purchasePrice", "purchaseUnitId", "updatedAt", "usageUnitId") SELECT "businessId", "categoryId", "costPerUnit", "createdAt", "description", "id", "name", "packageSize", "purchasePrice", "purchaseUnitId", "updatedAt", "usageUnitId" FROM "ingredients";
DROP TABLE "ingredients";
ALTER TABLE "new_ingredients" RENAME TO "ingredients";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
