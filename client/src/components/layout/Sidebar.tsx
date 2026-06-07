'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Box, LayoutDashboard, ShoppingCart, Receipt, CreditCard,
  Truck, Coffee, BarChart2, Users, LogOut,
  ChevronLeft, ChevronRight, X,
} from 'lucide-react'
import { removeAuthCookie } from '@/lib/auth'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { AuthUser } from '@/types/auth'

type NavItem = {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  adminOnly?: boolean
}

const MAIN_NAV: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Orders',    href: '/dashboard/orders',   icon: ShoppingCart },
  { label: 'Invoices',  href: '/dashboard/invoices', icon: Receipt },
  { label: 'Payments',  href: '/dashboard/payments', icon: CreditCard },
]

const CATALOG_NAV: NavItem[] = [
  { label: 'Products',  href: '/dashboard/products',  icon: Box },
  { label: 'Suppliers', href: '/dashboard/suppliers', icon: Truck, adminOnly: true },
  { label: 'Clients',   href: '/dashboard/clients',   icon: Coffee },
]

const ADMIN_NAV: NavItem[] = [
  { label: 'Reports', href: '/dashboard/reports', icon: BarChart2 },
  { label: 'Users',   href: '/dashboard/users',   icon: Users },
]

interface Props {
  user: AuthUser | null
  mobileOpen: boolean
  onMobileClose: () => void
}

export default function Sidebar({ user, mobileOpen, onMobileClose }: Props) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('cupboard_sidebar_collapsed')
    if (stored === 'true') setCollapsed(true)
  }, [])

  // Close mobile sidebar on navigation
  useEffect(() => { onMobileClose() }, [pathname])

  function toggleCollapsed() {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem('cupboard_sidebar_collapsed', String(next))
  }

  const admin = user?.roles.includes('ADMIN') ?? false
  const firstName = user?.firstName ?? ''
  const lastName  = user?.lastName  ?? ''
  const initials  = [firstName[0], lastName[0]].filter(Boolean).join('').toUpperCase()
  const fullName  = [firstName, lastName].filter(Boolean).join(' ')
  const primaryRole = admin ? 'Admin' : user?.roles.includes('STAFF') ? 'Staff' : ''

  function isActive(href: string) {
    return href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href)
  }

  function NavLink({ item }: { item: NavItem }) {
    const Icon = item.icon
    const active = isActive(item.href)

    if (collapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Link
              href={item.href}
              className={cn(
                'flex items-center justify-center w-10 h-10 mx-auto rounded-lg transition-colors',
                active
                  ? 'bg-[#EAF3DE] text-[#3B6D11]'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
              )}
            >
              <Icon className="w-5 h-5" strokeWidth={1.75} />
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">{item.label}</TooltipContent>
        </Tooltip>
      )
    }

    return (
      <Link
        href={item.href}
        className={cn(
          'flex items-center gap-2.5 px-3 py-1.5 text-sm rounded-md border-l-[2px] transition-colors',
          active
            ? 'bg-[#EAF3DE] text-[#3B6D11] border-[#3B6D11] font-medium'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-transparent',
        )}
      >
        <Icon className="w-4 h-4 flex-shrink-0" strokeWidth={1.75} />
        {item.label}
      </Link>
    )
  }

  function NavSection({ title, items }: { title: string; items: NavItem[] }) {
    const visible = items.filter(item => !item.adminOnly || admin)
    if (!visible.length) return null
    return (
      <div>
        {!collapsed && (
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 mb-1">
            {title}
          </p>
        )}
        <div className="space-y-0.5">
          {visible.map(item => <NavLink key={item.href} item={item} />)}
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={cn(
          'flex flex-col bg-white border-r border-gray-200 flex-shrink-0 z-50',
          // Mobile: fixed overlay; desktop: static in flex layout
          'fixed md:static inset-y-0 left-0',
          // Width
          'w-[210px]',
          collapsed && 'md:w-16',
          // Mobile slide animation
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
          'transition-all duration-200',
          // Full height
          'h-screen',
        )}
      >
        {/* Logo area */}
        <div className={cn(
          'flex items-center gap-2 border-b border-gray-100 flex-shrink-0 px-4 py-5',
          collapsed ? 'flex-col justify-center' : 'justify-between',
        )}>
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 bg-[#3B6D11] rounded-md flex items-center justify-center flex-shrink-0">
              <Box className="w-4 h-4 text-white" strokeWidth={1.75} />
            </div>
            {!collapsed && (
              <span className="text-sm font-semibold text-gray-900 tracking-tight truncate">Cupboard</span>
            )}
          </div>

          {/* Desktop collapse toggle */}
          <button
            onClick={toggleCollapsed}
            className="hidden md:flex items-center justify-center w-6 h-6 rounded hover:bg-gray-100 flex-shrink-0 text-gray-400 hover:text-gray-600"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed
              ? <ChevronRight className="w-4 h-4" />
              : <ChevronLeft className="w-4 h-4" />}
          </button>

          {/* Mobile close button */}
          {!collapsed && (
            <button
              onClick={onMobileClose}
              className="md:hidden flex items-center justify-center w-6 h-6 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
              aria-label="Close sidebar"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Role label — expanded only */}
        {!collapsed && primaryRole && (
          <div className="px-7 pt-1 pb-0">
            <span className="text-xs text-gray-400">{primaryRole}</span>
          </div>
        )}

        {/* Nav */}
        <nav className={cn(
          'flex-1 overflow-y-auto py-4 space-y-5',
          collapsed ? 'px-1' : 'px-2',
        )}>
          <NavSection title="Main"    items={MAIN_NAV} />
          <NavSection title="Catalog" items={CATALOG_NAV} />
          {admin && <NavSection title="Admin" items={ADMIN_NAV} />}
        </nav>

        {/* User area */}
        <div className={cn(
          'border-t border-gray-100 flex-shrink-0',
          collapsed ? 'px-1 py-4 flex flex-col items-center gap-2' : 'px-4 py-4',
        )}>
          {collapsed ? (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => { removeAuthCookie(); window.location.href = '/login' }}
                  className="w-8 h-8 bg-[#3B6D11] rounded-full flex items-center justify-center flex-shrink-0 hover:opacity-80 transition-opacity"
                >
                  <span className="text-xs font-semibold text-white">{initials || '?'}</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">{fullName || user?.email || 'Account'}</TooltipContent>
            </Tooltip>
          ) : (
            <>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 bg-[#3B6D11] rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-semibold text-white">{initials || '?'}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-900 truncate">{fullName}</p>
                  <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                </div>
              </div>
              <button
                onClick={() => { removeAuthCookie(); window.location.href = '/login' }}
                className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-700 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign out
              </button>
            </>
          )}
        </div>
      </aside>
    </>
  )
}
