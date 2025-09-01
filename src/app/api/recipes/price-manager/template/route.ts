import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.business?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Generate CSV template with sample data
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

    const sampleRows = [
      [
        'recipe_id_1',
        'Contoh Resep 1',
        'RCP001',
        'Deskripsi resep contoh',
        'Kue',
        '15000',
        '25000',
        '40.0',
        '30000',
        'Penyesuaian harga pasar'
      ],
      [
        'recipe_id_2',
        'Contoh Resep 2',
        'RCP002',
        'Deskripsi resep contoh 2',
        'Minuman',
        '8000',
        '15000',
        '46.7',
        '18000',
        'Kenaikan biaya bahan'
      ]
    ]

    const csvContent = [
      csvHeaders.join(','),
      ...sampleRows.map(row => row.map(cell => `"${String(cell)}"`).join(','))
    ].join('\n')

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="recipe-price-template.csv"'
      }
    })

  } catch (error) {
    console.error('Error generating template:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
