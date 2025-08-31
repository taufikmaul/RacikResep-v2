import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.business?.id) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const businessId = session.user.business.id
    console.log('SKU settings GET: Fetching for business:', businessId)
    
    // Test database connection
    try {
      await prisma.$queryRaw`SELECT 1`
      console.log('SKU settings GET: Database connection successful')
    } catch (dbTestError) {
      console.error('SKU settings GET: Database connection failed:', dbTestError)
      return new NextResponse('Database connection failed', { status: 500 })
    }
    
    const settings = await prisma.skuSettings.findUnique({
      where: { businessId },
    })

    if (!settings) {
      console.log('SKU settings GET: No settings found, creating default')
      // Create default settings if not exists
      try {
        const newSettings = await prisma.skuSettings.create({
          data: {
            businessId,
          },
        })
        console.log('SKU settings GET: Created default settings:', newSettings)
        return NextResponse.json(newSettings)
      } catch (createError) {
        console.error('SKU settings GET: Error creating default settings:', createError)
        return new NextResponse('Error creating default settings', { status: 500 })
      }
    }

    console.log('SKU settings GET: Found existing settings:', settings)
    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error fetching SKU settings:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.business?.id) {
      console.log('SKU settings PUT: Unauthorized - no business ID')
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const businessId = session.user.business.id
    console.log('SKU settings PUT: Processing for business:', businessId)
    
    const data = await request.json()
    console.log('SKU settings PUT: Received data:', data)

    // Validate required fields
    if (!data.ingredientPrefix || !data.recipePrefix) {
      console.log('SKU settings PUT: Missing required fields')
      return new NextResponse('Missing required fields: ingredientPrefix and recipePrefix', { status: 400 })
    }

    // Validate data types and ranges
    const numberPadding = parseInt(data.numberPadding) || 3
    const nextIngredientNumber = parseInt(data.nextIngredientNumber) || 1
    const nextRecipeNumber = parseInt(data.nextRecipeNumber) || 1

    if (numberPadding < 1 || numberPadding > 6) {
      return new NextResponse('Invalid numberPadding: must be between 1 and 6', { status: 400 })
    }

    if (nextIngredientNumber < 1) {
      return new NextResponse('Invalid nextIngredientNumber: must be greater than 0', { status: 400 })
    }

    if (nextRecipeNumber < 1) {
      return new NextResponse('Invalid nextRecipeNumber: must be greater than 0', { status: 400 })
    }

    try {
      const settings = await prisma.skuSettings.upsert({
        where: { businessId },
        update: {
          ingredientPrefix: data.ingredientPrefix,
          recipePrefix: data.recipePrefix,
          numberPadding,
          separator: data.separator || '-',
          nextIngredientNumber,
          nextRecipeNumber,
        },
        create: {
          businessId,
          ingredientPrefix: data.ingredientPrefix,
          recipePrefix: data.recipePrefix,
          numberPadding,
          separator: data.separator || '-',
          nextIngredientNumber,
          nextRecipeNumber,
        },
      })

      console.log('SKU settings PUT: Successfully saved:', settings)
      return NextResponse.json(settings)
    } catch (dbError) {
      console.error('SKU settings PUT: Database error:', dbError)
      return new NextResponse('Database error while saving SKU settings', { status: 500 })
    }
  } catch (error) {
    console.error('Error updating SKU settings:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
