import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('Price update API called')
    
    const session = await getServerSession(authOptions)
    if (!session?.user?.business?.id) {
      console.log('Unauthorized access attempt')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const businessId = session.user.business.id
    const { id: recipeId } = await params
    const { newPrice, reason } = await request.json()
    
    console.log('Request data:', { recipeId, newPrice, reason, businessId })

    // Validate input
    if (typeof newPrice !== 'number' || newPrice <= 0) {
      return NextResponse.json({ error: 'Invalid price' }, { status: 400 })
    }

    // Get the current recipe
    console.log('Fetching current recipe...')
    const currentRecipe = await prisma.recipe.findFirst({
      where: {
        id: recipeId,
        businessId: businessId
      }
    })

    if (!currentRecipe) {
      console.log('Recipe not found:', { recipeId, businessId })
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 })
    }

    console.log('Current recipe found:', { 
      id: currentRecipe.id, 
      name: currentRecipe.name, 
      oldPrice: currentRecipe.sellingPrice 
    })
    
    const oldPrice = currentRecipe.sellingPrice

    // Calculate price changes
    const priceChange = newPrice - oldPrice
    const percentageChange = oldPrice > 0 ? ((newPrice - oldPrice) / oldPrice) * 100 : 0
    const changeType = priceChange > 0 ? 'increase' : priceChange < 0 ? 'decrease' : 'no_change'

    // Calculate new profit margin
    const newProfitMargin = currentRecipe.cogsPerServing > 0 ? 
      ((newPrice - currentRecipe.cogsPerServing) / newPrice) * 100 : 0

    // Update recipe price
    console.log('Updating recipe price...', { newPrice, newProfitMargin })
    const updatedRecipe = await prisma.recipe.update({
      where: { id: recipeId },
      data: {
        sellingPrice: newPrice,
        profitMargin: newProfitMargin,
        updatedAt: new Date()
      }
    })
    
    console.log('Recipe updated successfully:', { 
      id: updatedRecipe.id, 
      newPrice: updatedRecipe.sellingPrice,
      newProfitMargin: updatedRecipe.profitMargin
    })

    // Create price history record
    await prisma.recipePriceHistory.create({
      data: {
        recipeId: recipeId,
        oldPrice: oldPrice,
        newPrice: newPrice,
        priceChange: priceChange,
        percentageChange: percentageChange,
        changeType: changeType,
        changeDate: new Date(),
        reason: reason || 'Manual price update',
        businessId: businessId
      }
    })

    // Log activity (optional - skip if it fails)
    try {
      await prisma.activityLog.create({
        data: {
          action: 'PRICE_UPDATE',
          description: `Updated recipe price from ${oldPrice} to ${newPrice}`,
          entityType: 'recipe',
          entityId: recipeId,
          userId: session.user.id
        }
      })
    } catch (logError) {
      console.warn('Failed to create activity log:', logError)
      // Continue with the main operation even if logging fails
    }

    return NextResponse.json({
      success: true,
      recipe: updatedRecipe,
      priceChange: {
        oldPrice,
        newPrice,
        priceChange,
        percentageChange,
        changeType
      }
    })

  } catch (error) {
    console.error('Error updating recipe price:', error)
    
    // Provide more specific error messages
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Database error: ${error.message}` },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
