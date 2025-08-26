import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { business: true }
    })

    if (!user?.business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    return NextResponse.json({
      accentColor: user.business.accentColor,
      theme: user.business.theme
    })
  } catch (error) {
    console.error('Error fetching theme settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { accentColor, theme } = await request.json()

    // Validate accent color
    const validColors = ['blue', 'red', 'green', 'yellow', 'purple', 'pink', 'indigo', 'cyan', 'orange', 'amber', 'lime', 'emerald', 'teal', 'sky', 'violet', 'fuchsia', 'rose']
    if (accentColor && !validColors.includes(accentColor)) {
      return NextResponse.json({ error: 'Invalid accent color' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { business: true }
    })

    if (!user?.business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    const updatedBusiness = await prisma.business.update({
      where: { id: user.business.id },
      data: {
        ...(accentColor && { accentColor }),
        ...(theme && { theme })
      }
    })

    return NextResponse.json({
      accentColor: updatedBusiness.accentColor,
      theme: updatedBusiness.theme
    })
  } catch (error) {
    console.error('Error updating theme settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
