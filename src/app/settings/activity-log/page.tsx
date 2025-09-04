'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  Calendar,
  Activity,
  ChevronLeft,
  ChevronRight,
  RefreshCw
} from 'lucide-react'

interface ActivityLog {
  id: string
  action: string
  description: string
  createdAt: string
}

interface Pagination {
  page: number
  limit: number
  totalCount: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

interface ActivityLogResponse {
  activities: ActivityLog[]
  pagination: Pagination
  filters: {
    actions: string[]
  }
}

export default function ActivityLogPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [activities, setActivities] = useState<ActivityLog[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [filters, setFilters] = useState<{ actions: string[] }>({ actions: [] })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedAction, setSelectedAction] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const fetchActivities = async (page = 1, search = '', action = '') => {
    if (!session) return

    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(search && { search }),
        ...(action && { action })
      })

      const response = await fetch(`/api/activity-log?${params}`)
      if (response.ok) {
        const data: ActivityLogResponse = await response.json()
        setActivities(data.activities)
        setPagination(data.pagination)
        setFilters(data.filters)
      }
    } catch (error) {
      console.error('Error fetching activities:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session) {
      fetchActivities(currentPage, searchTerm, selectedAction)
    }
  }, [session, currentPage, searchTerm, selectedAction])

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  const handleActionFilter = (value: string) => {
    setSelectedAction(value === 'all' ? '' : value)
    setCurrentPage(1)
  }

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getActionColor = (action: string) => {
    const colors: Record<string, string> = {
      create: 'bg-green-100 text-green-800',
      update: 'bg-blue-100 text-blue-800',
      delete: 'bg-red-100 text-red-800',
      import: 'bg-purple-100 text-purple-800',
      export: 'bg-orange-100 text-orange-800'
    }
    return colors[action.toLowerCase()] || 'bg-gray-100 text-gray-800'
  }

  if (loading && activities.length === 0) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
              className="flex items-center gap-1"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </Button>
            <h1 className="text-xl font-semibold">Log Aktivitas</h1>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchActivities(currentPage, searchTerm, selectedAction)}
            className="flex items-center gap-1"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Cari aktivitas..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedAction || 'all'} onValueChange={handleActionFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Semua aksi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua aksi</SelectItem>
              {filters.actions.map((action) => (
                <SelectItem key={action} value={action}>
                  {action.charAt(0).toUpperCase() + action.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Activity List */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Aktivitas</CardTitle>
              {pagination && (
                <span className="text-sm text-gray-500">
                  {pagination.totalCount} total
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {activities.length > 0 ? (
              <div className="space-y-2">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50">
                    <div className={`px-2 py-1 rounded text-xs font-medium ${getActionColor(activity.action)}`}>
                      {activity.action}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 truncate">
                        {activity.description}
                      </p>
                    </div>
                    <div className="text-xs text-gray-500 whitespace-nowrap">
                      {formatDate(activity.createdAt)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Activity className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-500">
                  {searchTerm || selectedAction 
                    ? 'Tidak ada aktivitas yang sesuai dengan filter.'
                    : 'Belum ada aktivitas.'
                  }
                </p>
              </div>
            )}

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-3 border-t">
                <div className="text-sm text-gray-500">
                  Halaman {pagination.page} dari {pagination.totalPages}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={!pagination.hasPrev}
                    className="h-8 px-3"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={!pagination.hasNext}
                    className="h-8 px-3"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
