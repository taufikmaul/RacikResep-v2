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

    const { ids, isFavorite } = await request.json()

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'IDs array is required' }, { status: 400 })
    }

    if (typeof isFavorite !== 'boolean') {
      return NextResponse.json({ error: 'isFavorite boolean is required' }, { status: 400 })
    }

    // Get user's business
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { business: true }
    })

    if (!user?.business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    // Update recipes to set/unset favorite status
    const result = await prisma.recipe.updateMany({
      where: {
        id: { in: ids },
        businessId: user.business.id
      },
      data: {
        isFavorite: isFavorite
      }
    })

    return NextResponse.json({
      message: `Successfully ${isFavorite ? 'set' : 'unset'} favorite for ${result.count} recipes`,
      count: result.count
    })

  } catch (error) {
    console.error('Error bulk updating favorite status:', error)
    return NextResponse.json(
      { error: 'Failed to update favorite status' },
      { status: 500 }
    )
  }
}
