'use client'

import { useState } from 'react'
import { TooltipProvider } from '@/components/ui/tooltip'
import Sidebar from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'
import type { AuthUser } from '@/types/auth'

interface Props {
  user: AuthUser | null
  children: React.ReactNode
}

export function DashboardShell({ user, children }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <TooltipProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar
          user={user}
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
        />
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <TopBar user={user} onMenuClick={() => setMobileOpen(true)} />
          <main className="flex-1 bg-gray-50 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </TooltipProvider>
  )
}
