import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.business?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const businessId = session.user.business.id
    const userId = session.user.id
    const { id: unitId } = await params

    // Check if unit belongs to user's business
    const existingUnit = await prisma.unit.findFirst({
      where: {
        id: unitId,
        businessId
      }
    })

    if (!existingUnit) {
      return NextResponse.json({ error: 'Unit not found' }, { status: 404 })
    }

    // Check if unit is used
    const ingredientPurchaseCount = await prisma.ingredient.count({
      where: { purchaseUnitId: unitId }
    })
    
    const ingredientUsageCount = await prisma.ingredient.count({
      where: { usageUnitId: unitId }
    })

    const recipeIngredientCount = await prisma.recipeIngredient.count({
      where: { unitId }
    })

    if (ingredientPurchaseCount > 0 || ingredientUsageCount > 0 || recipeIngredientCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete unit that is in use' },
        { status: 400 }
      )
    }

    await prisma.unit.delete({
      where: { id: unitId }
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: 'Hapus Satuan',
        description: `Menghapus satuan "${existingUnit.name}"`,
        entityType: 'unit',
        entityId: unitId,
        userId
      }
    })

    return NextResponse.json({ message: 'Unit deleted successfully' })
  } catch (error) {
    console.error('Error deleting unit:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
