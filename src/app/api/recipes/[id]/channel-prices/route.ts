import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET: Fetch all channel prices for a recipe
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
        name: true,
        commission: true
      },
      orderBy: { name: 'asc' }
    })

    // Get existing channel prices for this recipe
    const channelPrices = await prisma.channelPrice.findMany({
      where: { recipeId },
      select: {
        id: true,
        price: true,
        finalPrice: true,
        commission: true,
        taxRate: true,
        channelId: true,
        channel: {
          select: {
            id: true,
            name: true,
            commission: true
          }
        }
      }
    })

    // Create a map of channel prices
    const channelPriceMap = new Map(
      channelPrices.map(cp => [cp.channelId, cp])
    )

    // Return all channels with their prices (or default values)
    const result = salesChannels.map(channel => {
      const existingPrice = channelPriceMap.get(channel.id)
      return {
        channelId: channel.id,
        channelName: channel.name,
        channelCommission: channel.commission,
        price: existingPrice?.price || recipe.sellingPrice || 0,
        finalPrice: existingPrice?.finalPrice || 0,
        commission: existingPrice?.commission || channel.commission,
        taxRate: existingPrice?.taxRate || 0,

        channelPriceId: existingPrice?.id || null
      }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching channel prices:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST: Create or update channel prices for a recipe
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
    const userId = session.user.id
    const { id: recipeId } = await params
    const { channelPrices } = await request.json()

    // Verify recipe belongs to business
    const recipe = await prisma.recipe.findFirst({
      where: { id: recipeId, businessId }
    })

    if (!recipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 })
    }

    if (!Array.isArray(channelPrices)) {
      return NextResponse.json(
        { error: 'Invalid channel prices data' },
        { status: 400 }
      )
    }

    const results = []
    const operations = []

    for (const channelPriceData of channelPrices) {
      const {
        channelId,
        price,
        commission,
        taxRate,
        reason
      } = channelPriceData

      // Validate channel belongs to business
      const channel = await prisma.salesChannel.findFirst({
        where: { id: channelId, businessId }
      })

      if (!channel) {
        results.push({
          channelId,
          success: false,
          error: 'Sales channel not found'
        })
        continue
      }

      // Calculate final price
      const finalPrice = price * (1 + (taxRate / 100))

      // Check if channel price already exists
      const existingChannelPrice = await prisma.channelPrice.findUnique({
        where: {
          recipeId_channelId: {
            recipeId,
            channelId
          }
        }
      })

      if (existingChannelPrice) {
        // Update existing channel price
        const oldPrice = existingChannelPrice.price
        const priceChange = price - oldPrice
        const percentageChange = oldPrice > 0 ? ((price - oldPrice) / oldPrice) * 100 : 0
        const changeType = priceChange > 0 ? 'increase' : priceChange < 0 ? 'decrease' : 'no_change'

        // Update channel price
        operations.push(
          prisma.channelPrice.update({
            where: { id: existingChannelPrice.id },
            data: {
              price,
              finalPrice,
              commission,
              taxRate,
              updatedAt: new Date()
            }
          })
        )

        // Add price history if price changed
        if (priceChange !== 0) {
          operations.push(
            prisma.channelPriceHistory.create({
              data: {
                channelPriceId: existingChannelPrice.id,
                oldPrice,
                newPrice: price,
                priceChange,
                percentageChange,
                changeType,
                reason: reason || 'Channel price update',
                businessId
              }
            })
          )
        }

        results.push({
          channelId,
          success: true,
          action: 'updated'
        })
      } else {
        // Create new channel price
        const newChannelPrice = await prisma.channelPrice.create({
          data: {
            price,
            finalPrice,
            commission,
            taxRate,
            recipeId,
            channelId
          }
        })

        // Add initial price history
        operations.push(
          prisma.channelPriceHistory.create({
            data: {
              channelPriceId: newChannelPrice.id,
              oldPrice: 0,
              newPrice: price,
              priceChange: price,
              percentageChange: 0,
              changeType: 'increase',
              reason: reason || 'Initial channel price',
              businessId
            }
          })
        )

        results.push({
          channelId,
          success: true,
          action: 'created'
        })
      }
    }

    // Execute all operations
    await prisma.$transaction(operations)

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: 'Update Harga Channel',
        description: `Memperbarui harga channel untuk resep "${recipe.name}"`,
        entityType: 'recipe',
        entityId: recipeId,
        userId
      }
    })

    return NextResponse.json({
      message: 'Channel prices updated successfully',
      results
    })
  } catch (error) {
    console.error('Error updating channel prices:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
