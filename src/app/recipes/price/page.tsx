'use client'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  DollarSign, 
  Store,
  ArrowRight
} from 'lucide-react'
import Link from 'next/link'

export default function PriceManagerPage() {
  return (
    <DashboardLayout>
      <div className="container mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2 text-blue-600">
            <DollarSign className="h-6 w-6" />
            <h1 className="text-3xl font-bold">Price Manager</h1>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Kelola harga jual resep dan channel penjualan
          </p>
        </div>

        {/* Price Manager Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Base Price Manager */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-xl">Base Price Manager</CardTitle>
                  <CardDescription>
                    Kelola harga jual dasar untuk setiap resep
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Atur harga jual dasar, hitung margin keuntungan, dan kelola riwayat perubahan harga untuk setiap resep.
              </p>
              <Link href="/price/price-manager">
                <Button className="w-full">
                  Buka Base Price Manager
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Channel Price Manager */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Store className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-xl">Channel Price Manager</CardTitle>
                  <CardDescription>
                    Kelola harga jual per saluran penjualan
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Atur harga khusus untuk setiap channel penjualan, hitung komisi, pajak, dan margin keuntungan.
              </p>
              <Link href="/price/channel-price-manager">
                <Button className="w-full">
                  Buka Channel Price Manager
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>Fitur Price Manager</CardTitle>
            <CardDescription>
              Kemampuan lengkap untuk mengelola harga dan keuntungan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900">Base Price Manager</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    Kelola harga jual dasar resep
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    Hitung margin keuntungan otomatis
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    Riwayat perubahan harga
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    Bulk price update
                  </li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900">Channel Price Manager</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Harga khusus per channel
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Kalkulasi komisi dan pajak
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Markup dan profit target
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Riwayat harga per channel
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
