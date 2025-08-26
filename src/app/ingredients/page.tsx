'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { DataTable, Column, PaginationInfo } from '@/components/ui/data-table'
import { Plus, Edit, Trash2, Package, Upload, Download, FileText } from 'lucide-react'
import { IngredientDialog } from '@/components/ingredients/ingredient-dialog'
import { IngredientImportDialog } from '@/components/ingredients/ingredient-import-dialog'

interface Ingredient {
  id: string
  name: string
  description?: string
  purchasePrice: number
  packageSize: number
  costPerUnit: number
  categoryId?: string
  purchaseUnitId: string
  usageUnitId: string
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

  const fetchIngredients = async () => {
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sortBy,
        sortOrder,
        ...(searchTerm && { search: searchTerm })
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

  useEffect(() => {
    if (session) {
      fetchIngredients()
    }
  }, [session, pagination.page, pagination.limit, sortBy, sortOrder, searchTerm])

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus bahan ini?')) return

    try {
      const response = await fetch(`/api/ingredients/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchIngredients()
      }
    } catch (error) {
      console.error('Error deleting ingredient:', error)
    }
  }

  const handleEdit = (ingredient: Ingredient) => {
    setEditingIngredient(ingredient)
    setIsDialogOpen(true)
  }

  // Convert page ingredient format to dialog format
  const convertToDialogFormat = (ingredient: Ingredient | null) => {
    if (!ingredient) return undefined
    return {
      id: ingredient.id,
      name: ingredient.name,
      description: ingredient.description || '',
      categoryId: ingredient.categoryId || '',
      purchasePrice: ingredient.purchasePrice,
      purchaseQuantity: ingredient.packageSize,
      purchaseUnitId: ingredient.purchaseUnitId,
      usageUnitId: ingredient.usageUnitId,
      conversionFactor: 1
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

  const handleSave = async (ingredientData: any) => {
    try {
      // Convert dialog format to API format
      const apiData = {
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
            Rp {ingredient.purchasePrice.toLocaleString('id-ID')}
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
      sortable: true,
      render: (ingredient) => (
        <div className="text-sm">
          <div className="font-medium text-gray-900">
            Rp {ingredient.costPerUnit.toLocaleString('id-ID')}
          </div>
          <div className="text-gray-500">
            per {ingredient.usageUnit.symbol}
          </div>
        </div>
      )
    },
    {
      key: 'usageCount',
      header: 'Dipakai di Resep',
      sortable: false,
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
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDelete(ingredient.id)}
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
            <Button
              variant="outline"
              onClick={() => window.open('/api/ingredients/template', '_blank')}
              className="flex items-center gap-2 w-full sm:w-auto"
            >
              <FileText className="h-4 w-4" /> Template CSV
            </Button>
            <Button
              variant="outline"
              onClick={() => window.open('/api/ingredients/export', '_blank')}
              className="flex items-center gap-2 w-full sm:w-auto"
            >
              <Download className="h-4 w-4" /> Export CSV
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsImportOpen(true)}
              className="flex items-center gap-2 w-full sm:w-auto"
            >
              <Upload className="h-4 w-4" /> Import CSV
            </Button>
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
                  <div className="font-medium text-gray-900">Rp {ingredient.purchasePrice.toLocaleString('id-ID')}</div>
                  <div className="text-gray-500 text-xs">per {ingredient.packageSize} {ingredient.purchaseUnit.symbol}</div>
                </div>
                <div>
                  <div className="text-gray-500">Biaya per Unit</div>
                  <div className="font-medium text-gray-900">Rp {ingredient.costPerUnit.toLocaleString('id-ID')}</div>
                  <div className="text-gray-500 text-xs">per {ingredient.usageUnit.symbol}</div>
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
      </div>
    </DashboardLayout>
  )
}
