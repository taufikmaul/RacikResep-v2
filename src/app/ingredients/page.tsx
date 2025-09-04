'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { DataTable, Column, PaginationInfo } from '@/components/ui/data-table'
import { BulkActions } from '@/components/ui/bulk-actions'
import { Plus, Edit, Trash2, Package, Upload, Download, FileText } from 'lucide-react'
import { IngredientDialog } from '@/components/ingredients/ingredient-dialog'
import { IngredientImportDialog } from '@/components/ingredients/ingredient-import-dialog'
import { PriceUpdateDialog } from '@/components/ingredients/price-update-dialog'
import { CompactCsvUI } from '@/components/ingredients/compact-csv-ui'
import { useDecimalSettings } from '@/hooks/useDecimalSettings'
import { formatCurrency } from '@/lib/utils'
import { ConfirmationDialog } from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import toast from 'react-hot-toast'

interface Ingredient {
  id: string
  sku?: string
  name: string
  description?: string
  purchasePrice: number
  packageSize: number
  costPerUnit: number
  categoryId?: string
  purchaseUnitId: string
  usageUnitId: string
  conversionFactor: number
  usageCount?: number
  category?: {
    id: string
    name: string
    color: string
  }
  purchaseUnit: {
    id: string
    name: string
    symbol: string
  }
  usageUnit: {
    id: string
    name: string
    symbol: string
  }
  createdAt: string
  updatedAt: string
}

export default function IngredientsPage() {
  const { data: session } = useSession()
  const { settings: decimalSettings } = useDecimalSettings()
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
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
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null)
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [isPriceUpdateOpen, setIsPriceUpdateOpen] = useState(false)
  const [updatingIngredient, setUpdatingIngredient] = useState<Ingredient | null>(null)
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [categories, setCategories] = useState<Array<{ id: string; name: string; color: string }>>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('')

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

  const fetchIngredients = async () => {
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sortBy,
        sortOrder,
        ...(searchTerm && { search: searchTerm }),
        ...(selectedCategory && { category: selectedCategory })
      })
      
      const response = await fetch(`/api/ingredients?${params}`)
      if (response.ok) {
        const result = await response.json()
        setIngredients(result.data)
        setPagination(result.pagination)
      }
    } catch (error) {
      console.error('Error fetching ingredients:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories?type=ingredient')
      if (response.ok) {
        const result = await response.json()
        setCategories(result || [])
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  useEffect(() => {
    if (session) {
      fetchIngredients()
      fetchCategories()
    }
  }, [session, pagination.page, pagination.limit, sortBy, sortOrder, searchTerm, selectedCategory])

  const handleDelete = (id: string) => {
    setConfirmDialog({
      open: true,
      title: 'Hapus Bahan',
      description: 'Apakah Anda yakin ingin menghapus bahan ini? Tindakan ini tidak dapat dibatalkan.',
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/ingredients/${id}`, {
            method: 'DELETE'
          })

          if (response.ok) {
            fetchIngredients()
            toast.success('Bahan berhasil dihapus')
          } else {
            toast.error('Gagal menghapus bahan')
          }
        } catch (error) {
          console.error('Error deleting ingredient:', error)
          toast.error('Gagal menghapus bahan')
        }
      }
    })
  }

  const handleEdit = (ingredient: Ingredient) => {
    setEditingIngredient(ingredient)
    setIsDialogOpen(true)
  }

  const handlePriceUpdate = (ingredient: Ingredient) => {
    setUpdatingIngredient(ingredient)
    setIsPriceUpdateOpen(true)
  }

  // Convert page ingredient format to dialog format
  const convertToDialogFormat = (ingredient: Ingredient | null) => {
    if (!ingredient) return undefined
    return {
      id: ingredient.id,
      sku: ingredient.sku || '',
      name: ingredient.name,
      description: ingredient.description || '',
      categoryId: ingredient.categoryId || '',
      purchasePrice: ingredient.purchasePrice,
      purchaseQuantity: ingredient.packageSize,
      purchaseUnitId: ingredient.purchaseUnitId,
      usageUnitId: ingredient.usageUnitId,
      conversionFactor: ingredient.conversionFactor
    }
  }

  const handleDialogClose = () => {
    setIsDialogOpen(false)
    setEditingIngredient(null)
    fetchIngredients()
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

  const handleBulkDelete = (ids: string[]) => {
    setConfirmDialog({
      open: true,
      title: 'Hapus Bahan Terpilih',
      description: `Apakah Anda yakin ingin menghapus ${ids.length} bahan yang dipilih? Tindakan ini tidak dapat dibatalkan.`,
      onConfirm: async () => {
        try {
          const response = await fetch('/api/ingredients/bulk-delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids })
          })
          
          if (response.ok) {
            const result = await response.json()
            setIngredients(ingredients.filter(ingredient => !ids.includes(ingredient.id)))
            setSelectedItems([])
            // Refresh data if current page becomes empty
            if (ingredients.length <= ids.length && pagination.page > 1) {
              setPagination(prev => ({ ...prev, page: prev.page - 1 }))
            }
            toast.success(result.message)
          } else {
            const error = await response.json()
            toast.error(`Gagal menghapus bahan: ${error.error}`)
          }
        } catch (error) {
          console.error('Error bulk deleting ingredients:', error)
          toast.error('Gagal menghapus bahan yang dipilih')
        }
      }
    })
  }

  const handleBulkExport = async (ids: string[]) => {
    try {
      const params = new URLSearchParams({ ids: ids.join(',') })
      window.open(`/api/ingredients/export?${params}`, '_blank')
      toast.success('Export bahan berhasil dimulai')
    } catch (error) {
      console.error('Error bulk exporting ingredients:', error)
      toast.error('Gagal export bahan yang dipilih')
    }
  }

  const handleCategoryManagement = () => {
    // Navigate to category management page or open category dialog
    window.location.href = '/settings?tab=categories'
  }

  const handleBulkCategoryChange = async (ids: string[], categoryId: string) => {
    try {
      const response = await fetch('/api/ingredients/bulk-category', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, categoryId })
      })
      
      if (response.ok) {
        const result = await response.json()
        // Update local state
        setIngredients(ingredients.map(ingredient => 
          ids.includes(ingredient.id) 
            ? { ...ingredient, categoryId, category: categories.find(c => c.id === categoryId) }
            : ingredient
        ))
        setSelectedItems([])
        toast.success(result.message)
      } else {
        const error = await response.json()
        toast.error(`Gagal mengubah kategori: ${error.error}`)
      }
    } catch (error) {
      console.error('Error bulk changing categories:', error)
      toast.error('Gagal mengubah kategori bahan yang dipilih')
    }
  }

  const handleSave = async (ingredientData: any) => {
    try {
      // Convert dialog format to API format
      const apiData = {
        sku: ingredientData.sku || undefined,
        name: ingredientData.name,
        description: ingredientData.description,
        categoryId: ingredientData.categoryId,
        purchasePrice: ingredientData.purchasePrice,
        packageSize: ingredientData.purchaseQuantity,
        purchaseUnitId: ingredientData.purchaseUnitId,
        usageUnitId: ingredientData.usageUnitId,
        conversionFactor: ingredientData.conversionFactor
      }

      const url = editingIngredient 
        ? `/api/ingredients/${editingIngredient.id}`
        : '/api/ingredients'
      
      const method = editingIngredient ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData),
      })

      if (!response.ok) {
        throw new Error('Failed to save ingredient')
      }

      await fetchIngredients()
    } catch (error) {
      console.error('Error saving ingredient:', error)
      throw error
    }
  }

  const columns: Column<Ingredient>[] = [
    {
      key: 'name',
      header: 'Nama Bahan',
      sortable: true,
      render: (ingredient) => (
        <div className="flex items-center space-x-3">
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: ingredient.category?.color || '#6B7280' }}
          >
            <Package className="h-4 w-4 text-white" />
          </div>
          <div>
            <div className="font-medium text-gray-900">{ingredient.name}</div>
            {ingredient.description && (
              <div className="text-sm text-gray-500">{ingredient.description}</div>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'sku',
      header: 'SKU',
      sortable: false,
      render: (ingredient) => (
        <div className="text-sm">
          {ingredient.sku ? (
            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-mono bg-gray-100 text-gray-700">
              {ingredient.sku}
            </span>
          ) : (
            <span className="text-sm text-gray-500">-</span>
          )}
        </div>
      )
    },
    {
      key: 'category',
      header: 'Kategori',
      sortable: true,
      render: (ingredient) => ingredient.category ? (
        <div className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: ingredient.category.color }}
          ></div>
          <span className="text-sm text-gray-900">{ingredient.category.name}</span>
        </div>
      ) : (
        <span className="text-sm text-gray-500">-</span>
      )
    },
    {
      key: 'purchasePrice',
      header: 'Harga Beli',
      sortable: true,
      render: (ingredient) => (
        <div className="text-sm">
          <div className="font-medium text-gray-900">
            {decimalSettings ? formatCurrency(ingredient.purchasePrice, decimalSettings) : `Rp ${ingredient.purchasePrice.toLocaleString('id-ID')}`}
          </div>
          <div className="text-gray-500">
            per {ingredient.packageSize} {ingredient.purchaseUnit.symbol}
          </div>
        </div>
      )
    },
    {
      key: 'costPerUnit',
      header: 'Biaya per Unit',
      sortable: false,
      render: (ingredient) => (
        <div className="text-sm">
          <div className="font-medium text-gray-900">
            {decimalSettings ? formatCurrency(ingredient.costPerUnit, decimalSettings) : `Rp ${ingredient.costPerUnit.toLocaleString('id-ID')}`}
          </div>
          <div className="text-gray-500">
            per {ingredient.usageUnit.symbol}
          </div>
        </div>
      )
    },
    {
      key: 'conversionFactor',
      header: 'Faktor Konversi',
      sortable: false,
      render: (ingredient) => (
        <div className="text-sm">
          <div className="font-medium text-gray-900">
            {ingredient.conversionFactor}
          </div>
          <div className="text-gray-500">
            {ingredient.usageUnit.symbol} per {ingredient.purchaseUnit.symbol}
          </div>
        </div>
      )
    },
    {
      key: 'usageCount',
      header: 'Dipakai di Resep',
      sortable: true,
      render: (ingredient) => (
        <div className="text-sm font-medium text-gray-900">{ingredient.usageCount ?? 0} resep</div>
      )
    },
    {
      key: 'actions',
      header: 'Aksi',
      render: (ingredient) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleEdit(ingredient)}
            className="h-10 w-10 sm:h-8 sm:w-8 p-0"
            title="Edit Bahan"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePriceUpdate(ingredient)}
            className="h-10 w-10 sm:h-8 sm:w-8 p-0 text-green-600 hover:text-green-700"
            title="Update Harga"
          >
            💰
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDelete(ingredient.id)}
            className="h-10 w-10 sm:h-8 sm:w-8 p-0 text-red-600 hover:text-red-700"
            title="Hapus Bahan"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ]

  const emptyState = (
    <div className="text-center py-12">
      <Package className="mx-auto h-12 w-12 text-gray-400" />
      <h3 className="mt-2 text-sm font-medium text-gray-900">
        {searchTerm ? 'Tidak ada hasil' : 'Belum ada bahan baku'}
      </h3>
      <p className="mt-1 text-sm text-gray-500">
        {searchTerm 
          ? 'Coba ubah kata kunci pencarian Anda'
          : 'Mulai dengan menambahkan bahan baku pertama Anda'
        }
      </p>
      {!searchTerm && (
        <div className="mt-6">
          <Button onClick={() => setIsDialogOpen(true)} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Tambah Bahan Pertama
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
            <h1 className="text-2xl font-bold text-gray-900">Bahan Baku</h1>
            <p className="text-gray-600">Kelola inventori bahan baku Anda</p>
          </div>
          <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-2">
            <CompactCsvUI
              onTemplateDownload={() => window.open('/api/ingredients/template', '_blank')}
              onExportAll={() => window.open('/api/ingredients/export', '_blank')}
              onImport={() => setIsImportOpen(true)}
              onCategoryManagement={handleCategoryManagement}
              className="w-full sm:w-auto"
            />
            <Button onClick={() => setIsDialogOpen(true)} className="flex items-center gap-2 w-full sm:w-auto">
              <Plus className="h-4 w-4" />
              Tambah Bahan
            </Button>
          </div>
        </div>

        <DataTable
          data={ingredients}
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
          searchPlaceholder="Cari bahan baku..."
          emptyState={emptyState}
          selectedItems={selectedItems}
          onSelectionChange={setSelectedItems}
          filterControls={
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Filter:</span>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 flex-1">
                {/* Category Filter */}
                <Select value={selectedCategory || 'all'} onValueChange={(value) => setSelectedCategory(value === 'all' ? '' : value)}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Semua Kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Kategori</SelectItem>
                    {categories?.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: category.color }}
                          />
                          {category.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Clear Filters */}
                {selectedCategory && (
                  <button
                    onClick={() => setSelectedCategory('')}
                    className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors duration-200"
                  >
                    Hapus Filter
                  </button>
                )}
              </div>
            </div>
          }
          bulkActions={
            <BulkActions
              data={ingredients}
              selectedItems={selectedItems}
              onSelectionChange={setSelectedItems}
              onBulkDelete={handleBulkDelete}
              onBulkExport={handleBulkExport}
              onBulkCategoryChange={handleBulkCategoryChange}
              categories={categories}
              loading={loading}
            />
          }
          renderItemCard={(ingredient) => (
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div 
                    className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: ingredient.category?.color || '#6B7280' }}
                  >
                    <Package className="h-4 w-4 text-white" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-gray-900 truncate">{ingredient.name}</div>
                    {ingredient.description && (
                      <div className="text-sm text-gray-500 truncate">{ingredient.description}</div>
                    )}
                    {ingredient.sku && (
                      <div className="text-xs text-gray-600 mt-1">
                        SKU: <span className="font-mono">{ingredient.sku}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {typeof ingredient.usageCount === 'number' && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                      {ingredient.usageCount} resep
                    </span>
                  )}
                  {ingredient.category && (
                    <span 
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: ingredient.category.color }}
                    >
                      {ingredient.category.name}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-gray-500">Harga Beli</div>
                  <div className="font-medium text-gray-900">
                    {decimalSettings ? formatCurrency(ingredient.purchasePrice, decimalSettings) : `Rp ${ingredient.purchasePrice.toLocaleString('id-ID')}`}
                  </div>
                  <div className="text-gray-500 text-xs">per {ingredient.packageSize} {ingredient.purchaseUnit.symbol}</div>
                </div>
                <div>
                  <div className="text-gray-500">Biaya per Unit</div>
                  <div className="font-medium text-gray-900">
                    {decimalSettings ? formatCurrency(ingredient.costPerUnit, decimalSettings) : `Rp ${ingredient.costPerUnit.toLocaleString('id-ID')}`}
                  </div>
                  <div className="text-gray-500 text-xs">per {ingredient.usageUnit.symbol}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-gray-500">Faktor Konversi</div>
                  <div className="font-medium text-gray-900">{ingredient.conversionFactor}</div>
                  <div className="text-gray-500 text-xs">{ingredient.usageUnit.symbol} per {ingredient.purchaseUnit.symbol}</div>
                </div>
                <div>
                  <div className="text-gray-500">Dipakai di Resep</div>
                  <div className="font-medium text-gray-900">{ingredient.usageCount ?? 0}</div>
                  <div className="text-gray-500 text-xs">resep</div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(ingredient)}
                  className="flex-1"
                >
                  <Edit className="h-4 w-4 mr-2" /> Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePriceUpdate(ingredient)}
                  className="flex-1 text-green-600 hover:text-green-700"
                >
                  💰 Update Harga
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(ingredient.id)}
                  className="flex-1 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" /> Hapus
                </Button>
              </div>
            </div>
          )}
        />

        <IngredientDialog
          isOpen={isDialogOpen}
          onClose={handleDialogClose}
          ingredient={convertToDialogFormat(editingIngredient)}
          onSave={handleSave}
        />
        <IngredientImportDialog
          isOpen={isImportOpen}
          onClose={() => setIsImportOpen(false)}
          onImported={() => fetchIngredients()}
        />
        
        {updatingIngredient && (
          <PriceUpdateDialog
            ingredient={updatingIngredient}
            isOpen={isPriceUpdateOpen}
            onClose={() => {
              setIsPriceUpdateOpen(false)
              setUpdatingIngredient(null)
            }}
            onUpdate={() => {
              fetchIngredients()
              setIsPriceUpdateOpen(false)
              setUpdatingIngredient(null)
            }}
          />
        )}

        {/* Confirmation Dialog */}
        <ConfirmationDialog
          open={confirmDialog.open}
          onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}
          title={confirmDialog.title}
          description={confirmDialog.description}
          onConfirm={confirmDialog.onConfirm}
        />
      </div>
    </DashboardLayout>
  )
}
