import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user with business information
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { business: true }
    })

    if (!user?.business?.id) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    const businessId = user.business.id

    const salesChannels = await prisma.salesChannel.findMany({
      where: { businessId },
      select: {
        id: true,
        name: true,
        commission: true
      },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json(salesChannels)
  } catch (error) {
    console.error('Error fetching sales channels:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user with business information
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { business: true }
    })

    if (!user?.business?.id) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    const businessId = user.business.id
    const userId = session.user.id

    const { name, commission } = await request.json()

    if (!name || commission === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const salesChannel = await prisma.salesChannel.create({
      data: {
        name,
        commission,
        businessId
      }
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: 'Tambah Channel',
        description: `Menambahkan sales channel "${name}"`,
        entityType: 'sales_channel',
        entityId: salesChannel.id,
        userId
      }
    })

    return NextResponse.json(salesChannel, { status: 201 })
  } catch (error) {
    console.error('Error creating sales channel:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
