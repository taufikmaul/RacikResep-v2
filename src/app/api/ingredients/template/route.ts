import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.business?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const headers = [
      'name',
      'description',
      'categoryName',
      'purchasePrice',
      'packageSize',
      'purchaseUnitName',
      'purchaseUnitSymbol',
      'usageUnitName',
      'usageUnitSymbol',
      'conversionFactor',
    ]

    const sample = [
      'Gula Pasir',
      'Gula putih halus',
      'Bahan Kering',
      '15000',
      '1',
      'Kilogram',
      'kg',
      'Gram',
      'g',
      '1000',
    ]

    const csv = headers.join(',') + '\n' + sample.join(',') + '\n'

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="ingredients-template.csv"',
      },
    })
  } catch (error) {
    console.error('Error generating template:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
