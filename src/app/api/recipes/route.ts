import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateSku } from '@/lib/sku'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.business?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const businessId = session.user.business.id
    const { searchParams } = new URL(request.url)
    
    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit
    
    // Sorting parameters
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    
    // Search parameter
    const search = searchParams.get('search') || ''
    
    // Filter parameters
    const canBeUsedAsIngredient = searchParams.get('canBeUsedAsIngredient')
    const favorites = searchParams.get('favorites')
    const category = searchParams.get('category')

    // Build where clause
    const whereClause: any = { businessId }
    if (canBeUsedAsIngredient === 'true') {
      whereClause.canBeUsedAsIngredient = true
    }
    if (favorites === 'true') {
      whereClause.isFavorite = true
    }
    if (category) {
      whereClause.categoryId = category
    }
    if (search) {
      whereClause.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
        { description: { contains: search } },
        {
          category: {
            is: {
              name: { contains: search }
            }
          }
        },
        {
          yieldUnit: {
            is: {
              name: { contains: search }
            }
          }
        }
      ]
    }
    
    // Build orderBy clause
    const orderByClause: any = {}
    if (sortBy === 'category') {
      orderByClause.category = { name: sortOrder }
    } else if (sortBy === 'yieldUnit') {
      orderByClause.yieldUnit = { name: sortOrder }
    } else if (sortBy === 'sku') {
      orderByClause.sku = sortOrder
    } else {
      orderByClause[sortBy] = sortOrder
    }

    // Get total count for pagination
    const totalCount = await prisma.recipe.count({
      where: whereClause
    })

    const recipes = await prisma.recipe.findMany({
      where: whereClause,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            color: true
          }
        },
        yieldUnit: {
          select: {
            id: true,
            name: true,
            symbol: true
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
        },
        subRecipes: {
          include: {
            subRecipe: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: orderByClause,
      skip,
      take: limit
    })

    // Strip selling-related fields from API response
    const sanitized = recipes.map((r: any) => {
      const { sellingPrice, profitMargin, marginType, ...rest } = r
      return rest
    })

    return NextResponse.json({
      data: sanitized,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page < Math.ceil(totalCount / limit),
        hasPrev: page > 1
      }
    })
  } catch (error) {
    console.error('Error fetching recipes:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.business?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const businessId = session.user.business.id
    const userId = session.user.id

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
      isFavorite,
      categoryId,
      ingredients,
      subRecipes
    } = await request.json()

    // Validate required fields
    if (!name || !recipeYield || !yieldUnitId || (!ingredients?.length && !subRecipes?.length)) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Generate SKU if not provided
    let finalSku = sku
    if (!sku || sku.trim() === '') {
      try {
        finalSku = await generateSku('recipe', businessId)
        console.log('POST /api/recipes - Generated SKU:', finalSku)
      } catch (skuError) {
        console.error('POST /api/recipes - Error generating SKU:', skuError)
        // Continue without SKU if generation fails
        finalSku = null
      }
    }

    // Calculate ingredient costs
    let ingredientsCost = 0
    let subRecipesCost = 0
    const recipeIngredients = []
    const recipeSubRecipes = []

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

        // Use cogsPerServing for sub-recipe costing to allow any recipe to be used as a sub-recipe
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

    const recipe = await prisma.recipe.create({
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
        ...(isFavorite !== undefined && { isFavorite }),
        costPerUnit,
        totalCOGS,
        cogsPerServing,
        categoryId: categoryId || null,
        businessId,
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

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: 'Tambah Resep',
        description: `Menambahkan resep "${name}"`,
        entityType: 'recipe',
        entityId: recipe.id,
        userId
      }
    })

    return NextResponse.json(recipe, { status: 201 })
  } catch (error) {
    console.error('Error creating recipe:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
