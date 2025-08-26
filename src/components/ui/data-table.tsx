'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { ChevronLeft, ChevronRight, Search, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'

export interface Column<T> {
  key: string
  header: string
  sortable?: boolean
  render?: (item: T) => React.ReactNode
  className?: string
}

export interface PaginationInfo {
  page: number
  limit: number
  totalCount: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  pagination: PaginationInfo
  loading?: boolean
  searchTerm: string
  sortBy: string
  sortOrder: 'asc' | 'desc'
  onSearchChange: (search: string) => void
  onSortChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void
  onPageChange: (page: number) => void
  onLimitChange: (limit: number) => void
  searchPlaceholder?: string
  emptyState?: React.ReactNode
  // Optional: render a mobile-friendly card for each item. If omitted, only the table view is shown.
  renderItemCard?: (item: T) => React.ReactNode
}

export function DataTable<T extends { id: string }>({
  data,
  columns,
  pagination,
  loading = false,
  searchTerm,
  sortBy,
  sortOrder,
  onSearchChange,
  onSortChange,
  onPageChange,
  onLimitChange,
  searchPlaceholder = "Cari...",
  emptyState,
  renderItemCard
}: DataTableProps<T>) {
  // Debounced search handling for better UX and to avoid excessive fetches
  const [internalSearch, setInternalSearch] = useState(searchTerm)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Keep internal state in sync when parent searchTerm changes externally
  useEffect(() => {
    setInternalSearch(searchTerm)
  }, [searchTerm])

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  const handleSearchInput = (value: string) => {
    setInternalSearch(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      onSearchChange(value.trim())
    }, 300)
  }
  const handleSort = (columnKey: string) => {
    if (sortBy === columnKey) {
      onSortChange(columnKey, sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      onSortChange(columnKey, 'asc')
    }
  }

  const getSortIcon = (columnKey: string) => {
    if (sortBy !== columnKey) {
      return <ArrowUpDown className="h-4 w-4 text-gray-400" />
    }
    return sortOrder === 'asc' 
      ? <ArrowUp className="h-4 w-4 text-blue-600" />
      : <ArrowDown className="h-4 w-4 text-blue-600" />
  }

  const pageNumbers = []
  const maxVisiblePages = 5
  const startPage = Math.max(1, pagination.page - Math.floor(maxVisiblePages / 2))
  const endPage = Math.min(pagination.totalPages, startPage + maxVisiblePages - 1)

  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="pt-6">
            <div className="animate-pulse">
              <div className="h-10 bg-gray-200 rounded mb-4"></div>
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 sm:justify-between">
            <div className="relative w-full sm:flex-1 sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder={searchPlaceholder}
                value={internalSearch}
                onChange={(e) => handleSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (debounceRef.current) clearTimeout(debounceRef.current)
                    onSearchChange(internalSearch.trim())
                  }
                }}
                onBlur={() => {
                  if (debounceRef.current) clearTimeout(debounceRef.current)
                  onSearchChange(internalSearch.trim())
                }}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Tampilkan:</span>
              <select
                value={pagination.limit}
                onChange={(e) => onLimitChange(parseInt(e.target.value))}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards on mobile (if provided) */}
      {renderItemCard && (
        <div className="sm:hidden">
          {data.length > 0 ? (
            <div className="grid grid-cols-1 gap-3">
              {data.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-4">
                    {renderItemCard(item)}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="p-4">
              {emptyState || (
                <div className="text-center">
                  <p className="text-gray-500">Tidak ada data yang ditemukan</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Table on sm and up */}
      <Card className={renderItemCard ? 'hidden sm:block' : ''}>
        <CardContent className="p-0">
          {data.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    {columns.map((column) => (
                      <th
                        key={column.key}
                        className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                          column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                        } ${column.className || ''}`}
                        onClick={column.sortable ? () => handleSort(column.key) : undefined}
                      >
                        <div className="flex items-center gap-2">
                          {column.header}
                          {column.sortable && getSortIcon(column.key)}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      {columns.map((column) => (
                        <td
                          key={column.key}
                          className={`px-6 py-4 whitespace-nowrap text-sm ${column.className || ''}`}
                        >
                          {column.render 
                            ? column.render(item)
                            : (item as any)[column.key]
                          }
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12">
              {emptyState || (
                <div className="text-center">
                  <p className="text-gray-500">Tidak ada data yang ditemukan</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Menampilkan {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.totalCount)} dari {pagination.totalCount} data
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(pagination.page - 1)}
                  disabled={!pagination.hasPrev}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Sebelumnya
                </Button>
                
                <div className="flex items-center gap-1">
                  {pageNumbers.map((pageNum) => (
                    <Button
                      key={pageNum}
                      variant={pageNum === pagination.page ? "default" : "outline"}
                      size="sm"
                      onClick={() => onPageChange(pageNum)}
                      className="w-8 h-8 p-0"
                    >
                      {pageNum}
                    </Button>
                  ))}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(pagination.page + 1)}
                  disabled={!pagination.hasNext}
                >
                  Selanjutnya
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
