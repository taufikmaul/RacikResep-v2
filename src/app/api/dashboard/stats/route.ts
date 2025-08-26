import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.business?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const businessId = session.user.business.id

    // Get total ingredients
    const totalIngredients = await prisma.ingredient.count({
      where: { businessId }
    })

    // Get total recipes
    const totalRecipes = await prisma.recipe.count({
      where: { businessId }
    })

    // Get average profit margin
    const recipes = await prisma.recipe.findMany({
      where: { businessId },
      select: { profitMargin: true }
    })

    const averageProfitMargin = recipes.length > 0 
      ? recipes.reduce((sum, recipe) => sum + recipe.profitMargin, 0) / recipes.length 
      : 0

    // Get top 5 most profitable recipes
    const topRecipes = await prisma.recipe.findMany({
      where: { businessId },
      select: {
        id: true,
        name: true,
        profitMargin: true,
        cogsPerServing: true
      },
      orderBy: { profitMargin: 'desc' },
      take: 5
    })

    // Get recent activities
    const recentActivities = await prisma.activityLog.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        action: true,
        description: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    })

    return NextResponse.json({
      totalIngredients,
      totalRecipes,
      averageProfitMargin,
      topRecipes,
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
