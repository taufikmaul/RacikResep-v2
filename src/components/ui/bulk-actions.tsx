'use client'

import { useState, useEffect } from 'react'
import { Button } from './button'
import { Checkbox } from './checkbox'
import { TrashIcon, DownloadIcon, Pencil1Icon, DotsHorizontalIcon, Cross1Icon, UpdateIcon } from '@radix-ui/react-icons'

interface BulkActionsProps<T> {
  data: T[]
  selectedItems: string[]
  onSelectionChange: (selectedIds: string[]) => void
  onBulkDelete: (ids: string[]) => void
  onBulkExport?: (ids: string[]) => void
  onBulkEdit?: (ids: string[]) => void
  onBulkCategoryChange?: (ids: string[], categoryId: string) => void
  categories?: Array<{ id: string; name: string; color: string }>
  loading?: boolean
}

export function BulkActions<T extends { id: string }>({
  data,
  selectedItems,
  onSelectionChange,
  onBulkDelete,
  onBulkExport,
  onBulkEdit,
  onBulkCategoryChange,
  categories = [],
  loading = false
}: BulkActionsProps<T>) {
  const [showCategoryMenu, setShowCategoryMenu] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleSelectAll = () => {
    if (selectedItems.length === data.length) {
      onSelectionChange([])
    } else {
      onSelectionChange(data.map(item => item.id))
    }
  }

  const handleSelectItem = (id: string) => {
    if (selectedItems.includes(id)) {
      onSelectionChange(selectedItems.filter(itemId => itemId !== id))
    } else {
      onSelectionChange([...selectedItems, id])
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

  const handleBulkEdit = async () => {
    if (onBulkEdit) {
      setIsProcessing(true)
      try {
        await onBulkEdit(selectedItems)
      } finally {
        setIsProcessing(false)
      }
    }
  }

  const handleCategoryChange = async (categoryId: string) => {
    if (onBulkCategoryChange) {
      setIsProcessing(true)
      try {
        await onBulkCategoryChange(selectedItems, categoryId)
        setShowCategoryMenu(false)
      } finally {
        setIsProcessing(false)
      }
    }
  }

  if (data.length === 0) return null

  return (
    <div className="bg-white border-b border-gray-200 px-3 sm:px-4 py-3">
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
                onClick={handleBulkDelete}
                disabled={loading || isProcessing}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                {isProcessing ? (
                  <UpdateIcon className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <TrashIcon className="h-4 w-4 mr-1" />
                )}
                Hapus ({selectedItems.length})
              </Button>

              {onBulkExport && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkExport}
                  disabled={loading || isProcessing}
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                >
                  {isProcessing ? (
                    <UpdateIcon className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <DownloadIcon className="h-4 w-4 mr-1" />
                  )}
                  Export ({selectedItems.length})
                </Button>
              )}

              {onBulkEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkEdit}
                  disabled={loading || isProcessing}
                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                >
                  {isProcessing ? (
                    <UpdateIcon className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Pencil1Icon className="h-4 w-4 mr-1" />
                  )}
                  Edit ({selectedItems.length})
                </Button>
              )}

              {onBulkCategoryChange && categories.length > 0 && (
                <div className="relative">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCategoryMenu(!showCategoryMenu)}
                    disabled={loading || isProcessing}
                    className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                  >
                    <DotsHorizontalIcon className="h-4 w-4 mr-1" />
                    Ubah Kategori
                  </Button>

                  {showCategoryMenu && (
                    <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                      <div className="p-2">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">Pilih Kategori</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowCategoryMenu(false)}
                            className="h-6 w-6 p-0"
                          >
                            <Cross1Icon className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {categories.map((category) => (
                            <button
                              key={category.id}
                              onClick={() => handleCategoryChange(category.id)}
                              className="w-full text-left px-2 py-1 text-sm hover:bg-gray-100 rounded flex items-center gap-2"
                            >
                              <div 
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: category.color }}
                              />
                              {category.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {selectedItems.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSelectionChange([])}
            className="text-gray-500 hover:text-gray-700"
          >
            <Cross1Icon className="h-4 w-4 mr-1" />
            Batal
          </Button>
        )}
      </div>
    </div>
  )
}
