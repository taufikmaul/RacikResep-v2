import { prisma } from './prisma';

export async function generateSku(type: 'ingredient' | 'recipe', businessId: string): Promise<string> {
  // Start a transaction to ensure atomicity
  return prisma.$transaction(async (tx) => {
    // Get or create SKU settings for the business
    const settings = await tx.skuSettings.upsert({
      where: { businessId },
      update: {},
      create: {
        business: { connect: { id: businessId } },
      },
      select: {
        id: true,
        ingredientPrefix: true,
        recipePrefix: true,
        numberPadding: true,
        separator: true,
        nextIngredientNumber: true,
        nextRecipeNumber: true,
      },
    });

    // Determine which counter to use
    const counterField = type === 'ingredient' ? 'nextIngredientNumber' : 'nextRecipeNumber';
    const prefix = type === 'ingredient' ? settings.ingredientPrefix : settings.recipePrefix;
    const nextNumber = settings[counterField];

    // Generate the SKU
    const paddedNumber = String(nextNumber).padStart(settings.numberPadding, '0');
    const sku = `${prefix}${settings.separator}${paddedNumber}`;

    // Increment the counter for the next SKU
    await tx.skuSettings.update({
      where: { id: settings.id },
      data: { [counterField]: { increment: 1 } },
    });

    return sku;
  });
}

// Function to ensure an entity has an SKU
export async function ensureSku<T extends { id: string; sku: string | null }>(
  entity: T,
  type: 'ingredient' | 'recipe',
  businessId: string
): Promise<T & { sku: string }> {
  if (entity.sku) {
    return entity as T & { sku: string };
  }

  const sku = await generateSku(type, businessId);
  
  if (type === 'ingredient') {
    await prisma.ingredient.update({
      where: { id: entity.id },
      data: { sku },
    });
  } else {
    await prisma.recipe.update({
      where: { id: entity.id },
      data: { sku },
    });
  }

  return { ...entity, sku } as T & { sku: string };
}
