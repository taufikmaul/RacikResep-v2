import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface BulkPriceBody {
  recipeIds: string[]
  mode: 'set' | 'increase_percent' | 'decrease_percent' | 'increase_amount' | 'decrease_amount'
  value: number
  reason?: string
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.business?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const businessId = session.user.business.id
    const body = (await request.json()) as BulkPriceBody

    if (!Array.isArray(body.recipeIds) || body.recipeIds.length === 0) {
      return NextResponse.json({ error: 'No recipes selected' }, { status: 400 })
    }
    if (!['set', 'increase_percent', 'decrease_percent', 'increase_amount', 'decrease_amount'].includes(body.mode)) {
      return NextResponse.json({ error: 'Invalid mode' }, { status: 400 })
    }
    if (typeof body.value !== 'number' || isNaN(body.value)) {
      return NextResponse.json({ error: 'Invalid value' }, { status: 400 })
    }

    // Fetch recipes scoped to business
    const recipes = await prisma.recipe.findMany({
      where: {
        id: { in: body.recipeIds },
        businessId
      }
    })

    if (recipes.length === 0) {
      return NextResponse.json({ error: 'Recipes not found' }, { status: 404 })
    }

    const ops = [] as any[]
    let updatedCount = 0

    for (const recipe of recipes) {
      const currentPrice = recipe.sellingPrice || 0
      let newPrice = currentPrice

      switch (body.mode) {
        case 'set':
          newPrice = Math.max(0, Math.round(body.value))
          break
        case 'increase_percent':
          newPrice = Math.max(0, Math.round(currentPrice * (1 + body.value / 100)))
          break
        case 'decrease_percent':
          newPrice = Math.max(0, Math.round(currentPrice * (1 - body.value / 100)))
          break
        case 'increase_amount':
          newPrice = Math.max(0, Math.round(currentPrice + body.value))
          break
        case 'decrease_amount':
          newPrice = Math.max(0, Math.round(currentPrice - body.value))
          break
      }

      // Skip if unchanged
      if (newPrice === currentPrice) {
        continue
      }

      const priceChange = newPrice - currentPrice
      const percentageChange = currentPrice > 0 ? ((newPrice - currentPrice) / currentPrice) * 100 : 0
      const changeType = priceChange > 0 ? 'increase' : priceChange < 0 ? 'decrease' : 'no_change'
      const newProfitMargin = recipe.cogsPerServing > 0 && newPrice > 0
        ? ((newPrice - recipe.cogsPerServing) / newPrice) * 100
        : 0

      // Update recipe
      ops.push(
        prisma.recipe.update({
          where: { id: recipe.id },
          data: {
            sellingPrice: newPrice,
            profitMargin: newProfitMargin,
            updatedAt: new Date()
          }
        })
      )

      // Add history
      ops.push(
        prisma.recipePriceHistory.create({
          data: {
            recipeId: recipe.id,
            oldPrice: currentPrice,
            newPrice,
            priceChange,
            percentageChange,
            changeType,
            changeDate: new Date(),
            reason: body.reason || 'Bulk price update',
            businessId
          }
        })
      )

      // Optional activity log (best-effort)
      ops.push(
        prisma.activityLog.create({
          data: {
            action: 'PRICE_UPDATE',
            description: `Bulk updated recipe price from ${currentPrice} to ${newPrice}`,
            entityType: 'recipe',
            entityId: recipe.id,
            userId: session.user.id
          }
        }).catch(() => null)
      )

      updatedCount += 1
    }

    if (ops.length === 0) {
      return NextResponse.json({ success: true, updatedCount: 0 })
    }

    await prisma.$transaction(ops)

    return NextResponse.json({ success: true, updatedCount })
  } catch (error) {
    console.error('Bulk price update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
