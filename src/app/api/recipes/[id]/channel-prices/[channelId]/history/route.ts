import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; channelId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.business?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const businessId = session.user.business.id
    const { id: recipeId, channelId } = await params

    // Verify recipe belongs to business
    const recipe = await prisma.recipe.findFirst({
      where: { id: recipeId, businessId }
    })

    if (!recipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 })
    }

    // Verify channel belongs to business
    const channel = await prisma.salesChannel.findFirst({
      where: { id: channelId, businessId }
    })

    if (!channel) {
      return NextResponse.json({ error: 'Sales channel not found' }, { status: 404 })
    }

    // Get channel price
    const channelPrice = await prisma.channelPrice.findUnique({
      where: {
        recipeId_channelId: {
          recipeId,
          channelId
        }
      }
    })

    if (!channelPrice) {
      return NextResponse.json({ error: 'Channel price not found' }, { status: 404 })
    }

    // Get price history
    const priceHistory = await prisma.channelPriceHistory.findMany({
      where: { channelPriceId: channelPrice.id },
      orderBy: { changeDate: 'desc' },
      select: {
        id: true,
        oldPrice: true,
        newPrice: true,
        priceChange: true,
        percentageChange: true,
        changeType: true,
        reason: true,
        changeDate: true
      }
    })

    // Add COGS information to each history entry for margin calculation
    const priceHistoryWithMargins = priceHistory.map(history => ({
      ...history,
      cogsPerServing: recipe.cogsPerServing
    }))

    return NextResponse.json(priceHistoryWithMargins)
  } catch (error) {
    console.error('Error fetching channel price history:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
