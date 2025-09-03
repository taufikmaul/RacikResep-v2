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
      where: { id: recipeId, businessId }
    })

    if (!recipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 })
    }

    // Get all sales channels for the business
    const salesChannels = await prisma.salesChannel.findMany({
      where: { businessId },
      select: {
        id: true,
        name: true
      },
      orderBy: { name: 'asc' }
    })

    // Get all channel prices for this recipe
    const channelPrices = await prisma.channelPrice.findMany({
      where: { recipeId },
      select: {
        id: true,
        channelId: true,
        channel: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    // Get price history for all channel prices
    const priceHistory = await prisma.channelPriceHistory.findMany({
      where: { 
        channelPriceId: { 
          in: channelPrices.map(cp => cp.id) 
        }
      },
      orderBy: { changeDate: 'desc' },
      select: {
        id: true,
        channelPriceId: true,
        oldPrice: true,
        newPrice: true,
        priceChange: true,
        percentageChange: true,
        changeType: true,
        reason: true,
        changeDate: true
      }
    })

    // Map price history with channel information and COGS
    const priceHistoryWithChannels = priceHistory.map(history => {
      const channelPrice = channelPrices.find(cp => cp.id === history.channelPriceId)
      return {
        ...history,
        channelId: channelPrice?.channelId || '',
        channelName: channelPrice?.channel?.name || '',
        cogsPerServing: recipe.cogsPerServing
      }
    })

    return NextResponse.json({
      priceHistory: priceHistoryWithChannels,
      channels: salesChannels
    })
  } catch (error) {
    console.error('Error fetching all channel price history:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
