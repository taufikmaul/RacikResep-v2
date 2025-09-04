import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.business?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const businessId = session.user.business.id
    const body = await request.json()
    const { 
      recipeIds, 
      updateMethod, 
      markupPercentage, 
      targetProfitAmount, 
      roundingOption, 
      customRounding, 
      reason,
      priceUpdates // Pre-calculated prices with rounding applied
    } = body

    if (!recipeIds || !Array.isArray(recipeIds) || recipeIds.length === 0) {
      return NextResponse.json({ error: 'Recipe IDs are required' }, { status: 400 })
    }

    if (!reason || !reason.trim()) {
      return NextResponse.json({ error: 'Reason is required' }, { status: 400 })
    }

    // Verify all recipes belong to the business
    const recipes = await prisma.recipe.findMany({
      where: {
        id: { in: recipeIds },
        businessId
      },
      include: {
        channelPrices: {
          include: {
            channel: true
          }
        }
      }
    })

    if (recipes.length !== recipeIds.length) {
      return NextResponse.json({ error: 'Some recipes not found or not accessible' }, { status: 404 })
    }

    // Get all sales channels for the business
    const salesChannels = await prisma.salesChannel.findMany({
      where: { businessId }
    })

    if (salesChannels.length === 0) {
      return NextResponse.json({ error: 'No sales channels found' }, { status: 400 })
    }

    const operations: any[] = []
    let updatedCount = 0

    // Apply rounding function
    const applyRounding = (price: number) => {
      switch (roundingOption) {
        case 'hundred':
          return Math.round(price / 100) * 100
        case 'thousand':
          return Math.round(price / 1000) * 1000
        case 'custom':
          return Math.round(price / customRounding) * customRounding
        case 'none':
        default:
          return Math.round(price)
      }
    }

    // Helper function to process a single price update
    const processPriceUpdate = (recipe: any, channel: any, roundedPrice: number) => {
      const finalPrice = Math.round(roundedPrice * (1 + 0.11)) // Default 11% tax

      // Find existing channel price
      const existingChannelPrice = recipe.channelPrices.find((cp: any) => cp.channelId === channel.id)

      if (existingChannelPrice) {
        // Update existing channel price
        const oldPrice = existingChannelPrice.price
        const priceChange = roundedPrice - oldPrice
        const percentageChange = oldPrice > 0 ? ((roundedPrice - oldPrice) / oldPrice) * 100 : 0
        const changeType = priceChange > 0 ? 'increase' : priceChange < 0 ? 'decrease' : 'no_change'

        // Update channel price
        operations.push(
          prisma.channelPrice.update({
            where: { id: existingChannelPrice.id },
            data: {
              price: roundedPrice,
              finalPrice,
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
                newPrice: roundedPrice,
                priceChange,
                percentageChange,
                changeType,
                reason: reason.trim(),
                businessId
              }
            })
          )
        }
      } else {
        // Create new channel price
        operations.push(
          prisma.channelPrice.create({
            data: {
              recipeId: recipe.id,
              channelId: channel.id,
              price: roundedPrice,
              finalPrice,
              commission: channel.commission,
              taxRate: 11, // Default 11% tax
            }
          }).then((newChannelPrice) => {
            // Add initial price history
            return prisma.channelPriceHistory.create({
              data: {
                channelPriceId: newChannelPrice.id,
                oldPrice: 0,
                newPrice: roundedPrice,
                priceChange: roundedPrice,
                percentageChange: 0,
                changeType: 'increase',
                reason: reason.trim(),
                businessId
              }
            })
          })
        )
      }

      updatedCount++
    }

    // If we have pre-calculated prices, use them; otherwise calculate on the fly
    if (priceUpdates && Array.isArray(priceUpdates)) {
      // Use pre-calculated prices with rounding already applied
      for (const priceUpdate of priceUpdates) {
        const recipe = recipes.find(r => r.id === priceUpdate.recipeId)
        const channel = salesChannels.find(c => c.id === priceUpdate.channelId)
        
        if (!recipe || !channel) continue

        const roundedPrice = priceUpdate.newPrice // Already has rounding applied
        processPriceUpdate(recipe, channel, roundedPrice)
      }
    } else {
      // Fallback: Calculate prices on the fly (original logic)
      for (const recipe of recipes) {
        for (const channel of salesChannels) {
          let newPrice = 0

          // Calculate new price based on method
          switch (updateMethod) {
            case 'markup':
              if (recipe.sellingPrice) {
                const markup = markupPercentage / 100
                newPrice = recipe.sellingPrice * (1 + markup)
              }
              break
            case 'profit':
              if (recipe.cogsPerServing) {
                const commissionRate = channel.commission / 100
                newPrice = (recipe.cogsPerServing + targetProfitAmount) / (1 - commissionRate)
              }
              break
            default:
              continue // Skip if manual method
          }

          if (newPrice > 0) {
            const roundedPrice = applyRounding(newPrice)
            processPriceUpdate(recipe, channel, roundedPrice)
          }
        }
      }
    }

    // Execute all operations
    await prisma.$transaction(operations)

    return NextResponse.json({
      success: true,
      message: `Successfully updated channel prices for ${updatedCount} recipe-channel combinations`,
      updatedCount
    })

  } catch (error) {
    console.error('Error updating bulk channel prices:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
