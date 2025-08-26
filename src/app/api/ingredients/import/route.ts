import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Simple CSV parser supporting quoted fields and commas
function parseCSV(text: string): string[][] {
  const rows: string[][] = []
  let i = 0
  const len = text.length
  let row: string[] = []
  let field = ''
  let inQuotes = false

  const pushField = () => { row.push(field); field = '' }
  const pushRow = () => { rows.push(row); row = [] }

  while (i < len) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < len && text[i + 1] === '"') { field += '"'; i += 2; continue } // escaped quote
        inQuotes = false; i++; continue
      }
      field += ch; i++; continue
    } else {
      if (ch === '"') { inQuotes = true; i++; continue }
      if (ch === ',') { pushField(); i++; continue }
      if (ch === '\n') { pushField(); pushRow(); i++; continue }
      if (ch === '\r') { i++; continue }
      field += ch; i++; continue
    }
  }
  // last field
  pushField()
  // if anything in row, push
  if (row.length) pushRow()
  // remove possible trailing empty last row
  return rows.filter(r => r.some(c => c.trim() !== ''))
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.business?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const businessId = session.user.business.id
    const userId = session.user.id

    const form = await request.formData()
    const file = form.get('file') as File | null
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }
    const text = await file.text()
    const rows = parseCSV(text)
    if (rows.length === 0) {
      return NextResponse.json({ error: 'CSV is empty' }, { status: 400 })
    }

    // Expect headers as in template
    const headers = rows[0].map(h => h.trim().toLowerCase())
    const requiredHeaders = [
      'name','description','categoryname','purchaseprice','packagesize','purchaseunitname','purchaseunitsymbol','usageunitname','usageunitsymbol','conversionfactor'
    ]
    const missing = requiredHeaders.filter(h => !headers.includes(h))
    if (missing.length > 0) {
      return NextResponse.json({ error: `Missing headers: ${missing.join(', ')}` }, { status: 400 })
    }

    const idx = (h: string) => headers.indexOf(h)

    let created = 0
    let updated = 0
    const errors: { row: number; error: string }[] = []

    for (let r = 1; r < rows.length; r++) {
      const cols = rows[r]
      try {
        const name = cols[idx('name')]?.trim()
        if (!name) { throw new Error('name is required') }
        const description = cols[idx('description')]?.trim() || null
        const categoryName = cols[idx('categoryname')]?.trim() || null
        const purchasePrice = parseFloat(cols[idx('purchaseprice')] || '')
        const packageSize = parseFloat(cols[idx('packagesize')] || '')
        const purchaseUnitName = cols[idx('purchaseunitname')]?.trim() || ''
        const purchaseUnitSymbol = cols[idx('purchaseunitsymbol')]?.trim() || ''
        const usageUnitName = cols[idx('usageunitname')]?.trim() || ''
        const usageUnitSymbol = cols[idx('usageunitsymbol')]?.trim() || ''
        const conversionFactor = parseFloat(cols[idx('conversionfactor')] || '')

        if (!isFinite(purchasePrice) || purchasePrice <= 0) throw new Error('invalid purchasePrice')
        if (!isFinite(packageSize) || packageSize <= 0) throw new Error('invalid packageSize')
        if (!isFinite(conversionFactor) || conversionFactor <= 0) throw new Error('invalid conversionFactor')
        if (!purchaseUnitName || !usageUnitName) throw new Error('unit names are required')

        // Resolve or create category
        let categoryId: string | null = null
        if (categoryName) {
          let category = await prisma.category.findFirst({ where: { businessId, type: 'ingredient', name: categoryName } })
          if (!category) {
            category = await prisma.category.create({ data: { name: categoryName, type: 'ingredient', businessId } })
          }
          categoryId = category.id
        }

        // Resolve or create units
        const findUnit = async (name: string, symbol: string, type: 'purchase' | 'usage') => {
          let unit = await prisma.unit.findFirst({ where: { businessId, type, OR: [{ name }, { symbol }] } })
          if (!unit) {
            unit = await prisma.unit.create({ data: { name, symbol: symbol || name, type, businessId } })
          }
          return unit
        }
        const purchaseUnit = await findUnit(purchaseUnitName, purchaseUnitSymbol, 'purchase')
        const usageUnit = await findUnit(usageUnitName, usageUnitSymbol, 'usage')

        const costPerUnit = purchasePrice / conversionFactor

        // Upsert by name within business
        const existing = await prisma.ingredient.findFirst({ where: { businessId, name } })
        if (existing) {
          await prisma.ingredient.update({
            where: { id: existing.id },
            data: {
              description,
              purchasePrice,
              packageSize,
              conversionFactor,
              costPerUnit,
              categoryId,
              purchaseUnitId: purchaseUnit.id,
              usageUnitId: usageUnit.id,
            },
          })
          updated++
        } else {
          await prisma.ingredient.create({
            data: {
              name,
              description,
              purchasePrice,
              packageSize,
              conversionFactor,
              costPerUnit,
              categoryId,
              purchaseUnitId: purchaseUnit.id,
              usageUnitId: usageUnit.id,
              businessId,
            },
          })
          created++
        }
      } catch (e: any) {
        errors.push({ row: r + 1, error: e?.message || 'Unknown error' })
      }
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: 'Import Bahan',
        description: `Import bahan: ${created} dibuat, ${updated} diperbarui, ${errors.length} gagal`,
        entityType: 'ingredient',
        userId,
      },
    })

    return NextResponse.json({ created, updated, failed: errors.length, errors })
  } catch (error) {
    console.error('Error importing ingredients:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
