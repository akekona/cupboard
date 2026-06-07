'use client'

import { Box, Menu } from 'lucide-react'
import type { AuthUser } from '@/types/auth'

interface Props {
  user: AuthUser | null
  onMenuClick: () => void
}

export function TopBar({ user, onMenuClick }: Props) {
  const firstName = user?.firstName ?? ''
  const lastName  = user?.lastName  ?? ''
  const initials  = [firstName[0], lastName[0]].filter(Boolean).join('').toUpperCase()

  return (
    <header className="md:hidden sticky top-0 z-30 h-14 bg-white border-b border-gray-200 flex items-center px-4 flex-shrink-0">
      <button
        onClick={onMenuClick}
        className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5 text-gray-600" />
      </button>

      <div className="flex-1 flex items-center justify-center gap-2">
        <div className="w-6 h-6 bg-[#3B6D11] rounded-md flex items-center justify-center">
          <Box className="w-3.5 h-3.5 text-white" strokeWidth={1.75} />
        </div>
        <span className="text-sm font-semibold text-gray-900 tracking-tight">Cupboard</span>
      </div>

      <div className="w-8 h-8 bg-[#3B6D11] rounded-full flex items-center justify-center flex-shrink-0">
        <span className="text-xs font-semibold text-white">{initials || '?'}</span>
      </div>
    </header>
  )
}
