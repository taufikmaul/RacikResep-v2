'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Calculator,
  Store,
  DollarSign,
  Percent,
  Target,
  Eye,
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useDecimalSettings } from '@/hooks/useDecimalSettings'
import { formatCurrency } from '@/lib/utils'

interface Recipe {
  id: string
  name: string
  sellingPrice: number
  cogsPerServing: number
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
  taxRate: number
}

interface PricePreview {
  recipeId: string
  recipeName: string
  channelId: string
  channelName: string
  currentPrice: number
  newPrice: number
  priceChange: number
  percentageChange: number
  margin: number
  marginAmount: number
}

interface ChannelBulkPriceDialogProps {
  isOpen: boolean
  onClose: () => void
  selectedRecipeIds: string[]
  onPriceUpdate: (priceData: any) => void
}

export function ChannelBulkPriceDialog({
  isOpen,
  onClose,
  selectedRecipeIds,
  onPriceUpdate
}: ChannelBulkPriceDialogProps) {
  const { settings: decimalSettings } = useDecimalSettings()
  const [loading, setLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState<'config' | 'review' | 'applying'>('config')
  const [updateMethod, setUpdateMethod] = useState<'manual' | 'markup' | 'profit'>('manual')
  const [markupPercentage, setMarkupPercentage] = useState(30)
  const [targetProfitAmount, setTargetProfitAmount] = useState(5000)
  const [roundingOption, setRoundingOption] = useState<'none' | 'hundred' | 'thousand' | 'custom'>('hundred')
  const [customRounding, setCustomRounding] = useState(100)
  const [reason, setReason] = useState('')
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [salesChannels, setSalesChannels] = useState<SalesChannel[]>([])
  const [pricePreview, setPricePreview] = useState<PricePreview[]>([])

  // Fetch data when dialog opens
  useEffect(() => {
    if (isOpen && selectedRecipeIds.length > 0) {
      fetchData()
    }
  }, [isOpen, selectedRecipeIds])

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

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch recipes from price-manager API which includes sellingPrice
      const recipesResponse = await fetch('/api/recipes/price-manager')
      const allRecipes = await recipesResponse.json()
      
      // Filter selected recipes and format them
      const selectedRecipes = allRecipes.filter((recipe: any) => 
        selectedRecipeIds.includes(recipe.id)
      )
      
      // Fetch channel prices for selected recipes
      const recipeIds = selectedRecipes.map((recipe: any) => recipe.id)
      const channelPricesMap = await fetchChannelPrices(recipeIds)
      
      // Add channel prices to recipes
      const recipesWithChannelPrices = selectedRecipes.map((recipe: any) => ({
        id: recipe.id,
        name: recipe.name,
        sellingPrice: recipe.sellingPrice || 0,
        cogsPerServing: recipe.cogsPerServing || 0,
        channelPrices: channelPricesMap[recipe.id] || {}
      }))
      
      setRecipes(recipesWithChannelPrices)

      // Fetch sales channels
      const channelsResponse = await fetch('/api/sales-channels')
      const channelsData = await channelsResponse.json()
      
      // Handle the API response structure for channels
      const allChannels = channelsData.data || channelsData
      const formattedChannels = allChannels.map((channel: any) => ({
        id: channel.id,
        name: channel.name,
        commission: channel.commission || 0,
        taxRate: channel.taxRate || 0
      }))
      setSalesChannels(formattedChannels)
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Gagal memuat data')
    } finally {
      setLoading(false)
    }
  }

  const applyRounding = (price: number) => {
    switch (roundingOption) {
      case 'hundred':
        return Math.round(price / 100) * 100
      case 'thousand':
        return Math.round(price / 1000) * 1000
      case 'custom':
        return Math.round(price / customRounding) * customRounding
      case 'none':
      default:
        return Math.round(price)
    }
  }

  const calculatePrice = (recipe: Recipe, channel: SalesChannel) => {
    let calculatedPrice = 0

    switch (updateMethod) {
      case 'markup':
        calculatedPrice = recipe.sellingPrice * (1 + markupPercentage / 100)
        break
      case 'profit':
        const commissionRate = channel.commission / 100
        calculatedPrice = (recipe.cogsPerServing + targetProfitAmount) / (1 - commissionRate)
        break
      case 'manual':
      default:
        return null // Manual input not supported in bulk
    }

    return applyRounding(calculatedPrice)
  }

  const generatePricePreview = () => {
    const preview: PricePreview[] = []

    recipes.forEach(recipe => {
      salesChannels.forEach(channel => {
        const newPrice = calculatePrice(recipe, channel)
        if (newPrice !== null) {
          // Get current price from channel prices
          const currentChannelPrice = recipe.channelPrices?.[channel.id]
          const currentPrice = currentChannelPrice?.price || 0
          const priceChange = newPrice - currentPrice
          const percentageChange = currentPrice > 0 ? (priceChange / currentPrice) * 100 : 0
          // Calculate margin after commission (net margin)
          const commissionAmount = newPrice * (channel.commission / 100)
          const netSales = newPrice - commissionAmount
          const grossProfit = netSales - recipe.cogsPerServing
          const margin = netSales > 0 ? (grossProfit / netSales) * 100 : 0
          const marginAmount = grossProfit

          preview.push({
            recipeId: recipe.id,
            recipeName: recipe.name,
            channelId: channel.id,
            channelName: channel.name,
            currentPrice,
            newPrice,
            priceChange,
            percentageChange,
            margin,
            marginAmount
          })
        }
      })
    })

    setPricePreview(preview)
  }

  const handleNextToReview = () => {
    if (selectedRecipeIds.length === 0) {
      toast.error('Tidak ada resep yang dipilih')
      return
    }

    if (!reason.trim()) {
      toast.error('Alasan perubahan harga harus diisi')
      return
    }

    generatePricePreview()
    setCurrentStep('review')
  }

  const handleBackToConfig = () => {
    setCurrentStep('config')
  }

  const handleApplyChanges = async () => {
    try {
      setCurrentStep('applying')
      
      const priceData = {
        recipeIds: selectedRecipeIds,
        updateMethod,
        markupPercentage,
        targetProfitAmount,
        roundingOption,
        customRounding,
        reason: reason.trim()
      }

      onPriceUpdate(priceData)
      toast.success(`Berhasil memperbarui harga untuk ${selectedRecipeIds.length} resep`)
      onClose()
    } catch (error) {
      console.error('Error updating prices:', error)
      toast.error('Gagal memperbarui harga')
      setCurrentStep('review')
    }
  }

  const handleClose = () => {
    if (!loading && currentStep !== 'applying') {
      // Reset state when closing
      setCurrentStep('config')
      setUpdateMethod('manual')
      setMarkupPercentage(30)
      setTargetProfitAmount(5000)
      setRoundingOption('hundred')
      setCustomRounding(100)
      setReason('')
      setRecipes([])
      setSalesChannels([])
      setPricePreview([])
      onClose()
    }
  }

  const getModalTitle = () => {
    switch (currentStep) {
      case 'config':
        return 'Bulk Channel Price Update - Configuration'
      case 'review':
        return 'Bulk Channel Price Update - Review Changes'
      case 'applying':
        return 'Bulk Channel Price Update - Applying Changes'
      default:
        return 'Bulk Channel Price Update'
    }
  }

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose} 
      title={getModalTitle()}
      size={currentStep === 'review' ? 'xl' : '2xl'}
    >
      <div className="space-y-6">
        {/* Step Indicator */}
        <div className="flex items-center justify-center space-x-4">
          <div className={`flex items-center ${currentStep === 'config' ? 'text-purple-600' : currentStep === 'review' || currentStep === 'applying' ? 'text-green-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'config' ? 'bg-purple-600 text-white' : currentStep === 'review' || currentStep === 'applying' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>
              1
            </div>
            <span className="ml-2 text-sm font-medium">Configuration</span>
          </div>
          <div className={`w-8 h-0.5 ${currentStep === 'review' || currentStep === 'applying' ? 'bg-green-600' : 'bg-gray-200'}`}></div>
          <div className={`flex items-center ${currentStep === 'review' ? 'text-purple-600' : currentStep === 'applying' ? 'text-green-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'review' ? 'bg-purple-600 text-white' : currentStep === 'applying' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>
              2
            </div>
            <span className="ml-2 text-sm font-medium">Review</span>
          </div>
          <div className={`w-8 h-0.5 ${currentStep === 'applying' ? 'bg-green-600' : 'bg-gray-200'}`}></div>
          <div className={`flex items-center ${currentStep === 'applying' ? 'text-green-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'applying' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>
              3
            </div>
            <span className="ml-2 text-sm font-medium">Apply</span>
          </div>
        </div>

        {/* Configuration Step */}
        {currentStep === 'config' && (
          <>
            {/* Selected Recipes Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="h-5 w-5" />
                  Selected Recipes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Akan memperbarui harga channel untuk <strong>{selectedRecipeIds.length} resep</strong> yang dipilih.
                </p>
              </CardContent>
            </Card>

            {/* Quick Calculation Tools */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Quick Calculation Tools
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-purple-700">Calculation Method</Label>
                    <select
                      value={updateMethod}
                      onChange={(e) => setUpdateMethod(e.target.value as any)}
                      className="w-full p-2 border border-purple-200 rounded-md bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    >
                      <option value="manual">Manual Input</option>
                      <option value="markup">Markup (%)</option>
                      <option value="profit">Target Profit (Rp)</option>
                    </select>
                  </div>

                  {updateMethod === 'markup' && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-purple-700">Markup (%)</Label>
                      <Input
                        type="number"
                        value={markupPercentage}
                        onChange={(e) => setMarkupPercentage(Number(e.target.value))}
                        min="0"
                        step="0.1"
                        className="border-purple-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                      <p className="text-xs text-gray-500">Markup dari harga jual dasar</p>
                    </div>
                  )}

                  {updateMethod === 'profit' && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-purple-700">Target Profit Amount (Rp)</Label>
                      <Input
                        type="number"
                        value={targetProfitAmount}
                        onChange={(e) => setTargetProfitAmount(Number(e.target.value))}
                        min="0"
                        step="100"
                        className="border-purple-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                      <p className="text-xs text-gray-500">Target profit amount in Rupiah</p>
                    </div>
                  )}

                  {/* Rounding Options */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-purple-700">Rounding Option</Label>
                    <select
                      value={roundingOption}
                      onChange={(e) => setRoundingOption(e.target.value as any)}
                      className="w-full p-2 border border-purple-200 rounded-md bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    >
                      <option value="none">No Rounding</option>
                      <option value="hundred">Round to Nearest 100</option>
                      <option value="thousand">Round to Nearest 1,000</option>
                      <option value="custom">Custom Rounding</option>
                    </select>
                    {roundingOption === 'custom' && (
                      <div className="mt-2">
                        <Input
                          type="number"
                          value={customRounding}
                          onChange={(e) => setCustomRounding(Number(e.target.value))}
                          min="1"
                          step="1"
                          placeholder="Rounding amount"
                          className="border-purple-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">Round to nearest multiple of this amount</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Reason */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Reason for Price Change
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Alasan Perubahan Harga</Label>
                  <Input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Masukkan alasan perubahan harga..."
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500">Alasan ini akan dicatat dalam riwayat perubahan harga</p>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleNextToReview}
                disabled={loading || !reason.trim()}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Eye className="h-4 w-4 mr-2" />
                Review Changes
              </Button>
            </div>
          </>
        )}

        {/* Review Step */}
        {currentStep === 'review' && (
          <>
            {/* Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Price Change Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{recipes.length}</div>
                    <div className="text-sm text-gray-500">Recipes</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{salesChannels.length}</div>
                    <div className="text-sm text-gray-500">Channels</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">{pricePreview.length}</div>
                    <div className="text-sm text-gray-500">Total Updates</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-600">
                      {updateMethod === 'markup' ? `${markupPercentage}%` : 
                       updateMethod === 'profit' ? `Rp ${targetProfitAmount.toLocaleString('id-ID')}` : 'Manual'}
                    </div>
                    <div className="text-sm text-gray-500">Method</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Price Preview Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Price Changes Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Recipe</th>
                        <th className="text-left p-2">Channel</th>
                        <th className="text-right p-2">Commission</th>
                        <th className="text-right p-2">Current Price</th>
                        <th className="text-right p-2">New Price</th>
                        <th className="text-right p-2">Change</th>
                        <th className="text-right p-2">Margin</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pricePreview.map((preview, index) => {
                        const channel = salesChannels.find(c => c.id === preview.channelId)
                        const commission = channel?.commission || 0
                        
                        return (
                          <tr key={index} className="border-b hover:bg-gray-50">
                            <td className="p-2 font-medium">{preview.recipeName}</td>
                            <td className="p-2">{preview.channelName}</td>
                            <td className="p-2 text-right text-orange-600 font-medium">
                              {commission.toFixed(1)}%
                            </td>
                            <td className="p-2 text-right text-gray-600">
                              {decimalSettings ? formatCurrency(preview.currentPrice, decimalSettings) : `Rp ${preview.currentPrice.toLocaleString('id-ID')}`}
                            </td>
                            <td className="p-2 text-right font-bold text-blue-600">
                              {decimalSettings ? formatCurrency(preview.newPrice, decimalSettings) : `Rp ${preview.newPrice.toLocaleString('id-ID')}`}
                            </td>
                            <td className="p-2 text-right">
                              <div className={`${preview.priceChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {preview.priceChange >= 0 ? '+' : ''}
                                {decimalSettings ? formatCurrency(preview.priceChange, decimalSettings) : `Rp ${preview.priceChange.toLocaleString('id-ID')}`}
                              </div>
                              <div className={`text-xs ${preview.percentageChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {preview.percentageChange >= 0 ? '+' : ''}{preview.percentageChange.toFixed(1)}%
                              </div>
                            </td>
                            <td className="p-2 text-right">
                              <div className={`${preview.margin >= 20 ? 'text-green-600' : preview.margin >= 10 ? 'text-yellow-600' : 'text-red-600'}`}>
                                {preview.margin.toFixed(1)}%
                              </div>
                              <div className="text-xs text-gray-500">
                                {decimalSettings ? formatCurrency(preview.marginAmount, decimalSettings) : `Rp ${preview.marginAmount.toLocaleString('id-ID')}`}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={handleBackToConfig}
                disabled={loading}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Configuration
              </Button>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleApplyChanges}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Apply Changes
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Applying Step */}
        {currentStep === 'applying' && (
          <div className="text-center py-12">
            <RefreshCw className="h-12 w-12 text-purple-600 mx-auto mb-4 animate-spin" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Applying Price Changes</h3>
            <p className="text-gray-600">
              Please wait while we update prices for {selectedRecipeIds.length} recipes across {salesChannels.length} channels...
            </p>
          </div>
        )}
      </div>
    </Modal>
  )
}
