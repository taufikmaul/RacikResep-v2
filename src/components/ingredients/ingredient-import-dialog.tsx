'use client'

import { useRef, useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Upload } from 'lucide-react'
import toast from 'react-hot-toast'

interface IngredientImportDialogProps {
  isOpen: boolean
  onClose: () => void
  onImported?: (summary: { created: number; updated: number; failed: number }) => void
}

export function IngredientImportDialog({ isOpen, onClose, onImported }: IngredientImportDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return
    const f = files[0]
    const isCsv = /(^text\/csv$)|(^application\/vnd\.ms-excel$)|(.csv$)/i.test(f.type) || f.name.toLowerCase().endsWith('.csv')
    if (!isCsv) {
      toast.error('Hanya file CSV yang diperbolehkan')
      return
    }
    setFile(f)
  }

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    handleFiles(e.dataTransfer.files)
  }

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); e.stopPropagation(); setDragActive(true)
  }

  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); e.stopPropagation(); setDragActive(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      toast.error('Pilih file CSV terlebih dahulu')
      return
    }
    setLoading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/ingredients/import', {
        method: 'POST',
        body: form,
      })
      if (!res.ok) {
        let message = 'Gagal mengimpor CSV'
        try {
          const data = await res.json()
          message = data?.error || message
        } catch {}
        throw new Error(message)
      }
      const data = await res.json()
      toast.success(`Import selesai: ${data.created} dibuat, ${data.updated} diperbarui, ${data.failed} gagal`)
      onImported?.({ created: data.created, updated: data.updated, failed: data.failed })
      onClose()
    } catch (err: any) {
      toast.error(err?.message || 'Gagal mengimpor CSV')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Import Bahan dari CSV" size="lg">
      <div className="p-6" style={{ background: 'var(--color-panel-solid)' }}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <p className="text-sm mb-2" style={{ color: 'var(--gray-12)' }}>
            Unduh contoh <a href="/api/ingredients/template" className="text-sm" style={{ color: 'var(--accent-11)' }}>template CSV</a> untuk melihat format yang diperlukan.
            </p>
          </div>
          <div>
            <input
              ref={inputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
            <div
              onClick={() => inputRef.current?.click()}
              onDrop={onDrop}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              className="w-full rounded-md cursor-pointer"
              style={{
                background: 'var(--gray-2)',
                border: `2px dashed ${dragActive ? 'var(--accent-9)' : 'var(--gray-7)'}`,
              }}
            >
              <div className="flex flex-col items-center justify-center py-12">
                <Upload className="h-8 w-8 mb-3" style={{ color: 'var(--accent-9)' }} />
                <span className="text-sm font-medium" style={{ color: 'var(--gray-12)' }}>
                  {dragActive ? 'Lepaskan file di sini' : 'Tarik & jatuhkan file di sini atau klik untuk memilih'}
                </span>
                <span className="text-xs mt-2" style={{ color: 'var(--gray-11)' }}>
                  format yang diterima .csv saja, Max 1000 data.
                </span>
              </div>
            </div>
            {file && (
              <div className="mt-2 text-sm" style={{ color: 'var(--gray-11)' }}>
                File dipilih: <span style={{ color: 'var(--gray-12)' }}>{file.name}</span>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading} className="flex-1 h-10">
              Batal
            </Button>
            <Button type="submit" disabled={loading || !file} className="flex-1 h-10 flex items-center justify-center gap-2">
              {loading ? (<><Loader2 className="h-4 w-4 animate-spin" /> Mengimpor...</>) : (<><Upload className="h-4 w-4" /> Import CSV</>)}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  )
}
