import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_request: NextRequest) {
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

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        id: true,
        name: true,
        address: true,
        phone: true,
        email: true,
        logo: true,
        currency: true,
        language: true,
        theme: true
      }
    })

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    return NextResponse.json(business)
  } catch (error) {
    console.error('Error fetching business profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
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

    const {
      name,
      address,
      phone,
      email,
      currency,
      language,
      theme,
      logo
    } = await request.json()

    if (!name) {
      return NextResponse.json(
        { error: 'Business name is required' },
        { status: 400 }
      )
    }

    const business = await prisma.business.update({
      where: { id: businessId },
      data: {
        name,
        address: address || null,
        phone: phone || null,
        email: email || null,
        currency: currency || 'IDR',
        language: language || 'id',
        theme: theme || 'light',
        logo: logo || null
      },
      select: {
        id: true,
        name: true,
        address: true,
        phone: true,
        email: true,
        logo: true,
        currency: true,
        language: true,
        theme: true
      }
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: 'Update Profil',
        description: `Memperbarui profil bisnis`,
        entityType: 'business',
        entityId: businessId,
        userId
      }
    })

    return NextResponse.json(business)
  } catch (error) {
    console.error('Error updating business profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
