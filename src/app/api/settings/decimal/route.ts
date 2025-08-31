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
    console.log('Decimal settings GET: Fetching for business:', businessId)
    
    // Test database connection
    try {
      await prisma.$queryRaw`SELECT 1`
      console.log('Decimal settings GET: Database connection successful')
    } catch (dbTestError) {
      console.error('Decimal settings GET: Database connection failed:', dbTestError)
      return new NextResponse('Database connection failed', { status: 500 })
    }
    
    const settings = await prisma.decimalSettings.findUnique({
      where: { businessId },
    })

    if (!settings) {
      console.log('Decimal settings GET: No settings found, creating default')
      // Create default settings if not exists
      try {
        const newSettings = await prisma.decimalSettings.create({
          data: {
            businessId,
            decimalPlaces: 2,
            roundingMethod: 'round',
            thousandSeparator: ',',
            decimalSeparator: '.',
            currencySymbol: 'Rp',
            currencyPosition: 'before',
            showTrailingZeros: true
          },
        })
        console.log('Decimal settings GET: Created default settings:', newSettings)
        return NextResponse.json(newSettings)
      } catch (createError) {
        console.error('Decimal settings GET: Error creating default settings:', createError)
        return new NextResponse('Error creating default settings', { status: 500 })
      }
    }

    console.log('Decimal settings GET: Found existing settings:', settings)
    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error fetching decimal settings:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.business?.id) {
      console.log('Decimal settings PUT: Unauthorized - no business ID')
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const businessId = session.user.business.id
    console.log('Decimal settings PUT: Processing for business:', businessId)
    
    const data = await request.json()
    console.log('Decimal settings PUT: Received data:', data)

    // Validate required fields
    if (typeof data.decimalPlaces !== 'number' || typeof data.roundingMethod !== 'string') {
      console.log('Decimal settings PUT: Missing required fields')
      return new NextResponse('Missing required fields: decimalPlaces and roundingMethod', { status: 400 })
    }

    // Validate data types and ranges
    const decimalPlaces = parseInt(data.decimalPlaces.toString()) || 0
    const roundingMethod = data.roundingMethod as 'round' | 'floor' | 'ceil'
    const showTrailingZeros = Boolean(data.showTrailingZeros)

    if (decimalPlaces < 0 || decimalPlaces > 10) {
      return new NextResponse('Invalid decimalPlaces: must be between 0 and 10', { status: 400 })
    }

    if (!['round', 'floor', 'ceil'].includes(roundingMethod)) {
      return new NextResponse('Invalid roundingMethod: must be round, floor, or ceil', { status: 400 })
    }

    try {
      const settings = await prisma.decimalSettings.upsert({
        where: { businessId },
        update: {
          decimalPlaces,
          roundingMethod,
          thousandSeparator: data.thousandSeparator || ',',
          decimalSeparator: data.decimalSeparator || '.',
          currencySymbol: data.currencySymbol || 'Rp',
          currencyPosition: data.currencyPosition || 'before',
          showTrailingZeros,
        },
        create: {
          businessId,
          decimalPlaces,
          roundingMethod,
          thousandSeparator: data.thousandSeparator || ',',
          decimalSeparator: data.decimalSeparator || '.',
          currencySymbol: data.currencySymbol || 'Rp',
          currencyPosition: data.currencyPosition || 'before',
          showTrailingZeros,
        },
      })

      console.log('Decimal settings PUT: Successfully saved:', settings)
      return NextResponse.json(settings)
    } catch (dbError) {
      console.error('Decimal settings PUT: Database error:', dbError)
      return new NextResponse('Database error while saving decimal settings', { status: 500 })
    }
  } catch (error) {
    console.error('Error updating decimal settings:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
