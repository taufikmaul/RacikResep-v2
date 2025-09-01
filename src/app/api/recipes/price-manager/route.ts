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
    const { searchParams } = new URL(request.url)
    
    // Search parameter
    const search = searchParams.get('search') || ''

    // Build where clause
    const whereClause: any = { businessId }
    if (search) {
      whereClause.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
        { description: { contains: search } },
        {
          category: {
            is: {
              name: { contains: search }
            }
          }
        }
      ]
    }

    const recipes = await prisma.recipe.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        sku: true,
        description: true,
        cogsPerServing: true,
        basePrice: true,
        sellingPrice: true,
        profitMargin: true,
        marginType: true,
        category: {
          select: {
            id: true,
            name: true,
            color: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json(recipes)
  } catch (error) {
    console.error('Error fetching recipes for price manager:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
