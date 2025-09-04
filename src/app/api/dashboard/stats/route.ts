import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !((session.user as any).business?.id)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const businessId = (session.user as any).business.id
    const userId = (session.user as any).id

    // Use transaction for better performance and data consistency
    const [
      // Basic counts
      totalRecipes,
      basicRecipes,
      favoriteRecipes,
      // Financial aggregates
      financialMetrics,
      // Top recipes with optimized query
      topRecipes,
      // Most expensive recipes
      mostExpensiveRecipes,
      // Sales channels
      salesChannels,
      // Category breakdown with counts
      categoryBreakdown,
      // Recent activities
      recentActivities,
      // Ingredient usage stats
      ingredientUsageData
    ] = await prisma.$transaction([
      // Get basic recipe counts
      prisma.recipe.count({ where: { businessId } }),
      prisma.recipe.count({ where: { businessId, canBeUsedAsIngredient: true } }),
      prisma.recipe.count({ where: { businessId, isFavorite: true } }),
      
      // Get financial metrics
      prisma.recipe.aggregate({
        where: { businessId },
        _sum: { totalCOGS: true, sellingPrice: true, yield: true },
        _avg: { profitMargin: true, totalCOGS: true }
      }),
      
      // Top 5 most profitable recipes
      prisma.recipe.findMany({
        where: { businessId },
        select: {
          id: true,
          name: true,
          profitMargin: true,
          cogsPerServing: true,
          sellingPrice: true,
          totalCOGS: true
        },
        orderBy: { profitMargin: 'desc' },
        take: 5
      }),
      
      // Most expensive recipes by COGS
      prisma.recipe.findMany({
        where: { businessId },
        select: {
          id: true,
          name: true,
          totalCOGS: true,
          cogsPerServing: true,
          yield: true
        },
        orderBy: { totalCOGS: 'desc' },
        take: 5
      }),
      
      // Sales channels
      prisma.salesChannel.findMany({
        where: { businessId },
        select: {
          id: true,
          name: true,
          commission: true,
          icon: true
        },
        orderBy: { name: 'asc' }
      }),
      
      // Category breakdown with efficient counting
      prisma.category.findMany({
        where: { businessId },
        select: {
          id: true,
          name: true,
          color: true,
          _count: {
            select: {
              recipes: true,
              ingredients: true
            }
          }
        }
      }),
      
      // Recent activities
      prisma.activityLog.findMany({
        where: { userId },
        select: {
          id: true,
          action: true,
          description: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      }),
      
      // Ingredient usage with aggregation
      prisma.recipeIngredient.groupBy({
        by: ['ingredientId'],
        where: {
          recipe: {
            businessId
          }
        },
        _count: {
          ingredientId: true
        },
        _sum: {
          quantity: true
        },
        orderBy: {
          _count: {
            ingredientId: 'desc'
          }
        },
        take: 10 // Get top 10 for most/least used
      })
    ])

    // Get additional counts efficiently
    const [totalIngredients, totalCategories, totalSalesChannels] = await prisma.$transaction([
      prisma.ingredient.count({ where: { businessId } }),
      prisma.category.count({ where: { businessId } }),
      prisma.salesChannel.count({ where: { businessId } })
    ])

    // Calculate efficient profit margin ranges using raw query
    const marginRanges = await prisma.$queryRaw<Array<{range: string, count: bigint}>>`
      SELECT 
        CASE 
          WHEN profitMargin < 20 THEN 'low'
          WHEN profitMargin >= 20 AND profitMargin < 40 THEN 'medium'
          ELSE 'high'
        END as range,
        COUNT(*) as count
      FROM recipes 
      WHERE businessId = ${businessId}
      GROUP BY 
        CASE 
          WHEN profitMargin < 20 THEN 'low'
          WHEN profitMargin >= 20 AND profitMargin < 40 THEN 'medium'
          ELSE 'high'
        END
    `

    // Process profit margin ranges
    const profitMarginRanges = {
      low: Number(marginRanges.find(r => r.range === 'low')?.count || 0),
      medium: Number(marginRanges.find(r => r.range === 'medium')?.count || 0),
      high: Number(marginRanges.find(r => r.range === 'high')?.count || 0)
    }

    // Get ingredient details for the top usage stats
    let mostUsedIngredients: any[] = []
    let leastUsedIngredients: any[] = []
    
    if (ingredientUsageData.length > 0) {
      const topIngredientIds = ingredientUsageData.slice(0, 5).map(u => u.ingredientId)
      const bottomIngredientIds = ingredientUsageData.slice(-5).map(u => u.ingredientId)
      
      const [topIngredients, bottomIngredients] = await prisma.$transaction([
        prisma.ingredient.findMany({
          where: { id: { in: topIngredientIds }, businessId },
          select: { id: true, name: true, usageUnit: { select: { symbol: true } } }
        }),
        prisma.ingredient.findMany({
          where: { id: { in: bottomIngredientIds }, businessId },
          select: { id: true, name: true, usageUnit: { select: { symbol: true } } }
        })
      ])
      
      mostUsedIngredients = ingredientUsageData.slice(0, 5).map(usage => {
        const ingredient = topIngredients.find(ing => ing.id === usage.ingredientId)
        return {
          id: ingredient?.id || '',
          name: ingredient?.name || 'Unknown',
          unit: ingredient?.usageUnit?.symbol || '',
          recipeCount: (usage._count as any)?.ingredientId || 0,
          totalQuantity: usage._sum?.quantity || 0
        }
      }).filter(item => item.name !== 'Unknown')
      
      leastUsedIngredients = ingredientUsageData.slice(-5).reverse().map(usage => {
        const ingredient = bottomIngredients.find(ing => ing.id === usage.ingredientId)
        return {
          id: usage.ingredientId,
          name: ingredient?.name || 'Unknown',
          unit: ingredient?.usageUnit?.symbol || '',
          recipeCount: (usage._count as any)?.ingredientId || 0,
          totalQuantity: usage._sum?.quantity || 0
        }
      }).filter(item => item.name !== 'Unknown')
    }

    return NextResponse.json({
      // Basic counts
      totalIngredients,
      totalRecipes,
      basicRecipes,
      favoriteRecipes,
      totalCategories,
      totalSalesChannels,
      
      // Financial metrics
      totalCOGS: financialMetrics._sum.totalCOGS || 0,
      totalPotentialRevenue: (financialMetrics._sum.sellingPrice || 0) * (financialMetrics._sum.yield || 0),
      averageProfitMargin: financialMetrics._avg.profitMargin || 0,
      averageCOGS: financialMetrics._avg.totalCOGS || 0,
      averageRecipeComplexity: 0, // Will be calculated separately if needed
      
      // Top performers
      topRecipes,
      mostExpensiveRecipes,
      
      // Ingredient usage
      mostUsedIngredients,
      leastUsedIngredients,
      
      // Sales channels
      salesChannels,
      
      // Category data
      categoryBreakdown: categoryBreakdown.map(cat => ({
        id: cat.id,
        name: cat.name,
        color: cat.color,
        recipeCount: cat._count.recipes,
        ingredientCount: cat._count.ingredients
      })),
      
      // Distribution data
      profitMarginRanges,
      
      // Recent activities
      recentActivities: recentActivities.map(activity => ({
        ...activity,
        createdAt: activity.createdAt.toISOString()
      }))
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}