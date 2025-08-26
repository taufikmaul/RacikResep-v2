'use client'

import { useSession, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { LogOut, User } from 'lucide-react'
import { ThemeToggle } from '@/components/ui/theme-toggle'

export function Header() {
  const { data: session } = useSession()

  return (
    <header className="px-6 py-4" style={{ background: "var(--color-panel-solid)", borderBottom: "1px solid var(--gray-6)" }}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: "var(--gray-12)" }}>
            {session?.user?.business?.name || 'RacikResep'}
          </h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <User className="h-4 w-4" style={{ color: "var(--gray-10)" }} />
            <span className="text-sm" style={{ color: "var(--gray-11)" }}>
              {session?.user?.name}
            </span>
          </div>
          
          <ThemeToggle />
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => signOut()}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  )
}
