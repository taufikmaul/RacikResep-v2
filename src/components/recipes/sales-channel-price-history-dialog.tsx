'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  TrendingUp, 
  TrendingDown, 
  X,
  Calendar,
  DollarSign,
  Percent,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Info,
  Store,
  BarChart3,
  Activity
} from 'lucide-react'
import { useDecimalSettings } from '@/hooks/useDecimalSettings'
import { formatCurrency } from '@/lib/utils'
import { SALES_CHANNEL_ICONS } from '@/components/ui/sales-channel-icon-selector'

interface ChannelPriceHistory {
  id: string
  channelId: string
  channelName: string
  oldPrice: number
  newPrice: number
  priceChange: number
  percentageChange: number
  changeType: string
  reason?: string
  changeDate: string
  cogsPerServing: number
}

interface SalesChannelPriceHistoryDialogProps {
  isOpen: boolean
  onClose: () => void
  recipeName: string
  recipeId: string
}

export function SalesChannelPriceHistoryDialog({
  isOpen,
  onClose,
  recipeName,
  recipeId
}: SalesChannelPriceHistoryDialogProps) {
  const { settings: decimalSettings } = useDecimalSettings()
  const [loading, setLoading] = useState(false)
  const [priceHistory, setPriceHistory] = useState<ChannelPriceHistory[]>([])
  const [channels, setChannels] = useState<{id: string, name: string, icon: string}[]>([])

  // Helper function to get sales channel icon
  const getSalesChannelIcon = (channelIcon: string) => {
    const iconData = SALES_CHANNEL_ICONS.find(icon => icon.id === channelIcon)
    return iconData || SALES_CHANNEL_ICONS.find(icon => icon.id === 'other')
  }

  useEffect(() => {
    if (isOpen && recipeId) {
      fetchPriceHistory()
    }
  }, [isOpen, recipeId])

  const fetchPriceHistory = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/recipes/${recipeId}/all-channel-price-history`)
      if (response.ok) {
        const data = await response.json()
        setPriceHistory(data.priceHistory || [])
        setChannels(data.channels || [])
      } else {
        console.error('Failed to fetch price history')
      }
    } catch (error) {
      console.error('Error fetching price history:', error)
    } finally {
      setLoading(false)
    }
  }

  const getChangeIcon = (changeType: string, percentageChange: number) => {
    if (changeType === 'increase' || percentageChange > 0) {
      return <ArrowUpRight className="h-4 w-4 text-green-600" />
    } else if (changeType === 'decrease' || percentageChange < 0) {
      return <ArrowDownRight className="h-4 w-4 text-red-600" />
    }
    return <Minus className="h-4 w-4 text-gray-500" />
  }

  const getChangeColor = (percentageChange: number) => {
    if (percentageChange > 0) return 'text-green-600'
    if (percentageChange < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit'
      })
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString('id-ID', {
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit'
      })
    } else {
      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: '2-digit'
      })
    }
  }

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Baru saja'
    if (diffInHours < 24) return `${diffInHours} jam lalu`
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays} hari lalu`
    const diffInWeeks = Math.floor(diffInDays / 7)
    if (diffInWeeks < 4) return `${diffInWeeks} minggu lalu`
    const diffInMonths = Math.floor(diffInDays / 30)
    return `${diffInMonths} bulan lalu`
  }

  const calculateMargin = (price: number, cogs: number) => {
    if (price <= 0 || cogs <= 0) return 0
    return ((price - cogs) / price) * 100
  }

  const calculateMarginAmount = (price: number, cogs: number) => {
    if (price <= 0 || cogs <= 0) return 0
    return price - cogs
  }

  // Group price history by channel
  const historyByChannel = channels.reduce((acc, channel) => {
    acc[channel.id] = {
      channel,
      history: priceHistory.filter(h => h.channelId === channel.id)
    }
    return acc
  }, {} as Record<string, { channel: {id: string, name: string}, history: ChannelPriceHistory[] }>)

  // Calculate summary statistics
  const totalChanges = priceHistory.length
  const priceIncreases = priceHistory.filter(h => h.percentageChange > 0).length
  const priceDecreases = priceHistory.filter(h => h.percentageChange < 0).length
  const avgChange = totalChanges > 0 ? 
    priceHistory.reduce((sum, h) => sum + h.percentageChange, 0) / totalChanges : 0

  // Calculate channel-specific statistics
  const channelStats = channels.map(channel => {
    const channelHistory = priceHistory.filter(h => h.channelId === channel.id)
    const currentPrice = channelHistory.length > 0 ? channelHistory[0].newPrice : 0
    const currentMargin = currentPrice > 0 ? calculateMargin(currentPrice, channelHistory[0]?.cogsPerServing || 0) : 0
    const avgMargin = channelHistory.length > 0 ? 
      channelHistory.reduce((sum, h) => sum + calculateMargin(h.newPrice, h.cogsPerServing), 0) / channelHistory.length : 0
    
    return {
      channel,
      changeCount: channelHistory.length,
      currentPrice,
      currentMargin,
      avgMargin,
      lastChange: channelHistory.length > 0 ? channelHistory[0].changeDate : null
    }
  })

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={`Sales Channel Price History - ${recipeName}`}
      size="2xl"
    >
      <div className="space-y-6">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Loading price history...</p>
          </div>
        ) : priceHistory.length === 0 ? (
          <div className="text-center py-8">
            <Store className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Belum ada riwayat perubahan harga channel</p>
          </div>
        ) : (
          <>
            {/* Summary Statistics */}
            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{totalChanges}</div>
                    <div className="text-sm text-gray-500">Total Changes</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{priceIncreases}</div>
                    <div className="text-sm text-gray-500">Increases</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">{priceDecreases}</div>
                    <div className="text-sm text-gray-500">Decreases</div>
                  </div>
                  <div>
                    <div className={`text-2xl font-bold ${avgChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {avgChange >= 0 ? '+' : ''}{avgChange.toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-500">Avg Change</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Channel Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Channel Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {channelStats.map(({ channel, changeCount, currentPrice, currentMargin, avgMargin, lastChange }) => (
                    <div key={channel.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">{channel.name}</h4>
                        <Badge variant="outline">{changeCount} changes</Badge>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Current Price:</span>
                          <span className="font-medium">
                            {decimalSettings ? formatCurrency(currentPrice, decimalSettings) : `Rp ${currentPrice.toLocaleString('id-ID')}`}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Current Margin:</span>
                          <span className={`font-medium ${currentMargin >= 20 ? 'text-green-600' : currentMargin >= 10 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {currentMargin.toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Avg Margin:</span>
                          <span className={`font-medium ${avgMargin >= 20 ? 'text-green-600' : avgMargin >= 10 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {avgMargin.toFixed(1)}%
                          </span>
                        </div>
                        {lastChange && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Last Change:</span>
                            <span className="text-xs text-gray-400">{getRelativeTime(lastChange)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Detailed History by Channel */}
            <Tabs defaultValue={channels[0]?.id} className="w-full">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Vertical Tabs List */}
                <div className="w-full lg:w-48">
                  <TabsList className="flex flex-col h-auto w-full lg:w-48 p-1 bg-gray-100 rounded-lg">
                    <div className="max-h-96 overflow-y-auto w-full">
                      {channels.map((channel) => {
                        const iconData = getSalesChannelIcon(channel.icon)
                        return (
                          <TabsTrigger 
                            key={channel.id} 
                            value={channel.id}
                            className="w-full justify-start p-2 h-auto mb-1 last:mb-0"
                          >
                            <div className="flex items-center gap-2 w-full">
                              {iconData && (
                                <div 
                                  className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs flex-shrink-0"
                                  style={{ backgroundColor: iconData.color }}
                                >
                                  {iconData.icon}
                                </div>
                              )}
                              <span className="truncate text-sm">{channel.name}</span>
                            </div>
                          </TabsTrigger>
                        )
                      })}
                    </div>
                  </TabsList>
                </div>
                
                {/* Tab Content */}
                <div className="flex-1">
              
              {channels.map((channel) => {
                const channelHistory = historyByChannel[channel.id]?.history || []
                return (
                  <TabsContent key={channel.id} value={channel.id} className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          {(() => {
                            const iconData = getSalesChannelIcon(channel.icon)
                            return (
                              <div 
                                className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs"
                                style={{ backgroundColor: iconData?.color || '#6B7280' }}
                              >
                                {iconData?.icon || '🏢'}
                              </div>
                            )
                          })()}
                          {channel.name} - Price History
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {channelHistory.length === 0 ? (
                          <div className="text-center py-8">
                            <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500">Belum ada riwayat perubahan harga untuk channel ini</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {channelHistory.map((history) => (
                              <div key={history.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                                <div className="flex items-center justify-between">
                                  {/* Left side - Date and Change Info */}
                                  <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2">
                                      {getChangeIcon(history.changeType, history.percentageChange)}
                                      <div className="text-sm">
                                        <div className="font-medium text-gray-900">
                                          {formatDate(history.changeDate)}
                                        </div>
                                        <div className="text-gray-500 text-xs">
                                          {getRelativeTime(history.changeDate)}
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Center - Price Change */}
                                  <div className="flex items-center gap-4">
                                    <div className="text-right">
                                      <div className="text-sm text-gray-500">From</div>
                                      <div className="font-medium text-gray-700">
                                        {decimalSettings ? formatCurrency(history.oldPrice, decimalSettings) : `Rp ${history.oldPrice.toLocaleString('id-ID')}`}
                                      </div>
                                      <div className="text-xs text-gray-400">
                                        Margin: {calculateMargin(history.oldPrice, history.cogsPerServing).toFixed(1)}%
                                      </div>
                                      <div className="text-xs text-gray-400">
                                        ({decimalSettings ? formatCurrency(calculateMarginAmount(history.oldPrice, history.cogsPerServing), decimalSettings) : `Rp ${calculateMarginAmount(history.oldPrice, history.cogsPerServing).toLocaleString('id-ID')}`})
                                      </div>
                                    </div>
                                    <div className="text-center">
                                      <div className={`text-lg font-bold ${getChangeColor(history.percentageChange)}`}>
                                        {history.percentageChange > 0 ? '+' : ''}{history.percentageChange.toFixed(1)}%
                                      </div>
                                      <div className={`text-sm ${getChangeColor(history.priceChange)}`}>
                                        {history.priceChange > 0 ? '+' : ''}
                                        {decimalSettings ? formatCurrency(history.priceChange, decimalSettings) : `Rp ${history.priceChange.toLocaleString('id-ID')}`}
                                      </div>
                                    </div>
                                    <div className="text-left">
                                      <div className="text-sm text-gray-500">To</div>
                                      <div className="font-bold text-blue-600">
                                        {decimalSettings ? formatCurrency(history.newPrice, decimalSettings) : `Rp ${history.newPrice.toLocaleString('id-ID')}`}
                                      </div>
                                      <div className={`text-xs ${calculateMargin(history.newPrice, history.cogsPerServing) >= 20 ? 'text-green-600' : calculateMargin(history.newPrice, history.cogsPerServing) >= 10 ? 'text-yellow-600' : 'text-red-600'}`}>
                                        Margin: {calculateMargin(history.newPrice, history.cogsPerServing).toFixed(1)}%
                                      </div>
                                      <div className={`text-xs ${calculateMargin(history.newPrice, history.cogsPerServing) >= 20 ? 'text-green-600' : calculateMargin(history.newPrice, history.cogsPerServing) >= 10 ? 'text-yellow-600' : 'text-red-600'}`}>
                                        ({decimalSettings ? formatCurrency(calculateMarginAmount(history.newPrice, history.cogsPerServing), decimalSettings) : `Rp ${calculateMarginAmount(history.newPrice, history.cogsPerServing).toLocaleString('id-ID')}`})
                                      </div>
                                    </div>
                                  </div>

                                  {/* Right side - Reason (if available) */}
                                  {history.reason && (
                                    <div className="max-w-xs">
                                      <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                                        <Info className="h-3 w-3" />
                                        Reason
                                      </div>
                                      <div className="text-xs bg-gray-50 p-2 rounded text-gray-700 line-clamp-2">
                                        {history.reason}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                )
              })}
                </div>
              </div>
            </Tabs>
          </>
        )}
      </div>
    </Modal>
  )
}
