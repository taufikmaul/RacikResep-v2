'use client'

import { Modal } from '@/components/ui/modal'
import { Card, CardContent } from '@/components/ui/card'
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  DollarSign
} from 'lucide-react'
import { useDecimalSettings } from '@/hooks/useDecimalSettings'
import { formatCurrency } from '@/lib/utils'

export interface PriceHistoryEntry {
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

export interface ReusablePriceHistoryDialogProps {
  isOpen: boolean
  onClose: () => void
  title: string
  priceHistory: PriceHistoryEntry[]
  emptyStateMessage?: string
  emptyStateIcon?: React.ReactNode
  showMarginStats?: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
}

export function ReusablePriceHistoryDialog({
  isOpen,
  onClose,
  title,
  priceHistory,
  emptyStateMessage = "Belum ada riwayat perubahan harga",
  emptyStateIcon = <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />,
  showMarginStats = true,
  size = "2xl"
}: ReusablePriceHistoryDialogProps) {
  const { settings: decimalSettings } = useDecimalSettings()

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

  // Calculate summary statistics
  const totalChanges = priceHistory.length
  const priceIncreases = priceHistory.filter(h => h.percentageChange > 0).length
  const priceDecreases = priceHistory.filter(h => h.percentageChange < 0).length
  const avgChange = totalChanges > 0 ? 
    priceHistory.reduce((sum, h) => sum + h.percentageChange, 0) / totalChanges : 0
  const maxIncrease = Math.max(...priceHistory.map(h => h.percentageChange), 0)
  const maxDecrease = Math.min(...priceHistory.map(h => h.percentageChange), 0)
  
  // Calculate margin statistics (only if showMarginStats is true)
  const currentMargin = showMarginStats && priceHistory.length > 0 ? 
    calculateMargin(priceHistory[0].newPrice, priceHistory[0].cogsPerServing) : 0
  const avgMargin = showMarginStats && totalChanges > 0 ? 
    priceHistory.reduce((sum, h) => sum + calculateMargin(h.newPrice, h.cogsPerServing), 0) / totalChanges : 0
  const maxMargin = showMarginStats ? Math.max(...priceHistory.map(h => calculateMargin(h.newPrice, h.cogsPerServing)), 0) : 0
  const minMargin = showMarginStats ? Math.min(...priceHistory.map(h => calculateMargin(h.newPrice, h.cogsPerServing)), 0) : 0

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={title}
      size={size}
    >
      <div className="space-y-6">
        {priceHistory.length === 0 ? (
          <div className="text-center py-8">
            {emptyStateIcon}
            <p className="text-gray-500">{emptyStateMessage}</p>
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
                
                {/* Margin Statistics - Only show if enabled */}
                {showMarginStats && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                      <div>
                        <div className={`text-xl font-bold ${currentMargin >= 20 ? 'text-green-600' : currentMargin >= 10 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {currentMargin.toFixed(1)}%
                        </div>
                        <div className="text-sm text-gray-500">Current Margin</div>
                      </div>
                      <div>
                        <div className={`text-xl font-bold ${avgMargin >= 20 ? 'text-green-600' : avgMargin >= 10 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {avgMargin.toFixed(1)}%
                        </div>
                        <div className="text-sm text-gray-500">Avg Margin</div>
                      </div>
                      <div>
                        <div className="text-xl font-bold text-green-600">{maxMargin.toFixed(1)}%</div>
                        <div className="text-sm text-gray-500">Max Margin</div>
                      </div>
                      <div>
                        <div className="text-xl font-bold text-red-600">{minMargin.toFixed(1)}%</div>
                        <div className="text-sm text-gray-500">Min Margin</div>
                      </div>
                    </div>
                  </div>
                )}

                {(maxIncrease > 0 || maxDecrease < 0) && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex justify-between text-sm">
                      <span className="text-green-600">
                        <TrendingUp className="h-4 w-4 inline mr-1" />
                        Max Increase: +{maxIncrease.toFixed(1)}%
                      </span>
                      <span className="text-red-600">
                        <TrendingDown className="h-4 w-4 inline mr-1" />
                        Max Decrease: {maxDecrease.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Price History List */}
            <div className="space-y-2">
              {priceHistory.map((history, index) => (
                <Card key={history.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
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
                          {showMarginStats && (
                            <>
                              <div className="text-xs text-gray-400">
                                Margin: {calculateMargin(history.oldPrice, history.cogsPerServing).toFixed(1)}%
                              </div>
                              <div className="text-xs text-gray-400">
                                ({decimalSettings ? formatCurrency(calculateMarginAmount(history.oldPrice, history.cogsPerServing), decimalSettings) : `Rp ${calculateMarginAmount(history.oldPrice, history.cogsPerServing).toLocaleString('id-ID')}`})
                              </div>
                            </>
                          )}
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
                          {showMarginStats && (
                            <>
                              <div className={`text-xs ${calculateMargin(history.newPrice, history.cogsPerServing) >= 20 ? 'text-green-600' : calculateMargin(history.newPrice, history.cogsPerServing) >= 10 ? 'text-yellow-600' : 'text-red-600'}`}>
                                Margin: {calculateMargin(history.newPrice, history.cogsPerServing).toFixed(1)}%
                              </div>
                              <div className={`text-xs ${calculateMargin(history.newPrice, history.cogsPerServing) >= 20 ? 'text-green-600' : calculateMargin(history.newPrice, history.cogsPerServing) >= 10 ? 'text-yellow-600' : 'text-red-600'}`}>
                                ({decimalSettings ? formatCurrency(calculateMarginAmount(history.newPrice, history.cogsPerServing), decimalSettings) : `Rp ${calculateMarginAmount(history.newPrice, history.cogsPerServing).toLocaleString('id-ID')}`})
                              </div>
                            </>
                          )}
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
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}
