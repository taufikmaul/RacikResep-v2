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
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  History,
  Save,
  RefreshCw,
  Search,
  Filter,
  FileText,
  Store,
  Calculator,
  MoreHorizontal,
  Edit,
  Eye
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useDecimalSettings } from '@/hooks/useDecimalSettings'
import { formatCurrency } from '@/lib/utils'
import { ChannelPriceDialog } from '@/components/recipes/channel-price-dialog'
import { ChannelPriceHistoryDialog } from '@/components/recipes/channel-price-history-dialog'
import { ChannelBulkActions } from '@/components/recipes/channel-bulk-actions'
import { SalesChannelPriceHistoryDialog } from '@/components/recipes/sales-channel-price-history-dialog'
import { SALES_CHANNEL_ICONS } from '@/components/ui/sales-channel-icon-selector'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card'

interface Recipe {
  id: string
  name: string
  sku?: string
  description?: string
  cogsPerServing: number
  sellingPrice: number
  category?: {
    id: string
    name: string
    color: string
  }
  channelPrices?: {
    [channelId: string]: {
      price: number
      finalPrice: number
      channelName: string
    }
  }
}

interface SalesChannel {
  id: string
  name: string
  commission: number
  icon: string
}

interface ChannelPrice {
  channelId: string
  channelName: string
  channelCommission: number
  price: number
  finalPrice: number
  commission: number
  taxRate: number
  channelPriceId: string | null
}

export default function ChannelPriceManagerPage() {
  const { data: session } = useSession()
  const { settings: decimalSettings } = useDecimalSettings()
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [salesChannels, setSalesChannels] = useState<SalesChannel[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  const [showChannelPrice, setShowChannelPrice] = useState(false)
  const [showChannelPriceHistory, setShowChannelPriceHistory] = useState(false)
  const [channelPriceHistory, setChannelPriceHistory] = useState<any[]>([])
  const [selectedChannel, setSelectedChannel] = useState<{id: string, name: string} | null>(null)
  const [showSalesChannelPriceHistory, setShowSalesChannelPriceHistory] = useState(false)
  
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

  const selectedRecipes = recipes.filter(r => selectedIds.includes(r.id))

  // Helper function to get sales channel icon
  const getSalesChannelIcon = (channelId: string) => {
    const channel = salesChannels.find(c => c.id === channelId)
    if (!channel) return null
    
    const iconData = SALES_CHANNEL_ICONS.find(icon => icon.id === channel.icon)
    return iconData || SALES_CHANNEL_ICONS.find(icon => icon.id === 'other')
  }

  useEffect(() => {
    if (session?.user?.business?.id) {
      fetchData()
    } else if (session === null) {
      setLoading(false)
    }
  }, [session])

  const fetchData = async () => {
    try {
      setLoading(true)
      await Promise.all([
        fetchRecipes(),
        fetchSalesChannels()
      ])
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Gagal memuat data')
    } finally {
      setLoading(false)
    }
  }

  const fetchRecipes = async () => {
    try {
      const response = await fetch('/api/recipes/price-manager')
      if (response.ok) {
        const data = await response.json()
        const recipesData = Array.isArray(data) ? data : []
        const validRecipes = recipesData.filter(recipe => 
          recipe && 
          typeof recipe === 'object' && 
          recipe.id && 
          recipe.name
        )
        
        // Fetch channel prices for all recipes
        const recipeIds = validRecipes.map(recipe => recipe.id)
        const channelPricesMap = await fetchChannelPrices(recipeIds)
        
        // Add channel prices to recipes
        const recipesWithChannelPrices = validRecipes.map(recipe => ({
          ...recipe,
          channelPrices: channelPricesMap[recipe.id] || {}
        }))
        
        setRecipes(recipesWithChannelPrices)
        updatePagination(recipesWithChannelPrices)
      }
    } catch (error) {
      console.error('Error fetching recipes:', error)
      toast.error('Gagal memuat data resep')
      setRecipes([])
      updatePagination([])
    }
  }

  const fetchSalesChannels = async () => {
    try {
      const response = await fetch('/api/sales-channels')
      if (response.ok) {
        const data = await response.json()
        setSalesChannels(data || [])
      }
    } catch (error) {
      console.error('Error fetching sales channels:', error)
      toast.error('Gagal memuat data saluran penjualan')
      setSalesChannels([])
    }
  }

  const fetchChannelPrices = async (recipeIds: string[]) => {
    try {
      if (recipeIds.length === 0) return {}
      
      const channelPricesMap: { [recipeId: string]: { [channelId: string]: { price: number, finalPrice: number, channelName: string } } } = {}
      
      // Fetch channel prices for each recipe
      await Promise.all(recipeIds.map(async (recipeId) => {
        try {
          const response = await fetch(`/api/recipes/${recipeId}/channel-prices`)
          if (response.ok) {
            const channelPrices = await response.json()
            channelPricesMap[recipeId] = {}
            
            channelPrices.forEach((cp: any) => {
              channelPricesMap[recipeId][cp.channelId] = {
                price: cp.price,
                finalPrice: cp.finalPrice,
                channelName: cp.channelName
              }
            })
          }
        } catch (error) {
          console.error(`Error fetching channel prices for recipe ${recipeId}:`, error)
        }
      }))
      
      return channelPricesMap
    } catch (error) {
      console.error('Error fetching channel prices:', error)
      return {}
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
        
        // Fetch channel prices for search results
        const recipeIds = validRecipes.map(recipe => recipe.id)
        const channelPricesMap = await fetchChannelPrices(recipeIds)
        
        // Add channel prices to recipes
        const recipesWithChannelPrices = validRecipes.map(recipe => ({
          ...recipe,
          channelPrices: channelPricesMap[recipe.id] || {}
        }))
        
        setRecipes(recipesWithChannelPrices)
        updatePagination(recipesWithChannelPrices)
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

  const handleChannelPricesUpdated = () => {
    setShowChannelPrice(false)
    fetchRecipes()
    toast.success('Harga channel berhasil diperbarui')
  }

  const handleSalesChannelPriceHistory = (recipe: Recipe) => {
    if (!recipe) return
    setSelectedRecipe(recipe)
    setShowSalesChannelPriceHistory(true)
  }

  const handleBulkDelete = async (ids: string[]) => {
    try {
      const response = await fetch('/api/recipes/bulk-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ recipeIds: ids })
      })

      if (response.ok) {
        setSelectedIds([])
        fetchRecipes()
        toast.success(`Berhasil menghapus ${ids.length} resep`)
      } else {
        toast.error('Gagal menghapus resep')
      }
    } catch (error) {
      console.error('Error deleting recipes:', error)
      toast.error('Gagal menghapus resep')
    }
  }

  const handleBulkExport = async (ids: string[]) => {
    try {
      const response = await fetch('/api/recipes/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ recipeIds: ids })
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `recipes-export-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast.success(`Berhasil mengekspor ${ids.length} resep`)
      } else {
        toast.error('Gagal mengekspor resep')
      }
    } catch (error) {
      console.error('Error exporting recipes:', error)
      toast.error('Gagal mengekspor resep')
    }
  }

  const handleBulkPriceUpdate = async (ids: string[], priceData: any) => {
    try {
      const response = await fetch('/api/recipes/bulk-channel-price', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          recipeIds: ids,
          ...priceData
        })
      })

      if (response.ok) {
        setSelectedIds([])
        fetchRecipes()
        toast.success(`Berhasil memperbarui harga channel untuk ${ids.length} resep`)
      } else {
        toast.error('Gagal memperbarui harga channel')
      }
    } catch (error) {
      console.error('Error updating channel prices:', error)
      toast.error('Gagal memperbarui harga channel')
    }
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
      key: 'pricing',
      header: 'Pricing Overview',
      render: (recipe) => (
        <div className="space-y-2">
          {/* Base Price */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Base:</span>
            <span className="text-sm font-semibold text-blue-600">
              {recipe.sellingPrice ? (decimalSettings ? formatCurrency(recipe.sellingPrice, decimalSettings) : `Rp ${recipe.sellingPrice.toLocaleString('id-ID')}`) : 'Rp 0'}
            </span>
          </div>
          
          {/* Channel Status Icons */}
          <div className="flex items-center gap-1">
            {salesChannels.map(channel => {
              const channelPrice = recipe.channelPrices?.[channel.id]
              const iconData = getSalesChannelIcon(channel.id)
              return (
                <HoverCard key={channel.id}>
                  <HoverCardTrigger asChild>
                    <div 
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs cursor-pointer transition-all duration-200 ${
                        channelPrice ? 'opacity-100 hover:scale-110' : 'opacity-30'
                      }`}
                      style={{ backgroundColor: iconData?.color || '#6B7280' }}
                    >
                      {iconData?.icon || '🏢'}
                    </div>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-80">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm"
                          style={{ backgroundColor: iconData?.color || '#6B7280' }}
                        >
                          {iconData?.icon || '🏢'}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{channel.name}</h4>
                          <p className="text-sm text-gray-500">
                            Commission: {channel.commission || 0}%
                          </p>
                        </div>
                      </div>
                      
                      {channelPrice ? (
                        <div className="space-y-2">
                          <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                            <span className="text-sm font-medium text-gray-700">Final Price:</span>
                            <span className="text-sm font-semibold text-blue-600">
                              {decimalSettings ? formatCurrency(channelPrice.price, decimalSettings) : `Rp ${channelPrice.price.toLocaleString('id-ID')}`}
                            </span>
                          </div>
                          <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                            <span className="text-sm font-medium text-gray-700">Commission:</span>
                            <span className="text-sm font-semibold text-gray-600">
                              {decimalSettings ? formatCurrency(channelPrice.price * channel.commission / 100, decimalSettings) : `Rp ${(channelPrice.price * channel.commission / 100).toLocaleString('id-ID')}`}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 bg-gray-50 rounded text-center">
                          <p className="text-sm text-gray-500">No price set for this channel</p>
                          <p className="text-xs text-gray-400 mt-1">Click &quot;Manage Prices&quot; to set pricing</p>
                        </div>
                      )}
                    </div>
                  </HoverCardContent>
                </HoverCard>
              )
            })}
          </div>
        </div>
      ),
      className: 'min-w-[150px]'
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (recipe) => (
        <div className="flex gap-2">
          <Button
            onClick={() => handleChannelPrice(recipe)}
            size="sm"
            className="flex-1"
            disabled={!recipe}
          >
            <Store className="h-4 w-4 mr-2" />
            Manage Prices
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={!recipe}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => handleSalesChannelPriceHistory(recipe)}>
                <History className="h-4 w-4 mr-2" />
                View All History
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {salesChannels.map(channel => {
                const iconData = getSalesChannelIcon(channel.id)
                return (
                  <DropdownMenuItem 
                    key={channel.id}
                    onClick={() => handleViewChannelPriceHistory(recipe, channel.id, channel.name)}
                  >
                    <div className="flex items-center gap-2">
                      {iconData && (
                        <div 
                          className="w-4 h-4 rounded-full flex items-center justify-center text-white text-xs"
                          style={{ backgroundColor: iconData.color }}
                        >
                          {iconData.icon}
                        </div>
                      )}
                      <span className="truncate">{channel.name} History</span>
                    </div>
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuContent>
          </DropdownMenu>
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
      
      <div className="space-y-3">
        {/* Base Price */}
        <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
          <span className="text-sm font-medium text-gray-700">Base Price:</span>
          <span className="text-lg font-bold text-blue-600">
            {recipe.sellingPrice ? (decimalSettings ? formatCurrency(recipe.sellingPrice, decimalSettings) : `Rp ${recipe.sellingPrice.toLocaleString('id-ID')}`) : 'Rp 0'}
          </span>
        </div>
        
        {/* Channel Status */}
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Channel Status:</span>
            <span className="text-xs text-gray-500">
              {salesChannels.filter(channel => recipe.channelPrices?.[channel.id]).length} of {salesChannels.length} set
            </span>
          </div>
          <div className="flex items-center gap-2">
            {salesChannels.map(channel => {
              const channelPrice = recipe.channelPrices?.[channel.id]
              const iconData = getSalesChannelIcon(channel.id)
              return (
                <HoverCard key={channel.id}>
                  <HoverCardTrigger asChild>
                    <div 
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm cursor-pointer transition-all duration-200 ${
                        channelPrice ? 'opacity-100 hover:scale-110' : 'opacity-30'
                      }`}
                      style={{ backgroundColor: iconData?.color || '#6B7280' }}
                    >
                      {iconData?.icon || '🏢'}
                    </div>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-80">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm"
                          style={{ backgroundColor: iconData?.color || '#6B7280' }}
                        >
                          {iconData?.icon || '🏢'}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{channel.name}</h4>
                          <p className="text-sm text-gray-500">
                            Commission: {channel.commission || 0}%
                          </p>
                        </div>
                      </div>
                      
                      {channelPrice ? (
                        <div className="space-y-2">
                          <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                            <span className="text-sm font-medium text-gray-700">Base Price:</span>
                            <span className="text-sm font-semibold text-green-600">
                              {decimalSettings ? formatCurrency(channelPrice.price, decimalSettings) : `Rp ${channelPrice.price.toLocaleString('id-ID')}`}
                            </span>
                          </div>
                          <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                            <span className="text-sm font-medium text-gray-700">Final Price:</span>
                            <span className="text-sm font-semibold text-blue-600">
                              {(() => {
                                // Calculate final price dynamically: base price + tax
                                const taxRate = 11 // Default 11% tax rate
                                const finalPrice = Math.round(channelPrice.price * (1 + taxRate / 100))
                                return decimalSettings ? formatCurrency(finalPrice, decimalSettings) : `Rp ${finalPrice.toLocaleString('id-ID')}`
                              })()}
                            </span>
                          </div>
                          <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                            <span className="text-sm font-medium text-gray-700">Commission:</span>
                            <span className="text-sm font-semibold text-gray-600">
                              {channel.commission || 0}%
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 bg-gray-50 rounded text-center">
                          <p className="text-sm text-gray-500">No price set for this channel</p>
                          <p className="text-xs text-gray-400 mt-1">Click &quot;Manage Prices&quot; to set pricing</p>
                        </div>
                      )}
                    </div>
                  </HoverCardContent>
                </HoverCard>
              )
            })}
          </div>
        </div>
      </div>
      
      <div className="flex gap-2">
        <Button
          onClick={() => handleChannelPrice(recipe)}
          size="sm"
          className="flex-1"
          disabled={!recipe}
        >
          <Store className="h-4 w-4 mr-2" />
          Manage Prices
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" disabled={!recipe}>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => handleSalesChannelPriceHistory(recipe)}>
              <History className="h-4 w-4 mr-2" />
              View All History
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {salesChannels.map(channel => {
              const iconData = getSalesChannelIcon(channel.id)
              return (
                <DropdownMenuItem 
                  key={channel.id}
                  onClick={() => handleViewChannelPriceHistory(recipe, channel.id, channel.name)}
                >
                  <div className="flex items-center gap-2">
                    {iconData && (
                      <div 
                        className="w-4 h-4 rounded-full flex items-center justify-center text-white text-xs"
                        style={{ backgroundColor: iconData.color }}
                      >
                        {iconData.icon}
                      </div>
                    )}
                    <span className="truncate">{channel.name} History</span>
                  </div>
                </DropdownMenuItem>
              )
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )

  if (loading && (!Array.isArray(recipes) || recipes.length === 0)) {
    return (
      <DashboardLayout>
        <div className="container mx-auto p-4 space-y-6">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2 text-blue-600">
              <Store className="h-6 w-6" />
              <h1 className="text-3xl font-bold">Channel Price Manager</h1>
            </div>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Kelola harga jual per saluran penjualan untuk setiap resep
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
            <Store className="h-6 w-6" />
            <h1 className="text-3xl font-bold">Channel Price Manager</h1>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Kelola harga jual per saluran penjualan untuk setiap resep
          </p>
          
          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-3">
            <Button
              onClick={fetchData}
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
          selectedItems={selectedIds}
          onSelectionChange={setSelectedIds}
          bulkActions={
            <ChannelBulkActions
              data={getPaginatedRecipes()}
              selectedItems={selectedIds}
              onSelectionChange={setSelectedIds}
              onBulkDelete={handleBulkDelete}
              onBulkExport={handleBulkExport}
              onBulkPriceUpdate={handleBulkPriceUpdate}
              loading={loading}
            />
          }
          emptyState={
            <div className="text-center py-8">
              <Store className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">
                {search ? 'Tidak ada resep yang cocok dengan pencarian' : 'Belum ada resep tersedia'}
              </p>
              {!search && (
                <Button onClick={fetchData} className="mt-4">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Data
                </Button>
              )}
            </div>
          }
        />

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

        {/* Sales Channel Price History Dialog */}
        {selectedRecipe && (
          <SalesChannelPriceHistoryDialog
            isOpen={showSalesChannelPriceHistory}
            onClose={() => setShowSalesChannelPriceHistory(false)}
            recipeName={selectedRecipe.name}
            recipeId={selectedRecipe.id}
          />
        )}
      </div>
    </DashboardLayout>
  )
}
