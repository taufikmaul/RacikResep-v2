import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const plans = await prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' }
    })

    return NextResponse.json(plans)
  } catch (error) {
    console.error('Error fetching plans:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, price, currency, interval, features, maxUsers, maxRecipes, maxIngredients } = body

    // Validate required fields
    if (!name || typeof price !== 'number' || !interval) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const plan = await prisma.plan.create({
      data: {
        name,
        description,
        price,
        currency: currency || 'IDR',
        interval,
        features: JSON.stringify(features || []),
        maxUsers: maxUsers || 1,
        maxRecipes: maxRecipes || 100,
        maxIngredients: maxIngredients || 500
      }
    })

    return NextResponse.json(plan, { status: 201 })
  } catch (error) {
    console.error('Error creating plan:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
