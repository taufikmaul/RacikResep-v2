"use client"

import { useState, useRef } from 'react'
import { Modal } from '@/components/ui/modal'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download, Upload, FileText, AlertCircle, CheckCircle, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'

interface ImportExportDialogProps {
  isOpen: boolean
  onClose: () => void
  onImportComplete: () => void
}

interface ImportResult {
  total: number
  processed: number
  updated: number
  errors: string[]
}

export function ImportExportDialog({ isOpen, onClose, onImportComplete }: ImportExportDialogProps) {
  const [activeTab, setActiveTab] = useState<'import' | 'export'>('import')
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExport = () => {
    const searchParams = new URLSearchParams(window.location.search)
    const search = searchParams.get('search') || ''
    const url = `/api/recipes/price-manager/export${search ? `?search=${encodeURIComponent(search)}` : ''}`
    
    const link = document.createElement('a')
    link.href = url
    link.download = `recipe-prices-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    toast.success('File berhasil diunduh')
  }

  const handleTemplateDownload = () => {
    const link = document.createElement('a')
    link.href = '/api/recipes/price-manager/template'
    link.download = 'recipe-price-template.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    toast.success('Template berhasil diunduh')
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.csv')) {
      toast.error('File harus berformat CSV')
      return
    }

    setImporting(true)
    setImportResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/recipes/price-manager/import', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const result = await response.json()
        setImportResult(result.results)
        
        if (result.results.errors.length === 0) {
          toast.success(`Berhasil mengimpor ${result.results.updated} harga resep`)
          onImportComplete()
        } else {
          toast.error(`Import selesai dengan ${result.results.errors.length} error`)
        }
      } else {
        const error = await response.json()
        toast.error(error.error || 'Gagal mengimpor file')
      }
    } catch (error) {
      console.error('Import error:', error)
      toast.error('Terjadi kesalahan saat mengimpor file')
    } finally {
      setImporting(false)
    }
  }

  const handleFileDrop = (event: React.DragEvent) => {
    event.preventDefault()
    const files = event.dataTransfer.files
    if (files.length > 0) {
      const file = files[0]
      if (file.name.endsWith('.csv')) {
        if (fileInputRef.current) {
          fileInputRef.current.files = files
          handleFileSelect({ target: { files } } as any)
        }
      } else {
        toast.error('File harus berformat CSV')
      }
    }
  }

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Import & Export Harga Resep" size="xl">
      <div className="space-y-4 p-2">
        {/* Tabs */}
        <div className="flex border-b">
          <button
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'import'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('import')}
          >
            Import CSV
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'export'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('export')}
          >
            Export CSV
          </button>
        </div>

        {/* Import Tab */}
        {activeTab === 'import' && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Upload File CSV</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors"
                  onDrop={handleFileDrop}
                  onDragOver={handleDragOver}
                >
                  <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-600 mb-2">
                    Drag and drop file CSV di sini, atau
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={importing}
                  >
                    Pilih File
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>

                <div className="text-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleTemplateDownload}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Download Template CSV
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Import Results */}
            {importResult && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Hasil Import</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-500 mb-1">Total</p>
                      <p className="text-xl font-bold text-gray-900">{importResult.total}</p>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-500 mb-1">Diproses</p>
                      <p className="text-xl font-bold text-blue-600">{importResult.processed}</p>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <p className="text-sm text-green-500 mb-1">Diperbarui</p>
                      <p className="text-xl font-bold text-green-600">{importResult.updated}</p>
                    </div>
                  </div>

                  {importResult.errors.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium text-red-600 mb-2 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-2" />
                        Error ({importResult.errors.length})
                      </h4>
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {importResult.errors.map((error, index) => (
                          <div key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                            {error}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Export Tab */}
        {activeTab === 'export' && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Export Data Harga</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600">
                  Export data harga resep saat ini ke dalam format CSV. File akan berisi semua resep yang sesuai dengan filter pencarian.
                </p>
                
                <div className="flex gap-3">
                  <Button onClick={handleExport} className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                  <Button variant="outline" onClick={handleTemplateDownload}>
                    <FileText className="h-4 w-4 mr-2" />
                    Download Template
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Tutup
          </Button>
        </div>
      </div>
    </Modal>
  )
}
