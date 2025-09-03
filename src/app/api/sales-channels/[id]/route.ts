import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(
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
    const { id: channelId } = await params

    const { name, commission } = await request.json()

    if (!name || commission === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (commission < 0 || commission > 100) {
      return NextResponse.json(
        { error: 'Commission must be between 0 and 100' },
        { status: 400 }
      )
    }

    // Check if sales channel belongs to user's business
    const existingChannel = await prisma.salesChannel.findFirst({
      where: {
        id: channelId,
        businessId
      }
    })

    if (!existingChannel) {
      return NextResponse.json({ error: 'Sales channel not found' }, { status: 404 })
    }

    const salesChannel = await prisma.salesChannel.update({
      where: { id: channelId },
      data: {
        name,
        commission
      }
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: 'Update Saluran Penjualan',
        description: `Memperbarui saluran penjualan "${name}"`,
        entityType: 'sales_channel',
        entityId: channelId,
        userId
      }
    })

    return NextResponse.json(salesChannel)
  } catch (error) {
    console.error('Error updating sales channel:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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
    const { id: channelId } = await params

    // Check if sales channel belongs to user's business
    const existingChannel = await prisma.salesChannel.findFirst({
      where: {
        id: channelId,
        businessId
      }
    })

    if (!existingChannel) {
      return NextResponse.json({ error: 'Sales channel not found' }, { status: 404 })
    }

    // Delete associated channel prices first (cascade delete)
    await prisma.channelPrice.deleteMany({
      where: { channelId }
    })

    // Delete the sales channel
    await prisma.salesChannel.delete({
      where: { id: channelId }
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: 'Hapus Saluran Penjualan',
        description: `Menghapus saluran penjualan "${existingChannel.name}" dan semua harga channel terkait`,
        entityType: 'sales_channel',
        entityId: channelId,
        userId
      }
    })

    return NextResponse.json({ message: 'Sales channel deleted successfully' })
  } catch (error) {
    console.error('Error deleting sales channel:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
