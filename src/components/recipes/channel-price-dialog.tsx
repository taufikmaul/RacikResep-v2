'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import { Textarea } from '@/components/ui/textarea'
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Save, 
  X,
  Calculator,
  Info,
  Percent,
  Minus,
  Plus,
  Target,
  Zap,
  AlertCircle
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useDecimalSettings } from '@/hooks/useDecimalSettings'
import { formatCurrency } from '@/lib/utils'
import { SALES_CHANNEL_ICONS } from '@/components/ui/sales-channel-icon-selector'

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

interface Recipe {
  id: string
  name: string
  sellingPrice: number
  cogsPerServing: number
}

interface ChannelPriceDialogProps {
  isOpen: boolean
  onClose: () => void
  recipe: Recipe
  onPricesUpdated: () => void
}

export function ChannelPriceDialog({
  isOpen,
  onClose,
  recipe,
  onPricesUpdated
}: ChannelPriceDialogProps) {
  const { settings: decimalSettings } = useDecimalSettings()
  const [loading, setLoading] = useState(false)
  const [channelPrices, setChannelPrices] = useState<ChannelPrice[]>([])
  const [reason, setReason] = useState('')
  const [updateMethod, setUpdateMethod] = useState<'manual' | 'markup' | 'profit'>('manual')
  const [markupPercentage, setMarkupPercentage] = useState(30)
  const [targetProfitAmount, setTargetProfitAmount] = useState(5000)
  const [roundingOption, setRoundingOption] = useState<'none' | 'hundred' | 'thousand' | 'custom'>('hundred')
  const [customRounding, setCustomRounding] = useState(100)

  // Helper function to get sales channel icon
  const getSalesChannelIcon = (channelId: string) => {
    const iconData = SALES_CHANNEL_ICONS.find(icon => icon.id === channelId)
    return iconData || SALES_CHANNEL_ICONS.find(icon => icon.id === 'other')
  }

  useEffect(() => {
    if (isOpen && recipe) {
      fetchChannelPrices()
    }
  }, [isOpen, recipe])

  const fetchChannelPrices = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/recipes/${recipe.id}/channel-prices`)
      if (response.ok) {
        const data = await response.json()
        setChannelPrices(data)
      } else {
        toast.error('Gagal memuat data harga channel')
      }
    } catch (error) {
      console.error('Error fetching channel prices:', error)
      toast.error('Gagal memuat data harga channel')
    } finally {
      setLoading(false)
    }
  }

  const handlePriceChange = (channelId: string, field: keyof ChannelPrice, value: any) => {
    setChannelPrices(prev => 
      prev.map(cp => 
        cp.channelId === channelId 
          ? { ...cp, [field]: value }
          : cp
      )
    )
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

  const calculatePriceByMarkup = () => {
    if (!recipe?.sellingPrice) return
    const markup = markupPercentage / 100
    const calculatedPrice = recipe.sellingPrice * (1 + markup)
    const roundedPrice = applyRounding(calculatedPrice)
    
    setChannelPrices(prev => 
      prev.map(cp => ({
        ...cp,
        price: roundedPrice,
        finalPrice: Math.round(roundedPrice * (1 + (cp.taxRate / 100)))
      }))
    )
  }

  const calculatePriceByProfit = () => {
    if (!recipe?.cogsPerServing) return
    
    setChannelPrices(prev => 
      prev.map(cp => {
        // Formula: (COGS + Target Profit) / (1 - Commission)
        const commissionRate = cp.commission / 100
        const calculatedPrice = (recipe.cogsPerServing + targetProfitAmount) / (1 - commissionRate)
        const roundedPrice = applyRounding(calculatedPrice)
        
        return {
          ...cp,
          price: roundedPrice,
          finalPrice: Math.round(roundedPrice * (1 + (cp.taxRate / 100)))
        }
      })
    )
  }

  const handleSubmit = async () => {
    if (channelPrices.length === 0) {
      toast.error('Tidak ada channel yang tersedia')
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`/api/recipes/${recipe.id}/channel-prices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channelPrices: channelPrices.map(cp => ({
            channelId: cp.channelId,
            price: cp.price,
            commission: cp.commission,
            taxRate: cp.taxRate,
            reason
          }))
        })
      })

      if (response.ok) {
        toast.success('Harga channel berhasil diperbarui')
        onPricesUpdated()
        onClose()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Gagal memperbarui harga channel')
      }
    } catch (error) {
      console.error('Error updating channel prices:', error)
      toast.error('Gagal memperbarui harga channel')
    } finally {
      setLoading(false)
    }
  }

  const getProfitMarginColor = (margin: number) => {
    if (margin >= 30) return 'bg-green-100 text-green-800 border-green-200'
    if (margin >= 20) return 'bg-blue-100 text-blue-800 border-blue-200'
    if (margin >= 10) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    return 'bg-red-100 text-red-800 border-red-200'
  }

  const getProfitMarginIcon = (margin: number) => {
    if (margin >= 30) return <TrendingUp className="h-4 w-4" />
    if (margin >= 20) return <Target className="h-4 w-4" />
    if (margin >= 10) return <AlertCircle className="h-4 w-4" />
    return <TrendingDown className="h-4 w-4" />
  }

  const calculateProfitMargin = (price: number) => {
    if (!recipe?.cogsPerServing || price <= 0) return 0
    return ((price - recipe.cogsPerServing) / price) * 100
  }

  const calculatePricingBreakdown = (channelPrice: ChannelPrice) => {
    const basePrice = channelPrice.price
    const taxAmount = basePrice * (channelPrice.taxRate / 100)
    const priceWithTax = basePrice + taxAmount
    const commissionAmount = priceWithTax * (channelPrice.commission / 100)
    const netSales = priceWithTax - commissionAmount
    const grossProfit = netSales - recipe.cogsPerServing
    const netMargin = (grossProfit / netSales) * 100

    return {
      basePrice,
      taxAmount,
      priceWithTax,
      commissionAmount,
      netSales,
      grossProfit,
      netMargin
    }
  }

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={`Channel Price Management - ${recipe?.name}`}
      size="2xl"
    >
      <div className="space-y-6">
        {/* Recipe Summary Card */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-blue-800">
              <Info className="h-5 w-5" />
              Recipe Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-3 bg-white rounded-lg border border-blue-200">
                <p className="text-sm text-gray-600 mb-1">COGS per Unit</p>
                <p className="text-lg font-bold text-gray-800">
                  {recipe?.cogsPerServing ? (decimalSettings ? formatCurrency(recipe.cogsPerServing, decimalSettings) : `Rp ${recipe.cogsPerServing.toLocaleString('id-ID')}`) : 'Rp 0'}
                </p>
              </div>
              <div className="text-center p-3 bg-white rounded-lg border border-blue-200">
                <p className="text-sm text-gray-600 mb-1">Base Selling Price</p>
                <p className="text-lg font-bold text-blue-600">
                  {recipe?.sellingPrice ? (decimalSettings ? formatCurrency(recipe.sellingPrice, decimalSettings) : `Rp ${recipe.sellingPrice.toLocaleString('id-ID')}`) : 'Rp 0'}
                </p>
              </div>
              <div className="text-center p-3 bg-white rounded-lg border border-blue-200">
                <p className="text-sm text-gray-600 mb-1">Base Profit Margin</p>
                <p className="text-lg font-bold text-green-600">
                  {recipe?.sellingPrice && recipe?.cogsPerServing ? 
                    ((recipe.sellingPrice - recipe.cogsPerServing) / recipe.sellingPrice * 100).toFixed(1) : '0.0'}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Calculation Tools */}
        <Card className="border-2 border-purple-100 bg-gradient-to-r from-purple-50 to-pink-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-purple-800">
              <Zap className="h-5 w-5" />
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

              <div className="flex items-end">
                <Button
                  onClick={updateMethod === 'markup' ? calculatePriceByMarkup : calculatePriceByProfit}
                  disabled={updateMethod === 'manual'}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Calculator className="h-4 w-4 mr-2" />
                  Calculate Prices
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Channel Prices */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Channel-Specific Pricing
            </h3>
            <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              {channelPrices.length} channels configured
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-48 bg-gray-200 rounded-lg animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {channelPrices.map((channelPrice) => {
                const profitMargin = calculateProfitMargin(channelPrice.price)
                const pricing = calculatePricingBreakdown(channelPrice)
                
                return (
                  <Card key={channelPrice.channelId} className="border-2 hover:border-blue-300 transition-all duration-200">
                    <CardContent className="p-6">
                      {/* Channel Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          {(() => {
                            const iconData = getSalesChannelIcon(channelPrice.channelId)
                            return (
                              <div 
                                className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                                style={{ backgroundColor: iconData?.color || '#6B7280' }}
                              >
                                <span className="text-lg">{iconData?.icon || '🏢'}</span>
                              </div>
                            )
                          })()}
                          <div>
                            <h4 className="font-semibold text-gray-900">{channelPrice.channelName}</h4>
                            <p className="text-sm text-gray-500">Default Commission: {channelPrice.channelCommission}%</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className={getProfitMarginColor(profitMargin)}>
                            {getProfitMarginIcon(profitMargin)}
                            <span className="ml-1">{profitMargin.toFixed(1)}%</span>
                          </Badge>
                        </div>
                      </div>

                      {/* Pricing Inputs */}
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-4">
                        {/* Base Price */}
                        <div className="lg:col-span-3">
                          <Label className="text-sm font-medium text-gray-700">Base Price</Label>
                          <Input
                            type="number"
                            value={channelPrice.price}
                            onChange={(e) => {
                              const newPrice = Number(e.target.value)
                              handlePriceChange(channelPrice.channelId, 'price', newPrice)
                              handlePriceChange(channelPrice.channelId, 'finalPrice', 
                                newPrice * (1 + (channelPrice.taxRate / 100))
                              )
                            }}
                            min="0"
                            step="100"
                            className="mt-1 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>

                        {/* Commission */}
                        <div className="lg:col-span-2">
                          <Label className="text-sm font-medium text-gray-700">Commission (%)</Label>
                          <Input
                            type="number"
                            value={channelPrice.commission}
                            onChange={(e) => 
                              handlePriceChange(channelPrice.channelId, 'commission', Number(e.target.value))
                            }
                            min="0"
                            max="100"
                            step="0.1"
                            className="mt-1 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>

                        {/* Tax Rate */}
                        <div className="lg:col-span-2">
                          <Label className="text-sm font-medium text-gray-700">Tax Rate (%)</Label>
                          <Input
                            type="number"
                            value={channelPrice.taxRate}
                            onChange={(e) => {
                              const newTaxRate = Number(e.target.value)
                              handlePriceChange(channelPrice.channelId, 'taxRate', newTaxRate)
                              handlePriceChange(channelPrice.channelId, 'finalPrice', 
                                channelPrice.price * (1 + (newTaxRate / 100))
                              )
                            }}
                            min="0"
                            max="100"
                            step="0.1"
                            className="mt-1 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>

                        {/* Final Price */}
                        <div className="lg:col-span-3">
                          <Label className="text-sm font-medium text-gray-700">Final Price (with Tax)</Label>
                          <div className="mt-1 p-2 bg-blue-50 border border-blue-200 rounded text-blue-800 font-semibold">
                            {decimalSettings ? formatCurrency(pricing.priceWithTax, decimalSettings) : `Rp ${pricing.priceWithTax.toLocaleString('id-ID')}`}
                          </div>
                        </div>
                      </div>

                      {/* Detailed Breakdown */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h5 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                          <Calculator className="h-4 w-4" />
                          Pricing Breakdown
                        </h5>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="space-y-1">
                            <p className="text-gray-600">Tax Amount:</p>
                            <p className="font-medium text-red-600">
                              {decimalSettings ? formatCurrency(pricing.taxAmount, decimalSettings) : `Rp ${pricing.taxAmount.toLocaleString('id-ID')}`}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-gray-600">Commission Amount:</p>
                            <p className="font-medium text-orange-600">
                              {decimalSettings ? formatCurrency(pricing.commissionAmount, decimalSettings) : `Rp ${pricing.commissionAmount.toLocaleString('id-ID')}`}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-gray-600">Gross Profit:</p>
                            <p className="font-medium text-green-600">
                              {decimalSettings ? formatCurrency(pricing.grossProfit, decimalSettings) : `Rp ${pricing.grossProfit.toLocaleString('id-ID')}`}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-gray-600">Net Margin:</p>
                            <p className="font-medium text-blue-600">
                              {pricing.netMargin.toFixed(1)}%
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>

        {/* Reason for Update */}
        <Card className="border-2 border-yellow-100 bg-gradient-to-r from-yellow-50 to-orange-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-yellow-800">
              <Info className="h-5 w-5" />
              Change Reason (Optional)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter the reason for price changes (e.g., 'Market adjustment', 'Cost increase', 'Promotional pricing')..."
              rows={3}
              className="border-yellow-200 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
            />
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button variant="outline" onClick={onClose} disabled={loading} className="px-6">
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading} className="px-6 bg-blue-600 hover:bg-blue-700">
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
