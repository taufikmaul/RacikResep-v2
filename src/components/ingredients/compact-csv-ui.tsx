'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileText, Download, Upload, MoreHorizontal, Package } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface CompactCsvUIProps {
  onTemplateDownload: () => void
  onExportAll: () => void
  onImport: () => void
  onCategoryManagement: () => void
  className?: string
}

export function CompactCsvUI({
  onTemplateDownload,
  onExportAll,
  onImport,
  onCategoryManagement,
  className = ''
}: CompactCsvUIProps) {

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Primary Import Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={onImport}
        className="flex items-center gap-2"
      >
        <Upload className="h-4 w-4" />
        <span className="hidden sm:inline">Import</span>
      </Button>

      {/* CSV Actions Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {/* Template Download */}
          <DropdownMenuItem
            onClick={onTemplateDownload}
            className="text-blue-600 focus:text-blue-700 focus:bg-blue-50"
          >
            <FileText className="h-4 w-4 mr-2" />
            Download Template CSV
          </DropdownMenuItem>

          {/* Export All */}
          <DropdownMenuItem
            onClick={onExportAll}
            className="text-green-600 focus:text-green-700 focus:bg-green-50"
          >
            <Download className="h-4 w-4 mr-2" />
            Export All Bahan CSV
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Category Management */}
          <DropdownMenuItem
            onClick={onCategoryManagement}
            className="text-purple-600 focus:text-purple-700 focus:bg-purple-50"
          >
            <Package className="h-4 w-4 mr-2" />
            Management Category
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
