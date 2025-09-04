'use client'

import { useState, useEffect } from 'react'
import { Button } from './button'
import { Checkbox } from './checkbox'
import { TrashIcon, DownloadIcon, Pencil1Icon, DotsHorizontalIcon, Cross1Icon, UpdateIcon } from '@radix-ui/react-icons'
import { ChefHat, Heart } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './dropdown-menu'
import { ConfirmationDialog } from './alert-dialog'

interface BulkActionsProps<T> {
  data: T[]
  selectedItems: string[]
  onSelectionChange: (selectedIds: string[]) => void
  onBulkDelete: (ids: string[]) => void
  onBulkExport?: (ids: string[]) => void
  onBulkEdit?: (ids: string[]) => void
  onBulkCategoryChange?: (ids: string[], categoryId: string) => void
  onBulkSetBasicRecipe?: (ids: string[], isBasic: boolean) => void
  onBulkSetFavorite?: (ids: string[], isFavorite: boolean) => void
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
  onBulkSetBasicRecipe,
  onBulkSetFavorite,
  categories = [],
  loading = false
}: BulkActionsProps<T>) {
  const [showCategoryMenu, setShowCategoryMenu] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
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

  const handleBulkDelete = () => {
    setConfirmDialog({
      open: true,
      title: 'Hapus Item Terpilih',
      description: `Apakah Anda yakin ingin menghapus ${selectedItems.length} item yang dipilih? Tindakan ini tidak dapat dibatalkan.`,
      onConfirm: async () => {
        setIsProcessing(true)
        try {
          await onBulkDelete(selectedItems)
        } finally {
          setIsProcessing(false)
        }
      }
    })
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

  const handleBulkSetBasicRecipe = async (isBasic: boolean) => {
    if (onBulkSetBasicRecipe) {
      setIsProcessing(true)
      try {
        await onBulkSetBasicRecipe(selectedItems, isBasic)
      } finally {
        setIsProcessing(false)
      }
    }
  }

  const handleBulkSetFavorite = async (isFavorite: boolean) => {
    if (onBulkSetFavorite) {
      setIsProcessing(true)
      try {
        await onBulkSetFavorite(selectedItems, isFavorite)
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
              {/* Delete button - always visible */}
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

              {/* Dropdown menu for other bulk actions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={loading || isProcessing}
                    className="text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                  >
                    {isProcessing ? (
                      <UpdateIcon className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <DotsHorizontalIcon className="h-4 w-4 mr-1" />
                    )}
                    Aksi Lainnya ({selectedItems.length})
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  {/* Export */}
                  {onBulkExport && (
                    <DropdownMenuItem
                      onClick={handleBulkExport}
                      disabled={loading || isProcessing}
                      className="text-blue-600 focus:text-blue-700 focus:bg-blue-50"
                    >
                      <DownloadIcon className="h-4 w-4 mr-2" />
                      Export ({selectedItems.length})
                    </DropdownMenuItem>
                  )}

                  {/* Edit */}
                  {onBulkEdit && (
                    <DropdownMenuItem
                      onClick={handleBulkEdit}
                      disabled={loading || isProcessing}
                      className="text-green-600 focus:text-green-700 focus:bg-green-50"
                    >
                      <Pencil1Icon className="h-4 w-4 mr-2" />
                      Edit ({selectedItems.length})
                    </DropdownMenuItem>
                  )}

                  {/* Set Basic Recipe */}
                  {onBulkSetBasicRecipe && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleBulkSetBasicRecipe(true)}
                        disabled={loading || isProcessing}
                        className="text-purple-600 focus:text-purple-700 focus:bg-purple-50"
                      >
                        <ChefHat className="h-4 w-4 mr-2" />
                        Set Basic Recipe ({selectedItems.length})
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleBulkSetBasicRecipe(false)}
                        disabled={loading || isProcessing}
                        className="text-gray-600 focus:text-gray-700 focus:bg-gray-50"
                      >
                        <ChefHat className="h-4 w-4 mr-2" />
                        Unset Basic Recipe ({selectedItems.length})
                      </DropdownMenuItem>
                    </>
                  )}

                  {/* Set Favorite */}
                  {onBulkSetFavorite && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleBulkSetFavorite(true)}
                        disabled={loading || isProcessing}
                        className="text-yellow-600 focus:text-yellow-700 focus:bg-yellow-50"
                      >
                        <Heart className="h-4 w-4 mr-2" />
                        Set Favorite ({selectedItems.length})
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleBulkSetFavorite(false)}
                        disabled={loading || isProcessing}
                        className="text-gray-600 focus:text-gray-700 focus:bg-gray-50"
                      >
                        <Heart className="h-4 w-4 mr-2" />
                        Unset Favorite ({selectedItems.length})
                      </DropdownMenuItem>
                    </>
                  )}

                  {/* Category Change */}
                  {onBulkCategoryChange && categories.length > 0 && (
                    <>
                      <DropdownMenuSeparator />
                      <div className="px-2 py-1.5">
                        <div className="text-sm font-medium text-gray-700 mb-1">Ubah Kategori</div>
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
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
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

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}
        title={confirmDialog.title}
        description={confirmDialog.description}
        onConfirm={confirmDialog.onConfirm}
        confirmText="Ya, Hapus"
        cancelText="Batal"
        variant="destructive"
      />
    </div>
  )
}
