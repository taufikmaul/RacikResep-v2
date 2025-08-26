'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { DataTable, Column, PaginationInfo } from '@/components/ui/data-table'
import { Plus, Edit, Trash2, ChefHat, Calculator } from 'lucide-react'
import { ImagePreview } from '@/components/ui/image-preview'
import { RecipeDialog } from '@/components/recipes/recipe-dialog'

interface Recipe {
  id: string
  name: string
  description?: string
  instructions?: string
  imageUrl?: string
  yield: number
  yieldUnitId?: string
  laborCost: number
  operationalCost: number
  packagingCost: number
  totalCOGS: number
  cogsPerServing: number
  profitMargin: number
  marginType: string
  sellingPrice: number
  canBeUsedAsIngredient: boolean
  categoryId?: string
  category?: {
    id: string
    name: string
    color: string
  }
  yieldUnit?: {
    id: string
    name: string
    symbol: string
  }
  ingredients: Array<{
    id: string
    quantity: number
    cost: number
    ingredient: {
      id: string
      name: string
    }
    unit: {
      id: string
      name: string
      symbol: string
    }
  }>
  subRecipes?: Array<{
    id: string
    quantity: number
    cost: number
    subRecipe: {
      id: string
      name: string
    }
  }>
  createdAt: string
  updatedAt: string
}

export default function RecipesPage() {
  const { data: session } = useSession()
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    totalCount: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  })
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const fetchRecipes = async () => {
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sortBy,
        sortOrder,
        ...(searchTerm && { search: searchTerm })
      })
      
      const response = await fetch(`/api/recipes?${params}`)
      if (response.ok) {
        const result = await response.json()
        setRecipes(result.data)
        setPagination(result.pagination)
      }
    } catch (error) {
      console.error('Error fetching recipes:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session) {
      fetchRecipes()
    }
  }, [session, pagination.page, pagination.limit, sortBy, sortOrder, searchTerm])

  // Close image preview on Escape key
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPreviewUrl(null)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus resep ini?')) return

    try {
      const response = await fetch(`/api/recipes/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchRecipes()
      }
    } catch (error) {
      console.error('Error deleting recipe:', error)
    }
  }

  const handleEdit = (recipe: Recipe) => {
    setEditingRecipe(recipe)
    setIsDialogOpen(true)
  }

  // Convert page recipe format to dialog format
  const convertToDialogFormat = (recipe: Recipe | null) => {
    if (!recipe) return undefined
    return {
      id: recipe.id,
      name: recipe.name,
      imageUrl: recipe.imageUrl,
      description: recipe.description,
      instructions: recipe.instructions,
      yield: recipe.yield,
      yieldUnitId: recipe.yieldUnitId,
      laborCost: recipe.laborCost,
      operationalCost: recipe.operationalCost,
      packagingCost: recipe.packagingCost,
      profitMargin: recipe.profitMargin,
      marginType: recipe.marginType,
      sellingPrice: recipe.sellingPrice,
      canBeUsedAsIngredient: recipe.canBeUsedAsIngredient,
      categoryId: recipe.categoryId,
      ingredients: recipe.ingredients.map(ing => ({
        ingredientId: ing.ingredient.id,
        quantity: ing.quantity,
        unitId: ing.unit.id
      })),
      subRecipes: recipe.subRecipes?.map(sub => ({
        subRecipeId: sub.subRecipe.id,
        quantity: sub.quantity
      })) || []
    }
  }

  const handleDialogClose = () => {
    setIsDialogOpen(false)
    setEditingRecipe(null)
    fetchRecipes()
  }

  const handleSearchChange = (search: string) => {
    setSearchTerm(search)
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleSortChange = (newSortBy: string, newSortOrder: 'asc' | 'desc') => {
    setSortBy(newSortBy)
    setSortOrder(newSortOrder)
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }))
  }

  const handleLimitChange = (limit: number) => {
    setPagination(prev => ({ ...prev, limit, page: 1 }))
  }

  const handleSave = async (recipeData: any) => {
    try {
      const url = editingRecipe 
        ? `/api/recipes/${editingRecipe.id}`
        : '/api/recipes'
      
      const method = editingRecipe ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(recipeData),
      })

      if (!response.ok) {
        let serverMessage = 'Failed to save recipe'
        try {
          const data = await response.json()
          serverMessage = data?.error || data?.message || serverMessage
        } catch (_) {
          // fallback to text
          try {
            const text = await response.text()
            if (text) serverMessage = text
          } catch (_) {}
        }
        throw new Error(serverMessage)
      }

      await fetchRecipes()
    } catch (error) {
      console.error('Error saving recipe:', error)
      throw error
    }
  }

  const columns: Column<Recipe>[] = [
    {
      key: 'name',
      header: 'Nama Resep',
      sortable: true,
      render: (recipe) => (
        <div className="flex items-center space-x-3">
          {recipe.imageUrl ? (
            <button
              type="button"
              onClick={() => setPreviewUrl(recipe.imageUrl!)}
              aria-label={`Lihat gambar ${recipe.name}`}
              className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 border cursor-zoom-in"
              style={{ borderColor: '#E5E7EB', backgroundColor: '#F3F4F6' }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={recipe.imageUrl} alt={recipe.name} className="w-full h-full object-cover" />
            </button>
          ) : (
            <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 border" style={{ borderColor: '#E5E7EB', backgroundColor: '#F3F4F6' }}>
              <span className="text-xs font-semibold text-gray-700">
                {recipe.name
                  .split(' ')
                  .filter(Boolean)
                  .slice(0, 2)
                  .map(w => w[0]?.toUpperCase())
                  .join('')}
              </span>
            </div>
          )}
          <div>
            <div className="font-medium text-gray-900">{recipe.name}</div>
            {recipe.description && (
              <div className="text-sm text-gray-500">{recipe.description}</div>
            )}
            {recipe.category && (
              <span 
                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white mt-1"
                style={{ backgroundColor: recipe.category.color }}
              >
                {recipe.category.name}
              </span>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'yield',
      header: 'Hasil',
      sortable: true,
      render: (recipe) => (
        <div className="text-sm">
          <div className="font-medium text-gray-900">
            {recipe.yield} {recipe.yieldUnit?.symbol || 'porsi'}
          </div>
          <div className="text-gray-500">
            {recipe.ingredients.length + (recipe.subRecipes?.length || 0)} bahan
          </div>
        </div>
      )
    },
    {
      key: 'cogsPerServing',
      header: 'COGS per Unit',
      sortable: true,
      render: (recipe) => (
        <div className="text-sm">
          <div className="font-medium text-blue-900">
            Rp {recipe.cogsPerServing.toLocaleString('id-ID')}
          </div>
          <div className="text-blue-600 text-xs">
            Total: Rp {recipe.totalCOGS.toLocaleString('id-ID')}
          </div>
        </div>
      )
    },
    {
      key: 'sellingPrice',
      header: 'Harga Jual',
      sortable: true,
      render: (recipe) => recipe.sellingPrice ? (
        <div className="text-sm">
          <div className="font-medium text-green-900">
            Rp {recipe.sellingPrice.toLocaleString('id-ID')}
          </div>
          <div className="text-green-600 text-xs">
            Margin: {recipe.profitMargin}% 
          </div>
        </div>
      ) : (
        <span className="text-sm text-gray-500">-</span>
      )
    },
    {
      key: 'canBeUsedAsIngredient',
      header: 'Status',
      render: (recipe) => (
        <div className="flex flex-col gap-1">
          {recipe.canBeUsedAsIngredient && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              Dapat digunakan sebagai bahan
            </span>
          )}
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Aksi',
      render: (recipe) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleEdit(recipe)}
            className="h-10 w-10 sm:h-8 sm:w-8 p-0"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDelete(recipe.id)}
            className="h-10 w-10 sm:h-8 sm:w-8 p-0 text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ]

  const emptyState = (
    <div className="text-center py-12">
      <ChefHat className="mx-auto h-12 w-12 text-gray-400" />
      <h3 className="mt-2 text-sm font-medium text-gray-900">
        {searchTerm ? 'Tidak ada hasil' : 'Belum ada resep'}
      </h3>
      <p className="mt-1 text-sm text-gray-500">
        {searchTerm 
          ? 'Coba ubah kata kunci pencarian Anda'
          : 'Mulai dengan menambahkan resep pertama Anda'
        }
      </p>
      {!searchTerm && (
        <div className="mt-6">
          <Button onClick={() => setIsDialogOpen(true)} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Tambah Resep Pertama
          </Button>
        </div>
      )}
    </div>
  )

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Resep</h1>
            <p className="text-gray-600">Kelola resep dan hitung COGS secara otomatis</p>
          </div>
          <Button onClick={() => setIsDialogOpen(true)} className="flex items-center gap-2 w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            Tambah Resep
          </Button>
        </div>

        <DataTable
          data={recipes}
          columns={columns}
          pagination={pagination}
          loading={loading}
          searchTerm={searchTerm}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSearchChange={handleSearchChange}
          onSortChange={handleSortChange}
          onPageChange={handlePageChange}
          onLimitChange={handleLimitChange}
          searchPlaceholder="Cari resep..."
          emptyState={emptyState}
          renderItemCard={(recipe) => (
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {recipe.imageUrl ? (
                    <button
                      type="button"
                      onClick={() => setPreviewUrl(recipe.imageUrl!)}
                      aria-label={`Lihat gambar ${recipe.name}`}
                      className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 border cursor-zoom-in"
                      style={{ borderColor: '#E5E7EB', backgroundColor: '#F3F4F6' }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={recipe.imageUrl} alt={recipe.name} className="w-full h-full object-cover" />
                    </button>
                  ) : (
                    <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 border" style={{ borderColor: '#E5E7EB', backgroundColor: '#F3F4F6' }}>
                      <span className="text-xs font-semibold text-gray-700">
                        {recipe.name
                          .split(' ')
                          .filter(Boolean)
                          .slice(0, 2)
                          .map(w => w[0]?.toUpperCase())
                          .join('')}
                      </span>
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="font-medium text-gray-900 truncate">{recipe.name}</div>
                    {recipe.description && (
                      <div className="text-sm text-gray-500 truncate">{recipe.description}</div>
                    )}
                    {recipe.category && (
                      <span 
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white mt-1"
                        style={{ backgroundColor: recipe.category.color }}
                      >
                        {recipe.category.name}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm text-gray-500">COGS/Unit</div>
                  <div className="font-medium text-blue-900">Rp {recipe.cogsPerServing.toLocaleString('id-ID')}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-gray-500">Hasil</div>
                  <div className="font-medium text-gray-900">{recipe.yield} {recipe.yieldUnit?.symbol || 'porsi'}</div>
                </div>
                <div>
                  <div className="text-gray-500">Harga Jual</div>
                  {recipe.sellingPrice ? (
                    <div className="font-medium text-green-900">Rp {recipe.sellingPrice.toLocaleString('id-ID')}</div>
                  ) : (
                    <div className="text-gray-500">-</div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(recipe)}
                  className="flex-1"
                >
                  <Edit className="h-4 w-4 mr-2" /> Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(recipe.id)}
                  className="flex-1 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" /> Hapus
                </Button>
              </div>
            </div>
          )}
        />

        <RecipeDialog
          isOpen={isDialogOpen}
          onClose={handleDialogClose}
          recipe={convertToDialogFormat(editingRecipe)}
          onSave={handleSave}
        />
      </div>
      <ImagePreview
        isOpen={!!previewUrl}
        onClose={() => setPreviewUrl(null)}
        src={previewUrl || ''}
        alt="Preview gambar resep"
        title="Preview Gambar Resep"
      />
    </DashboardLayout>
  )
}
