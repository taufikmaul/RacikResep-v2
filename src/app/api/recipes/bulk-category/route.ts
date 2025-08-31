import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { ids, categoryId } = await request.json()
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'Invalid IDs provided' }, { status: 400 })
    }

    if (!categoryId) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 })
    }

    // Get user's business
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { business: true }
    })

    if (!user?.business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    // Verify category exists and belongs to user's business
    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        businessId: user.business.id
      }
    })

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    // Update recipes in bulk
    const result = await prisma.recipe.updateMany({
      where: {
        id: { in: ids },
        businessId: user.business.id
      },
      data: {
        categoryId: categoryId
      }
    })

    return NextResponse.json({ 
      success: true, 
      updatedCount: result.count,
      message: `Successfully updated category for ${result.count} recipes`
    })

  } catch (error) {
    console.error('Error in bulk category update recipes:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
