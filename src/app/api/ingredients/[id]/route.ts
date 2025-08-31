import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateSku } from '@/lib/sku'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.business?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const businessId = session.user.business.id
    const { id: ingredientId } = await params

    const ingredient = await prisma.ingredient.findFirst({
      where: { id: ingredientId, businessId },
      include: {
        category: { select: { id: true, name: true, color: true } },
        purchaseUnit: { select: { id: true, name: true, symbol: true } },
        usageUnit: { select: { id: true, name: true, symbol: true } },
        _count: { select: { recipeIngredients: true } },
        recipeIngredients: {
          select: {
            id: true,
            recipe: { select: { id: true, name: true, imageUrl: true } }
          }
        }
      }
    })

    if (!ingredient) {
      return NextResponse.json({ error: 'Ingredient not found' }, { status: 404 })
    }

    const usageCount = ingredient._count?.recipeIngredients ?? 0
    const recipes = ingredient.recipeIngredients.map((ri) => ri.recipe)

    return NextResponse.json({
      ...ingredient,
      usageCount,
      recipes
    })
  } catch (error) {
    console.error('Error fetching ingredient detail:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    console.log('PUT /api/ingredients/[id] - Session:', JSON.stringify(session, null, 2))
    
    if (!session?.user?.business?.id) {
      console.log('PUT /api/ingredients/[id] - No business ID found in session')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const businessId = session.user.business.id
    const userId = session.user.id
    const { id: ingredientId } = await params

    // Check if ingredient belongs to user's business
    const existingIngredient = await prisma.ingredient.findFirst({
      where: {
        id: ingredientId,
        businessId
      }
    })

    if (!existingIngredient) {
      return NextResponse.json({ error: 'Ingredient not found' }, { status: 404 })
    }

    const {
      sku,
      name,
      description,
      purchasePrice,
      packageSize,
      categoryId,
      purchaseUnitId,
      usageUnitId,
      conversionFactor
    } = await request.json()

    console.log('PUT /api/ingredients/[id] - Request data:', {
      sku, name, purchasePrice, packageSize, purchaseUnitId, usageUnitId, conversionFactor
    })

    // Validate required fields
    if (!name || !purchasePrice || !packageSize || !purchaseUnitId || !usageUnitId || !conversionFactor) {
      console.log('PUT /api/ingredients/[id] - Missing required fields')
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate numeric fields
    if (typeof purchasePrice !== 'number' || isNaN(purchasePrice) || purchasePrice <= 0) {
      return NextResponse.json(
        { error: 'Invalid purchase price' },
        { status: 400 }
      )
    }

    if (typeof packageSize !== 'number' || isNaN(packageSize) || packageSize <= 0) {
      return NextResponse.json(
        { error: 'Invalid package size' },
        { status: 400 }
      )
    }

    if (typeof conversionFactor !== 'number' || isNaN(conversionFactor) || conversionFactor <= 0) {
      return NextResponse.json(
        { error: 'Invalid conversion factor' },
        { status: 400 }
      )
    }

    // Handle SKU - if empty and ingredient doesn't have one, generate it
    let finalSku = sku
    if ((!sku || sku.trim() === '') && !existingIngredient.sku) {
      try {
        finalSku = await generateSku('ingredient', businessId)
        console.log('PUT /api/ingredients/[id] - Generated SKU:', finalSku)
      } catch (skuError) {
        console.error('PUT /api/ingredients/[id] - Error generating SKU:', skuError)
        // Continue without SKU if generation fails
        finalSku = null
      }
    } else if (sku && sku.trim() !== '') {
      // Use provided SKU
      finalSku = sku
    } else {
      // Keep existing SKU
      finalSku = existingIngredient.sku
    }

    // Calculate cost per unit = purchasePrice / (packageSize * conversionFactor)
    const costPerUnit = purchasePrice / (packageSize * conversionFactor)
    console.log('PUT /api/ingredients/[id] - Calculated costPerUnit:', costPerUnit)

    const ingredient = await prisma.ingredient.update({
      where: { id: ingredientId },
      data: {
        sku: finalSku,
        name,
        description,
        purchasePrice,
        packageSize,
        conversionFactor,
        costPerUnit,
        categoryId: categoryId || null,
        purchaseUnitId,
        usageUnitId
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            color: true
          }
        },
        purchaseUnit: {
          select: {
            id: true,
            name: true,
            symbol: true
          }
        },
        usageUnit: {
          select: {
            id: true,
            name: true,
            symbol: true
          }
        }
      }
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: 'Edit Bahan',
        description: `Memperbarui bahan baku "${name}"`,
        entityType: 'ingredient',
        entityId: ingredient.id,
        userId
      }
    })

    return NextResponse.json(ingredient)
  } catch (error) {
    console.error('Error updating ingredient:', error)
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
    const { id: ingredientId } = await params

    // Check if ingredient belongs to user's business
    const existingIngredient = await prisma.ingredient.findFirst({
      where: {
        id: ingredientId,
        businessId
      }
    })

    if (!existingIngredient) {
      return NextResponse.json({ error: 'Ingredient not found' }, { status: 404 })
    }

    // Check if ingredient is used in any recipes
    const usageCount = await prisma.recipeIngredient.count({
      where: { ingredientId }
    })

    if (usageCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete ingredient that is used in recipes' },
        { status: 400 }
      )
    }

    await prisma.ingredient.delete({
      where: { id: ingredientId }
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: 'Hapus Bahan',
        description: `Menghapus bahan baku "${existingIngredient.name}"`,
        entityType: 'ingredient',
        entityId: ingredientId,
        userId
      }
    })

    return NextResponse.json({ message: 'Ingredient deleted successfully' })
  } catch (error) {
    console.error('Error deleting ingredient:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
