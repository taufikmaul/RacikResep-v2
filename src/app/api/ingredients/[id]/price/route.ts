import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'

const prisma = new PrismaClient()

export async function POST(
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

    // Get the current ingredient
    const currentIngredient = await prisma.ingredient.findFirst({
      where: {
        id: ingredientId,
        businessId: businessId
      }
    })

    if (!currentIngredient) {
      return NextResponse.json({ error: 'Ingredient not found' }, { status: 404 })
    }

    const { newPrice, newPackageSize } = await request.json()

    if (typeof newPrice !== 'number' || newPrice < 0) {
      return NextResponse.json({ error: 'Invalid price' }, { status: 400 })
    }

    if (typeof newPackageSize !== 'number' || newPackageSize <= 0) {
      return NextResponse.json({ error: 'Invalid package size' }, { status: 400 })
    }

    const oldPrice = currentIngredient.purchasePrice
    const oldPackageSize = currentIngredient.packageSize

    // Calculate price changes
    const priceChange = newPrice - oldPrice
    const percentageChange = oldPrice > 0 ? ((newPrice - oldPrice) / oldPrice) * 100 : 0
    const changeType = priceChange > 0 ? 'increase' : priceChange < 0 ? 'decrease' : 'no_change'

    // Calculate new cost per unit
    const newCostPerUnit = newPrice / (newPackageSize * currentIngredient.conversionFactor)

    // Update ingredient price
    const updatedIngredient = await prisma.ingredient.update({
      where: { id: ingredientId },
      data: {
        purchasePrice: newPrice,
        packageSize: newPackageSize,
        costPerUnit: newCostPerUnit,
        updatedAt: new Date()
      }
    })

    // Create price history record using raw SQL to bypass Prisma type issues
    if (priceChange !== 0) {
      try {
        console.log('Creating price history record:', {
          ingredientId,
          oldPrice,
          newPrice,
          priceChange: Math.abs(priceChange),
          percentageChange: Math.abs(percentageChange),
          changeType,
          businessId
        })
        
        await prisma.$executeRaw`
          INSERT INTO ingredient_price_history (
            id, "ingredientId", "oldPrice", "newPrice", "priceChange", 
            "percentageChange", "changeType", "changeDate", "businessId", 
            "createdAt", "updatedAt"
          ) VALUES (
            ${crypto.randomUUID()}, ${ingredientId}, ${oldPrice}, ${newPrice}, 
            ${Math.abs(priceChange)}, ${Math.abs(percentageChange)}, 
            ${changeType}, ${new Date()}, ${businessId}, ${new Date()}, ${new Date()}
          )
        `
        console.log('Price history record created successfully')
      } catch (error) {
        console.log('Failed to create price history record:', error)
        // Continue without price history if it fails
      }
    }

    return NextResponse.json({
      success: true,
      ingredient: updatedIngredient,
      priceChange: {
        oldPrice,
        newPrice,
        priceChange: Math.abs(priceChange),
        percentageChange: Math.abs(percentageChange),
        changeType
      }
    })

  } catch (error) {
    console.error('Error updating ingredient price:', error)
    return NextResponse.json(
      { error: 'Failed to update ingredient price' },
      { status: 500 }
    )
  }
}

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

    // Get ingredient
    const ingredient = await prisma.ingredient.findFirst({
      where: {
        id: ingredientId,
        businessId: businessId
      }
    })

    if (!ingredient) {
      return NextResponse.json({ error: 'Ingredient not found' }, { status: 404 })
    }

    // Fetch price history using raw SQL to bypass Prisma type issues
    let priceHistory = []
    try {
      console.log('Fetching price history for ingredient:', ingredientId)
      const priceHistoryResult = await prisma.$queryRaw`
        SELECT 
          id,
          "oldPrice" as "oldPrice",
          "newPrice" as "newPrice",
          "priceChange" as "priceChange",
          "percentageChange" as "percentageChange",
          "changeType" as "changeType",
          "changeDate" as "changeDate"
        FROM ingredient_price_history 
        WHERE "ingredientId" = ${ingredientId} 
        ORDER BY "changeDate" DESC 
        LIMIT 10
      `
      priceHistory = priceHistoryResult as any[]
      console.log('Price history result:', priceHistory)
    } catch (error) {
      console.log('Price history not available yet:', error)
      priceHistory = []
    }

    return NextResponse.json({
      success: true,
      ingredient,
      priceHistory
    })

  } catch (error) {
    console.error('Error fetching ingredient:', error)
    return NextResponse.json(
      { error: 'Failed to fetch ingredient' },
      { status: 500 }
    )
  }
}
