import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.business?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const businessId = session.user.business.id
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''

    // Build where clause
    const whereClause: any = { businessId }
    if (search) {
      whereClause.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
        { description: { contains: search } },
        {
          category: {
            is: {
              name: { contains: search }
            }
          }
        }
      ]
    }

    const recipes = await prisma.recipe.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        sku: true,
        description: true,
        cogsPerServing: true,
        sellingPrice: true,
        profitMargin: true,
        category: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    // Generate CSV content
    const csvHeaders = [
      'ID',
      'Nama Resep',
      'SKU',
      'Deskripsi',
      'Kategori',
      'HPP per Unit',
      'Harga Jual Saat Ini',
      'Margin Profit Saat Ini (%)',
      'Harga Jual Baru',
      'Alasan Perubahan'
    ]

    const csvRows = recipes.map(recipe => [
      recipe.id,
      recipe.name,
      recipe.sku || '',
      recipe.description || '',
      recipe.category?.name || '',
      recipe.cogsPerServing || 0,
      recipe.sellingPrice || 0,
      recipe.profitMargin || 0,
      '', // Harga Jual Baru - empty for user to fill
      ''  // Alasan Perubahan - empty for user to fill
    ])

    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n')

    const filename = `recipe-prices-${new Date().toISOString().split('T')[0]}.csv`

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    })

  } catch (error) {
    console.error('Error exporting recipes:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
