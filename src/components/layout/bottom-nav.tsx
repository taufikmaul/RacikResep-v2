"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Package,
  ChefHat,
  Settings,
  Calculator,
} from "lucide-react"

const items = [
  { href: "/dashboard", label: "Home", Icon: LayoutDashboard },
  { href: "/ingredients", label: "Bahan", Icon: Package },
  { href: "/recipes", label: "Resep", Icon: ChefHat },
  { href: "/simulation", label: "Simulasi", Icon: Calculator },
  { href: "/settings", label: "Pengaturan", Icon: Settings },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Bottom navigation"
      className="sm:hidden fixed inset-x-0 bottom-0 z-50 pb-[env(safe-area-inset-bottom)]"
      style={{ background: "transparent" }}
    >
      <div
        className="mx-auto mb-3 max-w-md px-4"
      >
        <div
          className="w-full rounded-2xl shadow-lg backdrop-blur supports-[backdrop-filter]:bg-opacity-80"
          style={{ background: "var(--color-panel-translucent)", border: "1px solid var(--gray-6)" }}
        >
          <div className="relative grid grid-cols-5 gap-1 py-2">
            {items.map(({ href, label, Icon }) => {
              const active = pathname === href || pathname.startsWith(href + "/")
              return (
                <Link
                  href={href}
                  key={href}
                  className="flex flex-col items-center justify-center gap-1 py-2"
                  style={{ color: active ? "var(--accent-11)" : "var(--gray-11)" }}
                >
                  <Icon className="h-5 w-5" style={{ color: active ? "var(--accent-10)" : "var(--gray-10)" }} />
                  <span className="text-xs" style={{ color: active ? "var(--accent-10)" : "var(--gray-9)" }}>{label}</span>
                </Link>
              )
            })}
          </div>
          {/* subtle bottom bar to mimic screenshot */}
          <div className="px-8 pb-2">
            <div className="h-1 rounded-full" style={{ background: "var(--gray-7)" }} />
          </div>
        </div>
      </div>
    </nav>
  )
}
