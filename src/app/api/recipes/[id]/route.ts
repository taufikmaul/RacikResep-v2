import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateSku } from '@/lib/sku'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.business?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const businessId = session.user.business.id
    const userId = session.user.id
    const { id: recipeId } = await params

    // Check if recipe belongs to user's business
    const existingRecipe = await prisma.recipe.findFirst({
      where: {
        id: recipeId,
        businessId
      }
    })

    if (!existingRecipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 })
    }

    const {
      sku,
      name,
      description,
      instructions,
      imageUrl,
      yield: recipeYield,
      yieldUnitId,
      laborCost,
      operationalCost,
      packagingCost,
      canBeUsedAsIngredient,
      categoryId,
      ingredients,
      subRecipes
    } = await request.json()

    // Calculate ingredient costs
    let ingredientsCost = 0
    let subRecipesCost = 0
    const recipeIngredients: {
      ingredientId: string
      quantity: number
      unitId: string
      cost: number
    }[] = []
    const recipeSubRecipes: {
      subRecipeId: string
      quantity: number
      cost: number
    }[] = []

    // Process ingredients
    if (ingredients?.length) {
      for (const ing of ingredients) {
        const ingredient = await prisma.ingredient.findUnique({
          where: { id: ing.ingredientId }
        })

        if (!ingredient) {
          return NextResponse.json(
            { error: `Ingredient not found: ${ing.ingredientId}` },
            { status: 400 }
          )
        }

        const cost = ingredient.costPerUnit * ing.quantity
        ingredientsCost += cost

        recipeIngredients.push({
          ingredientId: ing.ingredientId,
          quantity: ing.quantity,
          unitId: ing.unitId,
          cost
        })
      }
    }

    // Process sub-recipes
    if (subRecipes?.length) {
      for (const subRec of subRecipes) {
        const subRecipe = await prisma.recipe.findUnique({
          where: { id: subRec.subRecipeId }
        })

        if (!subRecipe) {
          return NextResponse.json(
            { error: `Recipe not found: ${subRec.subRecipeId}` },
            { status: 400 }
          )
        }

        // Use cogsPerServing to allow any recipe to be used as a sub-recipe
        const unitCost = subRecipe.cogsPerServing || 0
        const cost = unitCost * subRec.quantity
        subRecipesCost += cost

        recipeSubRecipes.push({
          subRecipeId: subRec.subRecipeId,
          quantity: subRec.quantity,
          cost
        })
      }
    }

    // Calculate total COGS and cost per unit
    const totalCOGS = ingredientsCost + subRecipesCost + laborCost + operationalCost + packagingCost
    const cogsPerServing = totalCOGS / recipeYield
    const costPerUnit = canBeUsedAsIngredient ? cogsPerServing : 0

    // Handle SKU - if empty and recipe doesn't have one, generate it
    let finalSku = sku
    if ((!sku || sku.trim() === '') && !existingRecipe.sku) {
      try {
        finalSku = await generateSku('recipe', businessId)
        console.log('PUT /api/recipes/[id] - Generated SKU:', finalSku)
      } catch (skuError) {
        console.error('PUT /api/recipes/[id] - Error generating SKU:', skuError)
        // Continue without SKU if generation fails
        finalSku = null
      }
    } else if (sku && sku.trim() !== '') {
      // Use provided SKU
      finalSku = sku
    } else {
      // Keep existing SKU
      finalSku = existingRecipe.sku
    }

    // Update recipe in transaction
    const recipe = await prisma.$transaction(async (tx) => {
      // Delete existing ingredients and sub-recipes
      await tx.recipeIngredient.deleteMany({
        where: { recipeId }
      })
      await tx.recipeSubRecipe.deleteMany({
        where: { parentRecipeId: recipeId }
      })

      // Update recipe
      return await tx.recipe.update({
        where: { id: recipeId },
        data: {
          sku: finalSku,
          name,
          description,
          instructions,
          imageUrl,
          yield: recipeYield,
          yieldUnitId,
          laborCost,
          operationalCost,
          packagingCost,
          canBeUsedAsIngredient,
          costPerUnit,
          totalCOGS,
          cogsPerServing,
          categoryId: categoryId || null,
          ingredients: {
            create: recipeIngredients
          },
          subRecipes: {
            create: recipeSubRecipes
          }
        },
        include: {
          category: {
            select: {
              id: true,
              name: true,
              color: true
            }
          },
          ingredients: {
            include: {
              ingredient: {
                select: {
                  id: true,
                  name: true
                }
              },
              unit: {
                select: {
                  id: true,
                  name: true,
                  symbol: true
                }
              }
            }
          }
        }
      })
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: 'Edit Resep',
        description: `Memperbarui resep "${name}"`,
        entityType: 'recipe',
        entityId: recipe.id,
        userId
      }
    })

    return NextResponse.json(recipe)
  } catch (error) {
    console.error('Error updating recipe:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.business?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const businessId = session.user.business.id
    const userId = session.user.id
    const { id: recipeId } = await params

    // Check if recipe belongs to user's business
    const existingRecipe = await prisma.recipe.findFirst({
      where: {
        id: recipeId,
        businessId
      }
    })

    if (!existingRecipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 })
    }

    // Delete recipe and related data
    await prisma.$transaction(async (tx) => {
      // Delete recipe ingredients
      await tx.recipeIngredient.deleteMany({
        where: { recipeId }
      })

      // Delete channel prices
      await tx.channelPrice.deleteMany({
        where: { recipeId }
      })

      // Delete sub-recipe relationships
      await tx.recipeSubRecipe.deleteMany({
        where: {
          OR: [
            { parentRecipeId: recipeId },
            { subRecipeId: recipeId }
          ]
        }
      })

      // Delete recipe
      await tx.recipe.delete({
        where: { id: recipeId }
      })
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: 'Hapus Resep',
        description: `Menghapus resep "${existingRecipe.name}"`,
        entityType: 'recipe',
        entityId: recipeId,
        userId
      }
    })

    return NextResponse.json({ message: 'Recipe deleted successfully' })
  } catch (error) {
    console.error('Error deleting recipe:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
