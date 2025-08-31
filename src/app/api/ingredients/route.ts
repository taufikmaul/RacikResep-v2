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
    
    // Build where clause
    const whereClause: any = { businessId }
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
          purchaseUnit: {
            is: {
              name: { contains: search }
            }
          }
        },
        {
          usageUnit: {
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
    } else if (sortBy === 'purchaseUnit') {
      orderByClause.purchaseUnit = { name: sortOrder }
    } else if (sortBy === 'usageUnit') {
      orderByClause.usageUnit = { name: sortOrder }
    } else if (sortBy === 'sku') {
      orderByClause.sku = sortOrder
    } else {
      orderByClause[sortBy] = sortOrder
    }

    // Get total count for pagination
    const totalCount = await prisma.ingredient.count({
      where: whereClause
    })

    const ingredients = await prisma.ingredient.findMany({
      where: whereClause,
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
        },
        _count: {
          select: { recipeIngredients: true }
        }
      },
      orderBy: orderByClause,
      skip,
      take: limit
    })

    // Map usageCount into top-level items for convenience
    const data = ingredients.map((ing: any) => ({
      ...ing,
      usageCount: ing._count?.recipeIngredients ?? 0
    }))

    return NextResponse.json({
      data,
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
    console.error('Error fetching ingredients:', error)
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

    const body = await request.json()
    console.log('POST /api/ingredients - Received data:', body)

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
    } = body

    // Validate required fields
    if (!name || !purchasePrice || !packageSize || !purchaseUnitId || !usageUnitId || !conversionFactor) {
      console.log('POST /api/ingredients - Missing required fields:', { name, purchasePrice, packageSize, purchaseUnitId, usageUnitId, conversionFactor })
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

    // Generate SKU if not provided
    let finalSku = sku
    if (!sku || sku.trim() === '') {
      try {
        finalSku = await generateSku('ingredient', businessId)
        console.log('POST /api/ingredients - Generated SKU:', finalSku)
      } catch (skuError) {
        console.error('POST /api/ingredients - Error generating SKU:', skuError)
        // Continue without SKU if generation fails
        finalSku = null
      }
    }

    // Calculate cost per unit = purchasePrice / (packageSize * conversionFactor)
    const costPerUnit = purchasePrice / (packageSize * conversionFactor)
    
    console.log('POST /api/ingredients - Calculated costPerUnit:', costPerUnit)

    const ingredient = await prisma.ingredient.create({
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
        usageUnitId,
        businessId
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

    console.log('POST /api/ingredients - Successfully created ingredient:', ingredient.id)

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: 'Tambah Bahan',
        description: `Menambahkan bahan baku "${name}"`,
        entityType: 'ingredient',
        entityId: ingredient.id,
        userId
      }
    })

    return NextResponse.json(ingredient, { status: 201 })
  } catch (error) {
    console.error('Error creating ingredient:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
