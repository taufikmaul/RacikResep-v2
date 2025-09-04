-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_recipes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sku" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "instructions" TEXT,
    "imageUrl" TEXT,
    "yield" REAL NOT NULL DEFAULT 1,
    "yieldUnitId" TEXT,
    "laborCost" REAL NOT NULL DEFAULT 0,
    "operationalCost" REAL NOT NULL DEFAULT 0,
    "packagingCost" REAL NOT NULL DEFAULT 0,
    "totalCOGS" REAL NOT NULL DEFAULT 0,
    "cogsPerServing" REAL NOT NULL DEFAULT 0,
    "basePrice" REAL NOT NULL DEFAULT 0,
    "profitMargin" REAL NOT NULL DEFAULT 0,
    "marginType" TEXT NOT NULL DEFAULT 'percentage',
    "sellingPrice" REAL NOT NULL DEFAULT 0,
    "taxRate" REAL NOT NULL DEFAULT 0,
    "canBeUsedAsIngredient" BOOLEAN NOT NULL DEFAULT false,
    "costPerUnit" REAL NOT NULL DEFAULT 0,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "categoryId" TEXT,
    "businessId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "recipes_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "recipes_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "recipes_yieldUnitId_fkey" FOREIGN KEY ("yieldUnitId") REFERENCES "units" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_recipes" ("basePrice", "businessId", "canBeUsedAsIngredient", "categoryId", "cogsPerServing", "costPerUnit", "createdAt", "description", "id", "imageUrl", "instructions", "laborCost", "marginType", "name", "operationalCost", "packagingCost", "profitMargin", "sellingPrice", "sku", "taxRate", "totalCOGS", "updatedAt", "yield", "yieldUnitId") SELECT "basePrice", "businessId", "canBeUsedAsIngredient", "categoryId", "cogsPerServing", "costPerUnit", "createdAt", "description", "id", "imageUrl", "instructions", "laborCost", "marginType", "name", "operationalCost", "packagingCost", "profitMargin", "sellingPrice", "sku", "taxRate", "totalCOGS", "updatedAt", "yield", "yieldUnitId" FROM "recipes";
DROP TABLE "recipes";
ALTER TABLE "new_recipes" RENAME TO "recipes";
CREATE UNIQUE INDEX "recipes_sku_key" ON "recipes"("sku");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
