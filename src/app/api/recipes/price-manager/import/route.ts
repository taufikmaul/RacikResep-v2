import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface CsvRow {
  id: string
  name: string
  sku: string
  description: string
  category: string
  cogsPerServing: number
  currentSellingPrice: number
  currentProfitMargin: number
  newSellingPrice: number
  reason: string
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.business?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const businessId = session.user.business.id
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!file.name.endsWith('.csv')) {
      return NextResponse.json({ error: 'File must be a CSV' }, { status: 400 })
    }

    const csvText = await file.text()
    const lines = csvText.split('\n').filter(line => line.trim())
    
    if (lines.length < 2) {
      return NextResponse.json({ error: 'CSV must have headers and at least one data row' }, { status: 400 })
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
    const expectedHeaders = [
      'ID', 'Nama Resep', 'SKU', 'Deskripsi', 'Kategori', 'HPP per Unit',
      'Harga Jual Saat Ini', 'Margin Profit Saat Ini (%)', 'Harga Jual Baru', 'Alasan Perubahan'
    ]

    // Validate headers
    if (!expectedHeaders.every(h => headers.includes(h))) {
      return NextResponse.json({ error: 'Invalid CSV format. Please use the provided template.' }, { status: 400 })
    }

    const dataRows = lines.slice(1)
    const results = {
      total: dataRows.length,
      processed: 0,
      updated: 0,
      errors: [] as string[]
    }

    const ops = [] as any[]

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i]
      const values = row.split(',').map(v => v.trim().replace(/"/g, ''))
      
      if (values.length !== headers.length) {
        results.errors.push(`Row ${i + 2}: Invalid number of columns`)
        continue
      }

      const rowData: any = {}
      headers.forEach((header, index) => {
        rowData[header] = values[index]
      })

      // Parse and validate data
      const recipeId = rowData['ID']
      const newPriceStr = rowData['Harga Jual Baru']
      const reason = rowData['Alasan Perubahan']

      if (!recipeId || !newPriceStr) {
        results.errors.push(`Row ${i + 2}: Missing ID or new price`)
        continue
      }

      const newPrice = parseFloat(newPriceStr)
      if (isNaN(newPrice) || newPrice < 0) {
        results.errors.push(`Row ${i + 2}: Invalid new price: ${newPriceStr}`)
        continue
      }

      // Get current recipe
      const recipe = await prisma.recipe.findFirst({
        where: {
          id: recipeId,
          businessId
        }
      })

      if (!recipe) {
        results.errors.push(`Row ${i + 2}: Recipe not found: ${recipeId}`)
        continue
      }

      const currentPrice = recipe.sellingPrice || 0
      if (newPrice === currentPrice) {
        results.processed++
        continue // Skip if no change
      }

      // Calculate changes
      const priceChange = newPrice - currentPrice
      const percentageChange = currentPrice > 0 ? ((newPrice - currentPrice) / currentPrice) * 100 : 0
      const changeType = priceChange > 0 ? 'increase' : priceChange < 0 ? 'decrease' : 'no_change'
      const newProfitMargin = recipe.cogsPerServing > 0 && newPrice > 0
        ? ((newPrice - recipe.cogsPerServing) / newPrice) * 100
        : 0

      // Update recipe
      ops.push(
        prisma.recipe.update({
          where: { id: recipeId },
          data: {
            sellingPrice: newPrice,
            profitMargin: newProfitMargin,
            updatedAt: new Date()
          }
        })
      )

      // Add history
      ops.push(
        prisma.recipePriceHistory.create({
          data: {
            recipeId: recipeId,
            oldPrice: currentPrice,
            newPrice,
            priceChange,
            percentageChange,
            changeType,
            changeDate: new Date(),
            reason: reason || 'CSV import update',
            businessId
          }
        })
      )

      results.processed++
      results.updated++
    }

    if (ops.length > 0) {
      await prisma.$transaction(ops)
    }

    return NextResponse.json({
      success: true,
      results
    })

  } catch (error) {
    console.error('Error importing CSV:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
