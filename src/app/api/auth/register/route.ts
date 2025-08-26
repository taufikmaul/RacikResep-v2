import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, businessName } = await request.json()

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user and business in a transaction
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        business: {
          create: {
            name: businessName,
            currency: 'IDR',
            language: 'id',
            theme: 'light'
          }
        }
      },
      include: {
        business: true
      }
    })

    // Create default categories and units
    if (user.business) {
      await prisma.category.createMany({
        data: [
          { name: 'Daging', type: 'ingredient', businessId: user.business.id, color: '#EF4444' },
          { name: 'Sayuran', type: 'ingredient', businessId: user.business.id, color: '#22C55E' },
          { name: 'Bumbu', type: 'ingredient', businessId: user.business.id, color: '#F59E0B' },
          { name: 'Minuman', type: 'recipe', businessId: user.business.id, color: '#3B82F6' },
          { name: 'Makanan Utama', type: 'recipe', businessId: user.business.id, color: '#8B5CF6' },
          { name: 'Dessert', type: 'recipe', businessId: user.business.id, color: '#EC4899' }
        ]
      })

      await prisma.unit.createMany({
        data: [
          { name: 'Kilogram', symbol: 'kg', type: 'purchase', businessId: user.business.id },
          { name: 'Liter', symbol: 'L', type: 'purchase', businessId: user.business.id },
          { name: 'Pcs', symbol: 'pcs', type: 'purchase', businessId: user.business.id },
          { name: 'Gram', symbol: 'g', type: 'usage', businessId: user.business.id },
          { name: 'Mililiter', symbol: 'ml', type: 'usage', businessId: user.business.id },
          { name: 'Sendok Makan', symbol: 'sdm', type: 'usage', businessId: user.business.id }
        ]
      })

      await prisma.salesChannel.createMany({
        data: [
          { name: 'Dine In', commission: 0, businessId: user.business.id },
          { name: 'GoFood', commission: 20, businessId: user.business.id },
          { name: 'GrabFood', commission: 25, businessId: user.business.id }
        ]
      })
    }

    return NextResponse.json({
      message: 'User created successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
