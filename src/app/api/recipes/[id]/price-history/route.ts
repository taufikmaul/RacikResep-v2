import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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
    const { id: recipeId } = await params

    // Verify recipe belongs to business
    const recipe = await prisma.recipe.findFirst({
      where: {
        id: recipeId,
        businessId: businessId
      }
    })

    if (!recipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 })
    }

    // Get price history
    const priceHistory = await prisma.recipePriceHistory.findMany({
      where: {
        recipeId: recipeId,
        businessId: businessId
      },
      orderBy: {
        changeDate: 'desc'
      }
    })

    // Add COGS information to each history entry for margin calculation
    const priceHistoryWithMargins = priceHistory.map(history => ({
      ...history,
      cogsPerServing: recipe.cogsPerServing
    }))

    return NextResponse.json(priceHistoryWithMargins)

  } catch (error) {
    console.error('Error fetching recipe price history:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
