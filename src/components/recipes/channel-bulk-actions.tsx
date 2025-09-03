'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  TrashIcon, 
  DownloadIcon, 
  Pencil1Icon, 
  DotsHorizontalIcon, 
  Cross1Icon, 
  UpdateIcon,
} from '@radix-ui/react-icons'
import { 
  Trash2, 
  Download, 
  Edit, 
  MoreHorizontal, 
  X, 
  RefreshCw,
  Store as StoreIcon,
  DollarSign as DollarSignIcon,
  Calculator as CalculatorIcon
} from 'lucide-react'
import { ChannelBulkPriceDialog } from './channel-bulk-price-dialog'

interface ChannelBulkActionsProps<T> {
  data: T[]
  selectedItems: string[]
  onSelectionChange: (selectedIds: string[]) => void
  onBulkDelete: (ids: string[]) => void
  onBulkExport?: (ids: string[]) => void
  onBulkPriceUpdate?: (ids: string[], priceData: any) => void
  loading?: boolean
}

export function ChannelBulkActions<T extends { id: string }>({
  data,
  selectedItems,
  onSelectionChange,
  onBulkDelete,
  onBulkExport,
  onBulkPriceUpdate,
  loading = false
}: ChannelBulkActionsProps<T>) {
  
  const [isProcessing, setIsProcessing] = useState(false)
  const [showBulkPriceDialog, setShowBulkPriceDialog] = useState(false)

  const handleSelectAll = () => {
    if (selectedItems.length === data.length) {
      onSelectionChange([])
    } else {
      onSelectionChange(data.map(item => item.id))
    }
  }

  const handleBulkDelete = async () => {
    if (confirm(`Apakah Anda yakin ingin menghapus ${selectedItems.length} item yang dipilih?`)) {
      setIsProcessing(true)
      try {
        await onBulkDelete(selectedItems)
      } finally {
        setIsProcessing(false)
      }
    }
  }

  const handleBulkExport = async () => {
    if (onBulkExport) {
      setIsProcessing(true)
      try {
        await onBulkExport(selectedItems)
      } finally {
        setIsProcessing(false)
      }
    }
  }

  const handleBulkPriceUpdate = (priceData: any) => {
    if (onBulkPriceUpdate) {
      setIsProcessing(true)
      try {
        onBulkPriceUpdate(selectedItems, priceData)
        setShowBulkPriceDialog(false)
      } finally {
        setIsProcessing(false)
      }
    }
  }

  if (data.length === 0) return null

  return (
    <>
      <div  style={{ 
        background: "var(--color-panel-solid)"
      }} className="border-b border-gray-200 px-3 sm:px-4 py-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={selectedItems.length === data.length && data.length > 0}
                onCheckedChange={handleSelectAll}
                disabled={loading || isProcessing}
              />
              <span className="text-sm text-gray-700">
                {selectedItems.length === 0 
                  ? 'Pilih semua' 
                  : `${selectedItems.length} dari ${data.length} dipilih`
                }
              </span>
            </div>

            {selectedItems.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowBulkPriceDialog(true)}
                  disabled={loading || isProcessing}
                  className="flex items-center gap-2"
                >
                  <StoreIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Bulk Price Update</span>
                  <span className="sm:hidden">Price</span>
                </Button>

                {onBulkExport && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBulkExport}
                    disabled={loading || isProcessing}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    <span className="hidden sm:inline">Export</span>
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkDelete}
                  disabled={loading || isProcessing}
                  className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Delete</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onSelectionChange([])}
                  disabled={loading || isProcessing}
                  className="flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  <span className="hidden sm:inline">Clear</span>
                </Button>
              </div>
            )}
          </div>

          {isProcessing && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Processing...</span>
            </div>
          )}
        </div>
      </div>

      {/* Bulk Price Update Dialog */}
      {showBulkPriceDialog && (
        <ChannelBulkPriceDialog
          isOpen={showBulkPriceDialog}
          onClose={() => setShowBulkPriceDialog(false)}
          selectedRecipeIds={selectedItems}
          onPriceUpdate={handleBulkPriceUpdate}
        />
      )}
    </>
  )
}
