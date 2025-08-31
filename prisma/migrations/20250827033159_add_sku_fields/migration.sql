/*
  Warnings:

  - Added the required column `sku` to the `ingredients` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sku` to the `recipes` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "sku_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "businessId" TEXT NOT NULL,
    "ingredientPrefix" TEXT NOT NULL DEFAULT 'ING',
    "recipePrefix" TEXT NOT NULL DEFAULT 'RCP',
    "numberPadding" INTEGER NOT NULL DEFAULT 3,
    "separator" TEXT NOT NULL DEFAULT '',
    "nextIngredientNumber" INTEGER NOT NULL DEFAULT 1,
    "nextRecipeNumber" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "sku_settings_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ingredients" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sku" TEXT NOT NULL,
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
INSERT INTO "new_ingredients" ("businessId", "categoryId", "conversionFactor", "costPerUnit", "createdAt", "description", "id", "name", "packageSize", "purchasePrice", "purchaseUnitId", "updatedAt", "usageUnitId") SELECT "businessId", "categoryId", "conversionFactor", "costPerUnit", "createdAt", "description", "id", "name", "packageSize", "purchasePrice", "purchaseUnitId", "updatedAt", "usageUnitId" FROM "ingredients";
DROP TABLE "ingredients";
ALTER TABLE "new_ingredients" RENAME TO "ingredients";
CREATE UNIQUE INDEX "ingredients_sku_key" ON "ingredients"("sku");
CREATE TABLE "new_recipes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sku" TEXT NOT NULL,
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
    "categoryId" TEXT,
    "businessId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "recipes_yieldUnitId_fkey" FOREIGN KEY ("yieldUnitId") REFERENCES "units" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "recipes_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "recipes_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_recipes" ("basePrice", "businessId", "canBeUsedAsIngredient", "categoryId", "cogsPerServing", "costPerUnit", "createdAt", "description", "id", "imageUrl", "instructions", "laborCost", "marginType", "name", "operationalCost", "packagingCost", "profitMargin", "sellingPrice", "taxRate", "totalCOGS", "updatedAt", "yield", "yieldUnitId") SELECT "basePrice", "businessId", "canBeUsedAsIngredient", "categoryId", "cogsPerServing", "costPerUnit", "createdAt", "description", "id", "imageUrl", "instructions", "laborCost", "marginType", "name", "operationalCost", "packagingCost", "profitMargin", "sellingPrice", "taxRate", "totalCOGS", "updatedAt", "yield", "yieldUnitId" FROM "recipes";
DROP TABLE "recipes";
ALTER TABLE "new_recipes" RENAME TO "recipes";
CREATE UNIQUE INDEX "recipes_sku_key" ON "recipes"("sku");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "sku_settings_businessId_key" ON "sku_settings"("businessId");
