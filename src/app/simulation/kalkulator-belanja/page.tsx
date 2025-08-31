'use client'

import { useEffect, useMemo, useState } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { FormField } from '@/components/forms/FormField'
import { TextareaField } from '@/components/forms/TextareaField'
import { Calculator, ListChecks, ShoppingBasket, Save, Printer, FileSpreadsheet, Search, Plus, Trash2, FileDown } from 'lucide-react'
import toast from 'react-hot-toast'
import { useDecimalSettings } from '@/hooks/useDecimalSettings'
import { formatCurrency } from '@/lib/utils'

// Lightweight types to avoid tight coupling to backend shape
interface RecipeLite {
  id: string
  name: string
  ingredients?: Array<{
    id?: string
    ingredient?: { id: string; name: string }
    unit?: { id: string; name: string; symbol?: string }
    quantity?: number
  }>
}

interface PlanItem {
  id: string // recipe id or custom
  name: string
  portions: number
  unit: string // e.g., 'porsi'
  notes?: string
  // editable composition if recipe details cannot be fetched
  composition: Array<{
    id: string // ingredient id or custom key
    name: string
    qtyPerPortion: number
    usageUnit: string // e.g., 'ml', 'g', 'pcs'
    convToPurchase: number // e.g., 1000 ml per 1 galon
    purchaseUnit: string // e.g., 'galon', 'bag', 'pak'
    pricePerPurchase?: number // optional price per purchase package
  }>
}

export default function KalkulatorBelanjaPage() {
  const { settings: decimalSettings } = useDecimalSettings()
  const [search, setSearch] = useState('')
  const [recipes, setRecipes] = useState<RecipeLite[]>([])
  const [selected, setSelected] = useState<RecipeLite | null>(null)

  const [plan, setPlan] = useState<PlanItem[]>([])
  const [listName, setListName] = useState('')
  const [notes, setNotes] = useState('')

  // Load basic recipe list if available; graceful fallback if endpoint missing
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/recipes')
        if (res.ok) {
          const json = await res.json()
          const arr = Array.isArray(json) ? json : (json?.data ?? [])
          setRecipes(arr.map((r: any) => ({ id: r.id, name: r.name, ingredients: r.ingredients })))
        }
      } catch (_) {
        // ignore, user can add custom entries via manual button
      }
    }
    void load()
  }, [])

  const addSelectedToPlan = async () => {
    if (!selected) return
    await addRecipeToPlan(selected)
  }

  const addRecipeToPlan = async (recipe: RecipeLite) => {
    // Build composition from list payload (ingredients already included by /api/recipes)
    let composition: PlanItem['composition'] = []
    if (Array.isArray(recipe.ingredients)) {
      composition = recipe.ingredients.map((ri: any, idx: number) => ({
        id: ri.ingredient?.id ?? ri.id ?? `ing-${idx}`,
        name: ri.ingredient?.name ?? ri.name ?? `Bahan ${idx + 1}`,
        qtyPerPortion: Number(ri.quantity ?? 0),
        usageUnit: ri.unit?.symbol || ri.unit?.name || '',
        convToPurchase: 1,
        purchaseUnit: '',
        pricePerPurchase: undefined,
      }))
    }

    setPlan((prev) => [
      ...prev,
      {
        id: recipe.id,
        name: recipe.name,
        portions: 100,
        unit: 'porsi',
        notes: '',
        composition,
      },
    ])
    setSelected(null)

    // Enrich composition with ingredient purchase info in background
    if (Array.isArray(recipe.ingredients) && recipe.ingredients.length) {
      try {
        const ingIds: string[] = recipe.ingredients
          .map((ri: any) => ri.ingredient?.id)
          .filter(Boolean)
        if (ingIds.length) {
          const results = await Promise.allSettled(
            ingIds.map((id) => fetch(`/api/ingredients/${id}`))
          )
          const details: Record<string, any> = {}
          for (let i = 0; i < results.length; i++) {
            const r = results[i]
            const id = ingIds[i]
            if (r.status === 'fulfilled' && r.value.ok) {
              const data = await r.value.json()
              details[id] = data
            }
          }
          setPlan((prev) => prev.map((p) => {
            if (p.id !== recipe.id) return p
            return {
              ...p,
              composition: p.composition.map((c) => {
                const d = c.id ? details[c.id] : undefined
                if (!d) return c
                return {
                  ...c,
                  convToPurchase: Number(d.conversionFactor ?? c.convToPurchase ?? 1) || 1,
                  purchaseUnit:
                    typeof d.purchaseUnit === 'string'
                      ? d.purchaseUnit
                      : (d.purchaseUnit?.symbol || d.purchaseUnit?.name || c.purchaseUnit || ''),
                  pricePerPurchase: typeof d.purchasePrice === 'number' ? d.purchasePrice : c.pricePerPurchase,
                }
              })
            }
          }))
        }
      } catch (_) {
        // ignore enrichment failures
      }
    }
  }

  const addManualPlan = () => {
    const id = `custom-${Date.now()}`
    setPlan((p) => ([
      ...p,
      { id, name: 'Item Kustom', portions: 100, unit: 'porsi', notes: '', composition: [] },
    ]))
  }

  const removePlan = (id: string) => setPlan((p) => p.filter(i => i.id !== id))

  // Aggregations
  const needs = useMemo(() => {
    // Aggregate by ingredient name + usageUnit
    const map = new Map<string, { name: string; qty: number; unit: string; price?: number; conv?: number; purchaseUnit?: string }>()
    for (const item of plan) {
      for (const c of item.composition) {
        const key = `${c.name}__${c.usageUnit}`
        const addQty = (c.qtyPerPortion || 0) * (item.portions || 0)
        const prev = map.get(key)
        if (prev) {
          prev.qty += addQty
        } else {
          map.set(key, { name: c.name, qty: addQty, unit: c.usageUnit, price: c.pricePerPurchase, conv: c.convToPurchase, purchaseUnit: c.purchaseUnit })
        }
      }
    }
    return Array.from(map.values())
  }, [plan])

  const purchases = useMemo(() => {
    // Convert needs to purchase packages, using ceil(qty/conv)
    return needs.map((n) => {
      const conv = n.conv && n.conv > 0 ? n.conv : 1
      const pkg = Math.ceil((n.qty || 0) / conv)
      const price = n.price ? pkg * n.price : undefined
      return { name: n.name, packages: pkg, unit: n.purchaseUnit || '-', price }
    })
  }, [needs])

  const totalNeedsPrice = useMemo(() => needs.reduce((sum, n) => sum + (n.price || 0), 0), [needs])
  const totalPurchasePrice = useMemo(() => purchases.reduce((s, p) => s + (p.price || 0), 0), [purchases])

  const handleSaveLocal = () => {
    const payload = { name: listName, notes, plan, needs, purchases, savedAt: new Date().toISOString() }
    const key = 'racikresep_kalkulator_belanja'
    const prev = typeof window !== 'undefined' ? window.localStorage.getItem(key) : null
    const arr = prev ? JSON.parse(prev) as any[] : []
    arr.push(payload)
    if (typeof window !== 'undefined') window.localStorage.setItem(key, JSON.stringify(arr))
    toast.success('Daftar belanja disimpan (lokal)')
  }

  const handleExportCSV = () => {
    const rows: string[][] = []
    rows.push(['Nama daftar', listName])
    rows.push(['Catatan', notes])
    rows.push([])
    rows.push(['Daftar Belanja berdasarkan Kebutuhan'])
    rows.push(['Nama Bahan Baku', 'Jumlah', 'Satuan'])
    needs.forEach(n => rows.push([n.name, String(n.qty), n.unit]))
    rows.push([])
    rows.push(['Daftar Belanja berdasarkan Kemasan Pembelian'])
    rows.push(['Nama Bahan Baku', 'Jumlah', 'Satuan', 'Harga'])
    purchases.forEach(p => rows.push([p.name, String(p.packages), p.unit, p.price ? String(p.price) : '']))

    const csv = rows.map(r => r.map(v => /[",\n]/.test(String(v)) ? '"' + String(v).replace(/"/g, '""') + '"' : String(v)).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `kalkulator_belanja_${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('CSV diekspor')
  }

  const handleExportExcel = async () => {
    try {
      const XLSX = await import('xlsx')
      const needsSheet = XLSX.utils.aoa_to_sheet([
        ['Daftar Belanja berdasarkan Kebutuhan'],
        [],
        ['Nama Bahan Baku', 'Jumlah', 'Satuan'],
        ...needs.map(n => [n.name, n.qty, n.unit])
      ])
      const purchasesSheet = XLSX.utils.aoa_to_sheet([
        ['Daftar Belanja berdasarkan Kemasan Pembelian'],
        [],
        ['Nama Bahan Baku', 'Jumlah', 'Satuan', 'Harga'],
        ...purchases.map(p => [p.name, p.packages, p.unit, p.price ?? ''])
      ])
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, needsSheet, 'Kebutuhan')
      XLSX.utils.book_append_sheet(wb, purchasesSheet, 'Kemasan')
      XLSX.writeFile(wb, `kalkulator_belanja_${Date.now()}.xlsx`)
      toast.success('Excel diekspor')
    } catch (e) {
      console.error(e)
      toast.error('Gagal ekspor Excel. Pastikan dependensi terpasang.')
    }
  }

  const handleExportPDF = async () => {
    try {
      const jsPDF = (await import('jspdf')).default
      const doc = new jsPDF()
      let y = 10
      doc.setFontSize(14)
      doc.text('Kalkulator Belanja', 10, y)
      y += 8
      if (listName) { doc.setFontSize(11); doc.text(`Nama: ${listName}`, 10, y); y += 6 }
      if (notes) { const split = doc.splitTextToSize(`Catatan: ${notes}`, 180); doc.text(split, 10, y); y += split.length * 6 }
      y += 4
      doc.setFontSize(12)
      doc.text('Kebutuhan', 10, y); y += 6
      doc.setFontSize(10)
      needs.forEach((n, idx) => {
        if (y > 280) { doc.addPage(); y = 10 }
        doc.text(`${idx+1}. ${n.name} - ${n.qty} ${n.unit}`, 12, y)
        y += 5
      })
      y += 4
      doc.setFontSize(12)
      doc.text('Kemasan Pembelian', 10, y); y += 6
      doc.setFontSize(10)
      purchases.forEach((p, idx) => {
        if (y > 280) { doc.addPage(); y = 10 }
        const price = p.price ? ` - ${decimalSettings ? formatCurrency(p.price, decimalSettings) : `Rp ${p.price.toLocaleString('id-ID')}`}` : ''
        doc.text(`${idx+1}. ${p.name} - ${p.packages} ${p.unit}${price}`, 12, y)
        y += 5
      })
      doc.save(`kalkulator_belanja_${Date.now()}.pdf`)
      toast.success('PDF diekspor')
    } catch (e) {
      console.error(e)
      toast.error('Gagal ekspor PDF. Pastikan dependensi terpasang.')
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--gray-12)' }}>Kalkulator Belanja</h1>
          <p style={{ color: 'var(--gray-11)' }}>Rencanakan produksi dan dapatkan daftar belanja otomatis</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* 1. Pilih Menu */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Search className="h-5 w-5" /> 1. Pilih Menu</CardTitle>
              <CardDescription>Double klik untuk memilih</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative mb-3">
                <Input placeholder="Masukkan kata kunci" value={search} onChange={(e)=>setSearch(e.target.value)} />
              </div>
              <div className="border rounded-md max-h-72 overflow-auto">
                {recipes.filter(r=>r.name.toLowerCase().includes(search.toLowerCase())).map((r, i) => (
                  <button
                    key={r.id}
                    onDoubleClick={() => addRecipeToPlan(r)}
                    onClick={() => setSelected(r)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-gray-50 ${selected?.id === r.id ? 'bg-blue-50' : ''}`}
                  >
                    <span>{i+1}. {r.name}</span>
                  </button>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <Button variant="outline" size="sm" onClick={addSelectedToPlan} disabled={!selected}><Plus className="h-4 w-4 mr-1" /> Tambah ke Rencana</Button>
                <Button variant="outline" size="sm" onClick={addManualPlan}><Plus className="h-4 w-4 mr-1" /> Entri Manual</Button>
              </div>
            </CardContent>
          </Card>

          {/* 2. Tentukan Rencana Produksi & Komposisi */}
          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ListChecks className="h-5 w-5" /> 2. Tentukan Rencana Jumlah Produksi</CardTitle>
            </CardHeader>
            <CardContent>
              {plan.length === 0 ? (
                <p className="text-sm" style={{ color: 'var(--gray-11)' }}>Belum ada item. Pilih menu lalu tambah ke rencana.</p>
              ) : (
                <div className="space-y-4">
                  {plan.map((item, idx) => (
                    <div key={item.id} className="border rounded-md p-3">
                      <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
                        <FormField label="Nama item" required>
                          <Input value={item.name} onChange={(e)=>setPlan(p=>p.map(x=>x.id===item.id?{...x,name:e.target.value}:x))} />
                        </FormField>
                        <FormField label="Rencana produksi" required>
                          <div className="flex gap-2">
                            <Input type="number" value={item.portions.toString()} onChange={(e)=>setPlan(p=>p.map(x=>x.id===item.id?{...x,portions: Number(e.target.value)||0}:x))} />
                            <Input value={item.unit} onChange={(e)=>setPlan(p=>p.map(x=>x.id===item.id?{...x,unit:e.target.value}:x))} />
                          </div>
                        </FormField>
                        <FormField label="Catatan">
                          <Input value={item.notes||''} onChange={(e)=>setPlan(p=>p.map(x=>x.id===item.id?{...x,notes:e.target.value}:x))} />
                        </FormField>
                        <div className="md:col-span-1 flex justify-end">
                          <Button variant="destructive" onClick={()=>removePlan(item.id)}><Trash2 className="h-4 w-4 mr-1" /> Hapus</Button>
                        </div>
                      </div>

                      {/* Komposisi */}
                      <div className="mt-3">
                        <h4 className="text-sm font-medium mb-2" style={{ color: 'var(--gray-12)' }}>Komposisi (per 1 {item.unit})</h4>
                        <div className="overflow-auto">
                          <table className="w-full text-sm border">
                            <thead>
                              <tr className="bg-gray-50">
                                <th className="p-2 text-left">Nama Bahan</th>
                                <th className="p-2 text-left">Pemakaian</th>
                                <th className="p-2 text-left">Satuan</th>
                                <th className="p-2 text-left">Konversi ke Kemasan</th>
                                <th className="p-2 text-left">Satuan Kemasan</th>
                                <th className="p-2 text-left">Harga/Kemasan (Rp)</th>
                                <th className="p-2"></th>
                              </tr>
                            </thead>
                            <tbody>
                              {item.composition.map((c, cidx) => (
                                <tr key={c.id} className="border-t">
                                  <td className="p-2"><Input value={c.name} onChange={(e)=>{
                                    const v = e.target.value; setPlan(p=>p.map(x=>x.id===item.id?{...x,composition:x.composition.map((y,i)=>i===cidx?{...y,name:v}:y)}:x))
                                  }} /></td>
                                  <td className="p-2"><Input type="number" value={c.qtyPerPortion.toString()} onChange={(e)=>{
                                    const v = Number(e.target.value)||0; setPlan(p=>p.map(x=>x.id===item.id?{...x,composition:x.composition.map((y,i)=>i===cidx?{...y,qtyPerPortion:v}:y)}:x))
                                  }} /></td>
                                  <td className="p-2"><Input value={c.usageUnit} onChange={(e)=>{
                                    const v = e.target.value; setPlan(p=>p.map(x=>x.id===item.id?{...x,composition:x.composition.map((y,i)=>i===cidx?{...y,usageUnit:v}:y)}:x))
                                  }} /></td>
                                  <td className="p-2"><Input type="number" value={c.convToPurchase.toString()} onChange={(e)=>{
                                    const v = Number(e.target.value)||1; setPlan(p=>p.map(x=>x.id===item.id?{...x,composition:x.composition.map((y,i)=>i===cidx?{...y,convToPurchase:v}:y)}:x))
                                  }} /></td>
                                  <td className="p-2"><Input value={c.purchaseUnit} onChange={(e)=>{
                                    const v = e.target.value; setPlan(p=>p.map(x=>x.id===item.id?{...x,composition:x.composition.map((y,i)=>i===cidx?{...y,purchaseUnit:v}:y)}:x))
                                  }} /></td>
                                  <td className="p-2"><Input type="number" value={c.pricePerPurchase?.toString() ?? ''} onChange={(e)=>{
                                    const v = e.target.value === '' ? undefined : (Number(e.target.value)||0); setPlan(p=>p.map(x=>x.id===item.id?{...x,composition:x.composition.map((y,i)=>i===cidx?{...y,pricePerPurchase:v}:y)}:x))
                                  }} /></td>
                                  <td className="p-2 text-right"><Button variant="outline" size="sm" onClick={()=>{
                                    setPlan(p=>p.map(x=>x.id===item.id?{...x,composition:x.composition.filter((_,i)=>i!==cidx)}:x))
                                  }}><Trash2 className="h-4 w-4" /></Button></td>
                                </tr>
                              ))}
                              <tr>
                                <td colSpan={7} className="p-2 text-right">
                                  <Button size="sm" variant="outline" onClick={()=>{
                                    setPlan(p=>p.map(x=>x.id===item.id?{...x,composition:[...x.composition,{id:`new-${Date.now()}`,name:'',qtyPerPortion:0,usageUnit:'',convToPurchase:1,purchaseUnit:'',pricePerPurchase:undefined}]}:x))
                                  }}><Plus className="h-4 w-4 mr-1" /> Tambah Bahan</Button>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Hasil: Kebutuhan vs Kemasan Pembelian */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Daftar Belanja berdasarkan Kebutuhan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto">
                <table className="w-full text-sm border">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="p-2 text-left">No</th>
                      <th className="p-2 text-left">Nama Bahan Baku</th>
                      <th className="p-2 text-left">Jumlah</th>
                      <th className="p-2 text-left">Satuan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {needs.map((n, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="p-2">{idx + 1}</td>
                        <td className="p-2">{n.name}</td>
                        <td className="p-2">{n.qty.toLocaleString('id-ID')}</td>
                        <td className="p-2">{n.unit}</td>
                      </tr>
                    ))}
                    {needs.length === 0 && (
                      <tr><td colSpan={4} className="p-4 text-center" style={{ color: 'var(--gray-11)' }}>Belum ada komposisi.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Daftar Belanja berdasarkan Kemasan Pembelian</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto">
                <table className="w-full text-sm border">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="p-2 text-left">No</th>
                      <th className="p-2 text-left">Nama Bahan Baku</th>
                      <th className="p-2 text-left">Jumlah</th>
                      <th className="p-2 text-left">Satuan</th>
                      <th className="p-2 text-left">Harga</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchases.map((p, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="p-2">{idx + 1}</td>
                        <td className="p-2">{p.name}</td>
                        <td className="p-2">{p.packages.toLocaleString('id-ID')}</td>
                        <td className="p-2">{p.unit}</td>
                        <td className="p-2">{p.price ? (decimalSettings ? formatCurrency(p.price, decimalSettings) : `Rp ${p.price.toLocaleString('id-ID')}`) : '-'}</td>
                      </tr>
                    ))}
                    {purchases.length === 0 && (
                      <tr><td colSpan={5} className="p-4 text-center" style={{ color: 'var(--gray-11)' }}>Belum ada komposisi.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Simpan & Ekspor */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ShoppingBasket className="h-5 w-5" /> 3. Simpan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField label="Nama daftar belanja">
                <Input value={listName} onChange={(e)=>setListName(e.target.value)} placeholder="Contoh: Belanja Minggu 1" />
              </FormField>
              <div className="md:col-span-2">
                <TextareaField label="Catatan" value={notes} onChange={(e)=>setNotes(e)} rows={3} />
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              <Button onClick={handleSaveLocal} className="bg-blue-600 hover:bg-blue-700 text-white"><Save className="h-4 w-4 mr-1" /> Simpan</Button>
              <Button onClick={handleExportCSV} variant="outline"><FileSpreadsheet className="h-4 w-4 mr-1" /> CSV</Button>
              <Button onClick={handleExportExcel} variant="outline"><FileSpreadsheet className="h-4 w-4 mr-1" /> Excel</Button>
              <Button onClick={handleExportPDF} variant="outline"><FileDown className="h-4 w-4 mr-1" /> PDF</Button>
              <Button onClick={()=>window.print()} variant="outline"><Printer className="h-4 w-4 mr-1" /> Print</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
