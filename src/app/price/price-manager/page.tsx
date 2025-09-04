'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DataTable, Column, PaginationInfo } from '@/components/ui/data-table'
import { 
  Calculator, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  History,
  Save,
  RefreshCw,
  Search,
  Filter,
  FileText
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useDecimalSettings } from '@/hooks/useDecimalSettings'
import { formatCurrency } from '@/lib/utils'
import { PriceHistoryDialog } from '@/components/recipes/price-history-dialog'
import { PriceUpdateDialog } from '@/components/recipes/price-update-dialog'
import { BulkPriceDialog } from '@/components/recipes/bulk-price-dialog'
import { ImportExportDialog } from '@/components/recipes/import-export-dialog'
import { ChannelPriceDialog } from '@/components/recipes/channel-price-dialog'
import { ChannelPriceHistoryDialog } from '@/components/recipes/channel-price-history-dialog'

interface Recipe {
  id: string
  name: string
  sku?: string
  description?: string
  cogsPerServing: number
  basePrice: number
  sellingPrice: number
  profitMargin: number
  marginType: string
  category?: {
    id: string
    name: string
    color: string
  }
}

interface PriceHistory {
  id: string
  oldPrice: number
  newPrice: number
  priceChange: number
  percentageChange: number
  changeType: string
  changeDate: string
  reason?: string
  cogsPerServing: number
}

export default function RecipePriceManagerPage() {
  const { data: session } = useSession()
  const { settings: decimalSettings } = useDecimalSettings()
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  const [showPriceHistory, setShowPriceHistory] = useState(false)
  const [showPriceUpdate, setShowPriceUpdate] = useState(false)
  const [showChannelPrice, setShowChannelPrice] = useState(false)
  const [showChannelPriceHistory, setShowChannelPriceHistory] = useState(false)
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([])
  const [channelPriceHistory, setChannelPriceHistory] = useState<any[]>([])
  const [selectedChannel, setSelectedChannel] = useState<{id: string, name: string} | null>(null)
  
  // Pagination state
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 25,
    totalCount: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  })
  const [sortBy, setSortBy] = useState('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [showBulk, setShowBulk] = useState(false)
  const [showImportExport, setShowImportExport] = useState(false)

  const selectedRecipes = recipes.filter(r => selectedIds.includes(r.id))

  useEffect(() => {
    if (session?.user?.business?.id) {
      fetchRecipes()
    } else if (session === null) {
      // Session is explicitly null (not loading), set loading to false
      setLoading(false)
    }
  }, [session])

  const fetchRecipes = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/recipes/price-manager')
      if (response.ok) {
        const data = await response.json()
        const recipesData = Array.isArray(data) ? data : []
        // Ensure we only set valid recipes with required properties
        const validRecipes = recipesData.filter(recipe => 
          recipe && 
          typeof recipe === 'object' && 
          recipe.id && 
          recipe.name
        )
        setRecipes(validRecipes)
        
        // Update pagination
        updatePagination(validRecipes)
      }
    } catch (error) {
      console.error('Error fetching recipes:', error)
      toast.error('Gagal memuat data resep')
      setRecipes([])
      updatePagination([])
    } finally {
      setLoading(false)
    }
  }

  const updatePagination = (recipesData: Recipe[]) => {
    const totalCount = recipesData.length
    const totalPages = Math.ceil(totalCount / pagination.limit)
    const currentPage = Math.min(pagination.page, totalPages || 1)
    
    setPagination(prev => ({
      ...prev,
      totalCount,
      totalPages,
      page: currentPage,
      hasNext: currentPage < totalPages,
      hasPrev: currentPage > 1
    }))
  }

  const handleSearchChange = async (searchTerm: string) => {
    setSearch(searchTerm)
    setPagination(prev => ({ ...prev, page: 1 }))
    
    // Fetch recipes with search term
    try {
      setLoading(true)
      const response = await fetch(`/api/recipes/price-manager?search=${encodeURIComponent(searchTerm)}`)
      if (response.ok) {
        const data = await response.json()
        const recipesData = Array.isArray(data) ? data : []
        const validRecipes = recipesData.filter(recipe => 
          recipe && 
          typeof recipe === 'object' && 
          recipe.id && 
          recipe.name
        )
        setRecipes(validRecipes)
        updatePagination(validRecipes)
      }
    } catch (error) {
      console.error('Error searching recipes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSortChange = (newSortBy: string, newSortOrder: 'asc' | 'desc') => {
    setSortBy(newSortBy)
    setSortOrder(newSortOrder)
  }

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }))
  }

  const handleLimitChange = (limit: number) => {
    setPagination(prev => ({ 
      ...prev, 
      limit, 
      page: 1,
      totalPages: Math.ceil(prev.totalCount / limit),
      hasNext: 1 < Math.ceil(prev.totalCount / limit)
    }))
  }

  const getFilteredAndSortedRecipes = () => {
    let filtered = recipes.filter(recipe => {
      if (!recipe) return false
      const searchLower = search.toLowerCase()
      return (
        (recipe.name || '').toLowerCase().includes(searchLower) ||
        (recipe.sku || '').toLowerCase().includes(searchLower) ||
        (recipe.description || '').toLowerCase().includes(searchLower)
      )
    })

    // Sort recipes
    filtered.sort((a, b) => {
      if (!a || !b) return 0
      
      let aValue: any = a[sortBy as keyof Recipe]
      let bValue: any = b[sortBy as keyof Recipe]
      
      // Handle nested properties
      if (sortBy === 'category') {
        aValue = a.category?.name || ''
        bValue = b.category?.name || ''
      }
      
      if (aValue === undefined || aValue === null) aValue = ''
      if (bValue === undefined || bValue === null) bValue = ''
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue
      }
      
      return 0
    })

    return filtered
  }

  const getPaginatedRecipes = () => {
    const filtered = getFilteredAndSortedRecipes()
    const startIndex = (pagination.page - 1) * pagination.limit
    const endIndex = startIndex + pagination.limit
    return filtered.slice(startIndex, endIndex)
  }

  const getProfitMarginColor = (margin: number) => {
    if (margin >= 30) return 'bg-green-100 text-green-800 hover:bg-green-200'
    if (margin >= 20) return 'bg-blue-100 text-blue-800 hover:bg-blue-200'
    if (margin >= 10) return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
    return 'bg-red-100 text-red-800 hover:bg-red-200'
  }

  const getChangeTypeIcon = (changeType: string) => {
    switch (changeType) {
      case 'increase':
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'decrease':
        return <TrendingDown className="h-4 w-4 text-red-600" />
      default:
        return <TrendingUp className="h-4 w-4 text-gray-600" />
    }
  }

  const handleViewPriceHistory = async (recipe: Recipe) => {
    if (!recipe) return
    try {
      const response = await fetch(`/api/recipes/${recipe.id}/price-history`)
      if (response.ok) {
        const data = await response.json()
        setPriceHistory(data || [])
        setSelectedRecipe(recipe)
        setShowPriceHistory(true)
      } else {
        toast.error('Gagal memuat riwayat harga')
      }
    } catch (error) {
      console.error('Error fetching price history:', error)
      toast.error('Gagal memuat riwayat harga')
    }
  }

  const handleUpdatePrice = (recipe: Recipe) => {
    if (!recipe) return
    console.log('Opening price update dialog for recipe:', recipe)
    console.log('Recipe sellingPrice:', recipe.sellingPrice, 'Type:', typeof recipe.sellingPrice)
    setSelectedRecipe(recipe)
    setShowPriceUpdate(true)
  }

  const handleChannelPrice = (recipe: Recipe) => {
    if (!recipe) return
    setSelectedRecipe(recipe)
    setShowChannelPrice(true)
  }

  const handleViewChannelPriceHistory = async (recipe: Recipe, channelId: string, channelName: string) => {
    if (!recipe) return
    try {
      const response = await fetch(`/api/recipes/${recipe.id}/channel-prices/${channelId}/history`)
      if (response.ok) {
        const data = await response.json()
        setChannelPriceHistory(data || [])
        setSelectedChannel({ id: channelId, name: channelName })
        setSelectedRecipe(recipe)
        setShowChannelPriceHistory(true)
      } else {
        toast.error('Gagal memuat riwayat harga channel')
      }
    } catch (error) {
      console.error('Error fetching channel price history:', error)
      toast.error('Gagal memuat riwayat harga channel')
    }
  }

  const handlePriceUpdated = () => {
    setShowPriceUpdate(false)
    fetchRecipes()
    toast.success('Harga berhasil diperbarui')
  }

  const handleChannelPricesUpdated = () => {
    setShowChannelPrice(false)
    fetchRecipes()
    toast.success('Harga channel berhasil diperbarui')
  }

  // Update pagination when recipes or search changes
  useEffect(() => {
    const filtered = getFilteredAndSortedRecipes()
    updatePagination(filtered)
  }, [recipes, search, sortBy, sortOrder])

  // Define table columns
  const columns: Column<Recipe>[] = [
    {
      key: 'name',
      header: 'Nama Resep',
      sortable: true,
      render: (recipe) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-900">{recipe.name || 'Unnamed Recipe'}</span>
          {recipe.sku && recipe.sku.trim() && (
            <span className="text-sm text-gray-500">SKU: {recipe.sku}</span>
          )}
          {recipe.description && recipe.description.trim() && (
            <span className="text-sm text-gray-600 truncate max-w-xs">{recipe.description}</span>
          )}
        </div>
      ),
      className: 'min-w-[200px]'
    },
    {
      key: 'category',
      header: 'Kategori',
      sortable: true,
      render: (recipe) => (
        recipe.category?.color && recipe.category?.name ? (
          <Badge 
            variant="secondary" 
            style={{ backgroundColor: recipe.category.color + '20', color: recipe.category.color }}
          >
            {recipe.category.name}
          </Badge>
        ) : (
          <span className="text-gray-400">-</span>
        )
      )
    },
    {
      key: 'cogsPerServing',
      header: 'HPP per Unit',
      sortable: true,
      render: (recipe) => (
        <span className="font-medium text-gray-900">
          {recipe.cogsPerServing ? (decimalSettings ? formatCurrency(recipe.cogsPerServing, decimalSettings) : `Rp ${recipe.cogsPerServing.toLocaleString('id-ID')}`) : 'Rp 0'}
        </span>
      ),
      className: 'text-center'
    },
    {
      key: 'sellingPrice',
      header: 'Harga Jual',
      sortable: true,
      render: (recipe) => (
        <span className="font-medium text-blue-600">
          {recipe.sellingPrice ? (decimalSettings ? formatCurrency(recipe.sellingPrice, decimalSettings) : `Rp ${recipe.sellingPrice.toLocaleString('id-ID')}`) : 'Rp 0'}
        </span>
      ),
      className: 'text-center'
    },
    {
      key: 'profitMargin',
      header: 'Margin Profit',
      sortable: true,
      render: (recipe) => (
        <Badge className={getProfitMarginColor(recipe.profitMargin || 0)}>
          {recipe.profitMargin ? recipe.profitMargin.toFixed(1) : '0.0'}%
        </Badge>
      ),
      className: 'text-center'
    },
    {
      key: 'actions',
      header: 'Aksi',
      render: (recipe) => (
        <div className="flex flex-col gap-2">
          <Button
            onClick={() => handleUpdatePrice(recipe)}
            size="sm"
            className="w-full"
            disabled={!recipe}
          >
            <DollarSign className="h-4 w-4 mr-2" />
            Update Price
          </Button>
          <Button
            onClick={() => handleChannelPrice(recipe)}
            size="sm"
            className="w-full"
            disabled={!recipe}
          >
            <DollarSign className="h-4 w-4 mr-2" />
            Channel Prices
          </Button>
          <Button
            onClick={() => handleViewPriceHistory(recipe)}
            variant="outline"
            size="sm"
            className="w-full"
            disabled={!recipe}
          >
            <History className="h-4 w-4 mr-2" />
            Price History
          </Button>
        </div>
      ),
      className: 'w-32'
    }
  ]

  // Render mobile card view
  const renderRecipeCard = (recipe: Recipe) => (
    <div className="space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{recipe.name || 'Unnamed Recipe'}</h3>
          {recipe.sku && recipe.sku.trim() && (
            <p className="text-sm text-gray-500">SKU: {recipe.sku}</p>
          )}
          {recipe.description && recipe.description.trim() && (
            <p className="text-sm text-gray-600 mt-1">{recipe.description}</p>
          )}
          {recipe.category?.color && recipe.category?.name && (
            <Badge 
              variant="secondary" 
              style={{ backgroundColor: recipe.category.color + '20', color: recipe.category.color }}
              className="mt-2"
            >
              {recipe.category.name}
            </Badge>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-3 text-center">
        <div>
          <p className="text-xs text-gray-500 mb-1">HPP per Unit</p>
          <p className="text-sm font-semibold text-gray-900">
            {recipe.cogsPerServing ? (decimalSettings ? formatCurrency(recipe.cogsPerServing, decimalSettings) : `Rp ${recipe.cogsPerServing.toLocaleString('id-ID')}`) : 'Rp 0'}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Harga Jual</p>
          <p className="text-sm font-semibold text-blue-600">
            {recipe.sellingPrice ? (decimalSettings ? formatCurrency(recipe.sellingPrice, decimalSettings) : `Rp ${recipe.sellingPrice.toLocaleString('id-ID')}`) : 'Rp 0'}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Margin Profit</p>
          <Badge className={`text-xs ${getProfitMarginColor(recipe.profitMargin || 0)}`}>
            {recipe.profitMargin ? recipe.profitMargin.toFixed(1) : '0.0'}%
          </Badge>
        </div>
      </div>
      
      <div className="flex gap-2">
        <Button
          onClick={() => handleUpdatePrice(recipe)}
          size="sm"
          className="flex-1"
          disabled={!recipe}
        >
          <DollarSign className="h-4 w-4 mr-2" />
          Update Price
        </Button>
        <Button
          onClick={() => handleChannelPrice(recipe)}
          size="sm"
          className="flex-1"
          disabled={!recipe}
        >
          <DollarSign className="h-4 w-4 mr-2" />
          Channel Prices
        </Button>
        <Button
          onClick={() => handleViewPriceHistory(recipe)}
          variant="outline"
          size="sm"
          className="flex-1"
          disabled={!recipe}
        >
          <History className="h-4 w-4 mr-2" />
          Price History
        </Button>
      </div>
    </div>
  )

  const bulkActions = (
    <div className="flex items-center justify-between p-3 border-b">
      <div className="text-sm text-gray-600">
        {selectedIds.length} dipilih
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => setSelectedIds([])}>Bersihkan</Button>
        <Button size="sm" onClick={() => setShowBulk(true)} disabled={selectedIds.length === 0}>Ubah harga massal</Button>
      </div>
    </div>
  )

  if (loading && (!Array.isArray(recipes) || recipes.length === 0)) {
    return (
      <DashboardLayout>
        <div className="container mx-auto p-4 space-y-6">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2 text-blue-600">
              <Calculator className="h-6 w-6" />
              <h1 className="text-3xl font-bold">Recipe Price Manager</h1>
            </div>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Kelola harga jual resep dengan mudah dan pantau riwayat perubahan harga
            </p>
          </div>
          <Card>
            <CardContent className="p-8 text-center">
              <div className="animate-pulse space-y-4">
                <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto"></div>
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-20 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2 text-blue-600">
            <Calculator className="h-6 w-6" />
            <h1 className="text-3xl font-bold">Recipe Price Manager</h1>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Kelola harga jual resep dengan mudah dan pantau riwayat perubahan harga
          </p>
          
          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-3">
            <Button
              onClick={() => setShowImportExport(true)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Import/Export CSV
            </Button>
            <Button
              onClick={fetchRecipes}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh Data
            </Button>
          </div>
        </div>

        {/* DataTable with table view for desktop and card view for mobile */}
        <DataTable
          data={getPaginatedRecipes()}
          columns={columns}
          pagination={pagination}
          loading={loading}
          searchTerm={search}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSearchChange={handleSearchChange}
          onSortChange={handleSortChange}
          onPageChange={handlePageChange}
          onLimitChange={handleLimitChange}
          searchPlaceholder="🔍 Cari resep berdasarkan nama, SKU, atau deskripsi..."
          renderItemCard={renderRecipeCard}
          emptyState={
            <div className="text-center py-8">
              <Calculator className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">
                {search ? 'Tidak ada resep yang cocok dengan pencarian' : 'Belum ada resep tersedia'}
              </p>
              {!search && (
                <Button onClick={fetchRecipes} className="mt-4">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Data
                </Button>
              )}
            </div>
          }
          bulkActions={bulkActions}
          selectedItems={selectedIds}
          onSelectionChange={setSelectedIds}
        />

        {/* Bulk dialog */}
        <BulkPriceDialog
          isOpen={showBulk}
          onClose={() => setShowBulk(false)}
          selectedIds={selectedIds}
          selectedRecipes={selectedRecipes as any}
          onUpdated={(count) => {
            setShowBulk(false)
            setSelectedIds([])
            fetchRecipes()
            toast.success(`${count} harga resep diperbarui`)
          }}
        />

        {/* Price History Dialog */}
        {selectedRecipe && (
          <PriceHistoryDialog
            isOpen={showPriceHistory}
            onClose={() => setShowPriceHistory(false)}
            recipe={selectedRecipe}
            priceHistory={priceHistory}
          />
        )}

        {/* Price Update Dialog */}
        {selectedRecipe && (
          <PriceUpdateDialog
            isOpen={showPriceUpdate}
            onClose={() => setShowPriceUpdate(false)}
            recipe={selectedRecipe}
            onPriceUpdated={handlePriceUpdated}
          />
        )}

        {/* Channel Price Dialog */}
        {selectedRecipe && (
          <ChannelPriceDialog
            isOpen={showChannelPrice}
            onClose={() => setShowChannelPrice(false)}
            recipe={selectedRecipe}
            onPricesUpdated={handleChannelPricesUpdated}
          />
        )}

        {/* Channel Price History Dialog */}
        {selectedRecipe && selectedChannel && (
          <ChannelPriceHistoryDialog
            isOpen={showChannelPriceHistory}
            onClose={() => setShowChannelPriceHistory(false)}
            recipeName={selectedRecipe.name}
            channelName={selectedChannel.name}
            priceHistory={channelPriceHistory}
          />
        )}

        {/* Import/Export Dialog */}
        <ImportExportDialog
          isOpen={showImportExport}
          onClose={() => setShowImportExport(false)}
          onImportComplete={() => {
            fetchRecipes()
            setShowImportExport(false)
          }}
        />
      </div>
    </DashboardLayout>
  )
}
