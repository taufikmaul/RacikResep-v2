'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { DataTable, Column, PaginationInfo } from '@/components/ui/data-table'
import { BulkActions } from '@/components/ui/bulk-actions'
import { Plus, Edit, Trash2, ChefHat, Calculator, Heart, Filter } from 'lucide-react'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { Info } from 'lucide-react'
import { ImagePreview } from '@/components/ui/image-preview'
import { RecipeDialog } from '@/components/recipes/recipe-dialog'
import { useDecimalSettings } from '@/hooks/useDecimalSettings'
import { formatCurrency } from '@/lib/utils'
import { ConfirmationDialog } from '@/components/ui/alert-dialog'
import toast from 'react-hot-toast'

interface Recipe {
  id: string
  sku?: string
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
  isFavorite?: boolean
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
  const { settings: decimalSettings } = useDecimalSettings()
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('')
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
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [categories, setCategories] = useState<Array<{ id: string; name: string; color: string }>>([])

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    title: string
    description: string
    onConfirm: () => void
  }>({
    open: false,
    title: '',
    description: '',
    onConfirm: () => {}
  })

  const fetchRecipes = async () => {
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sortBy,
        sortOrder,
        ...(searchTerm && { search: searchTerm }),
        ...(showFavoritesOnly && { favorites: 'true' }),
        ...(selectedCategory && { category: selectedCategory })
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

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories?type=recipe')
      if (response.ok) {
        const result = await response.json()
        setCategories(result || [])
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
      setCategories([]) // Ensure categories is always an array
    }
  }

  useEffect(() => {
    if (session) {
      fetchRecipes()
      fetchCategories()
    }
  }, [session, pagination.page, pagination.limit, sortBy, sortOrder, searchTerm, showFavoritesOnly, selectedCategory])

  // Close image preview on Escape key
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPreviewUrl(null)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const handleDelete = (id: string) => {
    setConfirmDialog({
      open: true,
      title: 'Hapus Resep',
      description: 'Apakah Anda yakin ingin menghapus resep ini? Tindakan ini tidak dapat dibatalkan.',
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/recipes/${id}`, {
            method: 'DELETE'
          })

          if (response.ok) {
            fetchRecipes()
            toast.success('Resep berhasil dihapus')
          } else {
            toast.error('Gagal menghapus resep')
          }
        } catch (error) {
          console.error('Error deleting recipe:', error)
          toast.error('Gagal menghapus resep')
        }
      }
    })
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
      sku: recipe.sku || '',
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

  const handleBulkDelete = (ids: string[]) => {
    setConfirmDialog({
      open: true,
      title: 'Hapus Resep Terpilih',
      description: `Apakah Anda yakin ingin menghapus ${ids.length} resep yang dipilih? Tindakan ini tidak dapat dibatalkan.`,
      onConfirm: async () => {
        try {
          const response = await fetch('/api/recipes/bulk-delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids })
          })
          
          if (response.ok) {
            const result = await response.json()
            setRecipes(recipes.filter(recipe => !ids.includes(recipe.id)))
            setSelectedItems([])
            // Refresh data if current page becomes empty
            if (recipes.length <= ids.length && pagination.page > 1) {
              setPagination(prev => ({ ...prev, page: prev.page - 1 }))
            }
            toast.success(result.message)
          } else {
            const error = await response.json()
            toast.error(`Gagal menghapus resep: ${error.error}`)
          }
        } catch (error) {
          console.error('Error bulk deleting recipes:', error)
          toast.error('Gagal menghapus resep yang dipilih')
        }
      }
    })
  }

  const handleBulkExport = async (ids: string[]) => {
    try {
      const params = new URLSearchParams({ ids: ids.join(',') })
      window.open(`/api/recipes/export?${params}`, '_blank')
    } catch (error) {
      console.error('Error bulk exporting recipes:', error)
      alert('Gagal export resep yang dipilih')
    }
  }

  const handleBulkCategoryChange = async (ids: string[], categoryId: string) => {
    try {
      const response = await fetch('/api/recipes/bulk-category', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, categoryId })
      })
      
      if (response.ok) {
        const result = await response.json()
        // Update local state
        setRecipes(recipes.map(recipe => 
          ids.includes(recipe.id) 
            ? { ...recipe, categoryId, category: categories?.find(c => c.id === categoryId) }
            : recipe
        ))
        setSelectedItems([])
        toast.success(result.message)
      } else {
        const error = await response.json()
        toast.error(`Gagal mengubah kategori: ${error.error}`)
      }
    } catch (error) {
      console.error('Error bulk changing categories:', error)
      toast.error('Gagal mengubah kategori resep yang dipilih')
    }
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

  const handleToggleFavorite = async (recipeId: string) => {
    try {
      const recipe = recipes.find(r => r.id === recipeId)
      if (!recipe) return

      const response = await fetch(`/api/recipes/${recipeId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isFavorite: !recipe.isFavorite }),
      })

      if (response.ok) {
        setRecipes(prev => prev.map(r => 
          r.id === recipeId ? { ...r, isFavorite: !r.isFavorite } : r
        ))
        toast.success(recipe.isFavorite ? 'Resep dihapus dari favorit' : 'Resep ditambahkan ke favorit')
      } else {
        toast.error('Gagal mengubah status favorit')
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
      toast.error('Gagal mengubah status favorit')
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
            {recipe.sku && (
              <div className="text-xs text-gray-600 mt-1">
                SKU: <span className="font-mono">{recipe.sku}</span>
              </div>
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
              {decimalSettings ? formatCurrency(recipe.cogsPerServing, decimalSettings) : `Rp ${recipe.cogsPerServing.toLocaleString('id-ID')}`}
            </div>
            <div className="text-blue-600 text-xs">
              Total: {decimalSettings ? formatCurrency(recipe.totalCOGS, decimalSettings) : `Rp ${recipe.totalCOGS.toLocaleString('id-ID')}`}
            </div>
        </div>
      )
    },

    {
      key: 'canBeUsedAsIngredient',
      header: 'Basic Recipe',
      render: (recipe) => (
        <div className="flex items-center justify-center">
          <HoverCard>
            <HoverCardTrigger asChild>
              <button 
                type="button"
                className="p-2 rounded-full transition-colors duration-200 hover:bg-gray-100"
                aria-label={recipe.canBeUsedAsIngredient ? 'Basic Recipe - Dapat digunakan sebagai bahan' : 'Regular Recipe - Tidak dapat digunakan sebagai bahan'}
              >
                <ChefHat 
                  className={`h-5 w-5 ${
                    recipe.canBeUsedAsIngredient 
                      ? 'text-purple-600' 
                      : 'text-gray-400'
                  }`} 
                />
              </button>
            </HoverCardTrigger>
            <HoverCardContent className="w-80">
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-900">
                  {recipe.canBeUsedAsIngredient ? 'Basic Recipe' : 'Regular Recipe'}
                </h4>
                <p className="text-sm text-gray-600">
                  {recipe.canBeUsedAsIngredient 
                    ? 'Resep ini dapat digunakan sebagai bahan dalam resep lain. Berguna untuk resep dasar seperti saus, bumbu, atau komponen yang sering digunakan.'
                    : 'Resep ini adalah resep standar yang tidak dapat digunakan sebagai bahan dalam resep lain.'
                  }
                </p>
                {recipe.canBeUsedAsIngredient && (
                  <p className="text-xs text-gray-500">
                    Contoh: Saus tomat, bumbu dasar, atau kaldu dapat dijadikan Basic Recipe.
                  </p>
                )}
              </div>
            </HoverCardContent>
          </HoverCard>
        </div>
      )
    },
    {
      key: 'favorite',
      header: 'Favorit',
      render: (recipe) => (
        <div className="flex items-center justify-center">
          <button
            onClick={() => handleToggleFavorite(recipe.id)}
            className={`p-2 rounded-full transition-colors duration-200 ${
              recipe.isFavorite 
                ? 'text-yellow-500 hover:text-yellow-600' 
                : 'text-gray-400 hover:text-yellow-500'
            }`}
          >
            <Heart className={`h-5 w-5 ${recipe.isFavorite ? 'fill-current' : ''}`} />
          </button>
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
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button onClick={() => setIsDialogOpen(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Tambah Resep
            </Button>
            <Button variant="outline" onClick={() => window.location.href = '/recipes/price-manager'} className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Price Manager
            </Button>
          </div>
        </div>

        {/* Filter Controls */}
        <div style={{ 
              background: "var(--color-panel-solid)"
            }} 
            className="rounded-lg border border-gray-200 p-4"
        >
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filter:</span>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 flex-1">
              {/* Favorite Filter */}
              <button
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  showFavoritesOnly
                    ? 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                    : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                }`}
              >
                <Heart className={`h-4 w-4 ${showFavoritesOnly ? 'fill-current text-yellow-600' : ''}`} />
                Favorit
              </button>

              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Semua Kategori</option>
                {categories?.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>

              {/* Clear Filters */}
              {(showFavoritesOnly || selectedCategory) && (
                <button
                  onClick={() => {
                    setShowFavoritesOnly(false)
                    setSelectedCategory('')
                  }}
                  className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors duration-200"
                >
                  Hapus Filter
                </button>
              )}
            </div>
          </div>
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
          selectedItems={selectedItems}
          onSelectionChange={setSelectedItems}
          bulkActions={
            <BulkActions
              data={recipes}
              selectedItems={selectedItems}
              onSelectionChange={setSelectedItems}
              onBulkDelete={handleBulkDelete}
              onBulkExport={handleBulkExport}
              onBulkCategoryChange={handleBulkCategoryChange}
              categories={categories || []}
              loading={loading}
            />
          }
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
                    {recipe.sku && (
                      <div className="text-xs text-gray-600 mt-1">
                        SKU: <span className="font-mono">{recipe.sku}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      {recipe.category && (
                        <span 
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white"
                          style={{ backgroundColor: recipe.category.color }}
                        >
                          {recipe.category.name}
                        </span>
                      )}
                      <HoverCard>
                        <HoverCardTrigger asChild>
                          <button 
                            type="button"
                            className="p-1 rounded-full transition-colors duration-200 hover:bg-gray-100"
                            aria-label={recipe.canBeUsedAsIngredient ? 'Basic Recipe - Dapat digunakan sebagai bahan' : 'Regular Recipe - Tidak dapat digunakan sebagai bahan'}
                          >
                            <ChefHat 
                              className={`h-4 w-4 ${
                                recipe.canBeUsedAsIngredient 
                                  ? 'text-purple-600' 
                                  : 'text-gray-400'
                              }`} 
                            />
                          </button>
                        </HoverCardTrigger>
                        <HoverCardContent className="w-80">
                          <div className="space-y-2">
                            <h4 className="text-sm font-semibold text-gray-900">
                              {recipe.canBeUsedAsIngredient ? 'Basic Recipe' : 'Regular Recipe'}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {recipe.canBeUsedAsIngredient 
                                ? 'Resep ini dapat digunakan sebagai bahan dalam resep lain. Berguna untuk resep dasar seperti saus, bumbu, atau komponen yang sering digunakan.'
                                : 'Resep ini adalah resep standar yang tidak dapat digunakan sebagai bahan dalam resep lain.'
                              }
                            </p>
                            {recipe.canBeUsedAsIngredient && (
                              <p className="text-xs text-gray-500">
                                Contoh: Saus tomat, bumbu dasar, atau kaldu dapat dijadikan Basic Recipe.
                              </p>
                            )}
                          </div>
                        </HoverCardContent>
                      </HoverCard>
                    </div>
                  </div>
                </div>
                                  <div className="text-right flex-shrink-0">
                    <div className="text-sm text-gray-500">COGS/Unit</div>
                    <div className="font-medium text-blue-900">
                      {decimalSettings ? formatCurrency(recipe.cogsPerServing, decimalSettings) : `Rp ${recipe.cogsPerServing.toLocaleString('id-ID')}`}
                    </div>
                  </div>
              </div>

              <div className="text-sm">
                <div>
                  <div className="text-gray-500">Hasil</div>
                  <div className="font-medium text-gray-900">{recipe.yield} {recipe.yieldUnit?.symbol || 'porsi'}</div>
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

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}
        title={confirmDialog.title}
        description={confirmDialog.description}
        onConfirm={confirmDialog.onConfirm}
      />
    </DashboardLayout>
  )
}
