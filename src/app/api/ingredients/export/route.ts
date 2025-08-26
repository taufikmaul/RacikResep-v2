import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.business?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const businessId = session.user.business.id

    const items = await prisma.ingredient.findMany({
      where: { businessId },
      include: {
        category: { select: { name: true } },
        purchaseUnit: { select: { name: true, symbol: true } },
        usageUnit: { select: { name: true, symbol: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

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

    const escape = (v: any) => {
      if (v === null || v === undefined) return ''
      const s = String(v)
      if (s.includes('"') || s.includes(',') || s.includes('\n')) {
        return '"' + s.replace(/"/g, '""') + '"'
      }
      return s
    }

    const lines = [headers.join(',')]
    for (const it of items) {
      const row = [
        escape(it.name),
        escape(it.description || ''),
        escape(it.category?.name || ''),
        escape(it.purchasePrice),
        escape(it.packageSize),
        escape(it.purchaseUnit?.name || ''),
        escape(it.purchaseUnit?.symbol || ''),
        escape(it.usageUnit?.name || ''),
        escape(it.usageUnit?.symbol || ''),
        escape(it.conversionFactor),
      ]
      lines.push(row.join(','))
    }

    const csv = lines.join('\n')

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="ingredients-export.csv"`,
      },
    })
  } catch (error) {
    console.error('Error exporting ingredients:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
