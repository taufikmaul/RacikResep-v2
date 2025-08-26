'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import {
  LayoutDashboard,
  Package,
  ChefHat,
  Calculator,
  Settings,
  TrendingUp,
  LogOut,
  User as UserIcon,
} from 'lucide-react'
import {
  Sidebar as UISidebar,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar'
import { NavMain } from '@/components/nav-main'

type NavItem = {
  name: string
  href: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  children?: { name: string; href: string }[]
}

const navGroups: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard
  },
  {
    name: 'Bahan Baku',
    href: '/ingredients',
    icon: Package
  },
  {
    name: 'Resep',
    href: '/recipes',
    icon: ChefHat
  },
  {
    name: 'Simulasi',
    href: '/simulation',
    icon: Calculator
  },
  {
    name: 'Pengaturan',
    href: '/settings',
    icon: Settings
  },
]

export function AppSidebar() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [bizInfo, setBizInfo] = useState<{ name: string; address?: string; logo?: string } | null>(null)
  const { collapsed } = useSidebar()

  useEffect(() => {
    // Fetch business info to display in Informasi Aplikasi
    const loadBiz = async () => {
      try {
        const res = await fetch('/api/business/profile')
        if (res.ok) {
          const data = await res.json()
          setBizInfo({ name: data?.name ?? 'Bisnis', address: data?.address ?? '', logo: data?.logo })
        }
      } catch (_) {
        // Silent fail
      }
    }
    loadBiz()
  }, [])

  // Pathname available for potential future active states

  return (
    <UISidebar>
      <SidebarHeader>
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-md overflow-hidden flex items-center justify-center" style={{ background: 'var(--accent-3)', color: 'var(--accent-11)' }} aria-hidden>
            {bizInfo?.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={bizInfo.logo} alt="Logo" className="h-full w-full object-cover" />
            ) : (
              <span className="text-[10px] font-bold">RR</span>
            )}
          </div>
          {!collapsed && (
            <div>
              <h1 className="text-sm font-bold leading-none truncate" style={{ color: 'var(--gray-12)' }}>
                {bizInfo?.name ?? session?.user?.business?.name ?? 'RacikResep'}
              </h1>
              <p className="text-[10px]" style={{ color: 'var(--gray-11)' }}>
                COGS & Pricing
              </p>
            </div>
          )}
        </Link>
      </SidebarHeader>

      {(() => {
        const items = navGroups.map((g) => ({
          title: g.name,
          icon: g.icon as any,
          url: g.href,
          isActive: pathname === g.href || pathname.startsWith(g.href + '/'),
          items: (g.children ?? []).map((c) => ({ title: c.name, url: c.href })),
        }))
        return <NavMain items={items} />
      })()}

      <SidebarFooter>
        <div className="flex items-center gap-3">
          <div
            className="h-9 w-9 rounded-md flex items-center justify-center"
            style={{ background: 'var(--accent-3)', color: 'var(--accent-11)' }}
          >
            <UserIcon className="h-5 w-5" />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: 'var(--gray-12)' }}>
                {session?.user?.name ?? 'Pengguna'}
              </p>
              <p className="text-xs truncate" style={{ color: 'var(--gray-11)' }}>
                {session?.user?.email ?? ''}
              </p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={() => signOut()}
              className="ml-auto h-8 px-3 rounded-md text-sm"
              style={{ border: '1px solid var(--gray-6)', color: 'var(--gray-11)' }}
            >
              <LogOut className="h-4 w-4 inline mr-1" /> Keluar
            </button>
          )}
        </div>
      </SidebarFooter>
    </UISidebar>
  )
}
