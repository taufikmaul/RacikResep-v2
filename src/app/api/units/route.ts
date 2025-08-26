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
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    const whereClause: any = { businessId }
    if (type) {
      whereClause.type = type
    }

    const units = await prisma.unit.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        symbol: true,
        type: true
      },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json(units)
  } catch (error) {
    console.error('Error fetching units:', error)
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

    const { name, symbol, type } = await request.json()

    if (!name || !symbol || !type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const unit = await prisma.unit.create({
      data: {
        name,
        symbol,
        type,
        businessId
      }
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: 'Tambah Satuan',
        description: `Menambahkan satuan "${name} (${symbol})"`,
        entityType: 'unit',
        entityId: unit.id,
        userId
      }
    })

    return NextResponse.json(unit, { status: 201 })
  } catch (error) {
    console.error('Error creating unit:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
