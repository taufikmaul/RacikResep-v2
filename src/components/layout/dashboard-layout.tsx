'use client'

import { useSession } from 'next-auth/react'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { AppSidebar } from './sidebar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { HamburgerMenuIcon, Cross1Icon, ChevronRightIcon } from '@radix-ui/react-icons'
import { SidebarProvider } from '@/components/ui/sidebar'
import { BottomNav } from './bottom-nav'
import { ThemeToggle } from '@/components/ui/theme-toggle'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [biz, setBiz] = useState<{ name: string; logo?: string } | null>(null)

  useEffect(() => {
    if (status === 'loading') return // Still loading

    if (!session) {
      router.push('/auth/signin')
      return
    }
  }, [session, status, router])

  useEffect(() => {
    const loadBiz = async () => {
      try {
        const res = await fetch('/api/business/profile')
        if (res.ok) {
          const data = await res.json()
          setBiz({ name: data?.name ?? 'Bisnis', logo: data?.logo })
        }
      } catch {
        // ignore
      }
    }
    loadBiz()
  }, [])

  // Collapse sidebar by default on small screens for mobile-first UX
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isSmall = window.innerWidth < 640 // sm breakpoint
      if (isSmall) setCollapsed(true)
    }
  }, [])

  const breadcrumbs = useMemo(() => {
    if (!pathname) return [] as { label: string; href: string }[]
    const parts = pathname.split('/').filter(Boolean)
    const acc: { label: string; href: string }[] = []
    let current = ''
    for (const p of parts) {
      current += `/${p}`
      const label = p
        .split('-')
        .map(s => s.charAt(0).toUpperCase() + s.slice(1))
        .join(' ')
      acc.push({ label, href: current })
    }
    return acc
  }, [pathname])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-background)" }}>
        <div className="text-lg" style={{ color: "var(--gray-11)" }}>Loading...</div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <SidebarProvider collapsed={collapsed} onCollapsedChange={setCollapsed}>
      <div className="min-h-screen" style={{ background: "var(--color-background)" }}>
        <div className="flex h-screen overflow-hidden">
          <div className="hidden sm:block">
            <AppSidebar />
          </div>
          <div className="flex-1 flex flex-col h-screen overflow-hidden">
          {/* Top bar */}
          <div className="flex items-center gap-3 px-4 h-14 sm:h-12 border-b" style={{ borderColor: 'var(--gray-6)', background: 'var(--color-panel-solid)' }}>
            {/* Sidebar toggle only on desktop */}
            <button
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              onClick={() => setCollapsed(v => !v)}
              className="hidden sm:inline-flex h-8 w-8 items-center justify-center rounded-md"
              style={{ border: '1px solid var(--gray-6)', color: 'var(--gray-11)' }}
            >
              {collapsed ? <HamburgerMenuIcon className="h-4 w-4" /> : <Cross1Icon className="h-4 w-4" />}
            </button>

            {/* Mobile business info (logo, name, tagline) */}
            <div className="flex items-center gap-3 sm:hidden">
              <div className="h-9 w-9 rounded-lg overflow-hidden flex items-center justify-center shadow-sm" style={{ background: 'var(--accent-3)', color: 'var(--accent-11)' }} aria-hidden>
                {biz?.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={biz.logo} alt="Logo" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-[10px] font-bold">RR</span>
                )}
              </div>
              <div>
                <h1 className="text-base font-semibold leading-none truncate" style={{ color: 'var(--gray-12)' }}>
                  {biz?.name ?? 'RacikResep'}
                </h1>
                <p className="text-[10px]" style={{ color: 'var(--gray-11)' }}>COGS & Pricing</p>
              </div>
            </div>

            {/* Breadcrumbs */}
            <nav aria-label="Breadcrumb" className="hidden sm:flex items-center gap-2 truncate">
              {breadcrumbs.map((b, i) => (
                <div key={b.href} className="flex items-center gap-2">
                  {i > 0 && <ChevronRightIcon className="h-3.5 w-3.5" style={{ color: 'var(--gray-9)' }} />}
                  <span className={`text-sm ${i === breadcrumbs.length - 1 ? 'font-semibold' : ''}`} style={{ color: i === breadcrumbs.length - 1 ? 'var(--gray-12)' : 'var(--gray-11)' }}>
                    {b.label}
                  </span>
                </div>
              ))}
            </nav>

            {/* Theme Toggle */}
            <div className="ml-auto">
              <ThemeToggle />
            </div>
          </div>
            <ScrollArea className="flex-1" style={{ background: "var(--color-background)" }}>
              <div className="p-4 sm:p-6 pb-24 sm:pb-6">
                {children}
              </div>
            </ScrollArea>
          </div>
        </div>
        {/* Mobile bottom navigation */}
        <BottomNav />
      </div>
    </SidebarProvider>
  )
}
