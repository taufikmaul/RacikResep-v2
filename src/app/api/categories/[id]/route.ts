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
    const { id: categoryId } = await params

    // Check if category belongs to user's business
    const existingCategory = await prisma.category.findFirst({
      where: {
        id: categoryId,
        businessId
      }
    })

    if (!existingCategory) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    // Check if category is used
    const ingredientCount = await prisma.ingredient.count({
      where: { categoryId }
    })
    
    const recipeCount = await prisma.recipe.count({
      where: { categoryId }
    })

    if (ingredientCount > 0 || recipeCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete category that is in use' },
        { status: 400 }
      )
    }

    await prisma.category.delete({
      where: { id: categoryId }
    })

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: 'Hapus Kategori',
        description: `Menghapus kategori "${existingCategory.name}"`,
        entityType: 'category',
        entityId: categoryId,
        userId
      }
    })

    return NextResponse.json({ message: 'Category deleted successfully' })
  } catch (error) {
    console.error('Error deleting category:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
