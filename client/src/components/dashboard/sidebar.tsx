'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Box,
  LayoutDashboard,
  ShoppingCart,
  Receipt,
  CreditCard,
  Truck,
  Coffee,
  BarChart2,
  Users,
  LogOut,
} from 'lucide-react'
import { removeAuthCookie } from '@/lib/auth'
import type { AuthUser } from '@/types/auth'
import { cn } from '@/lib/utils'

type NavItem = {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  adminOnly?: boolean
}

const MAIN_NAV: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Orders', href: '/dashboard/orders', icon: ShoppingCart },
  { label: 'Invoices', href: '/dashboard/invoices', icon: Receipt },
  { label: 'Payments', href: '/dashboard/payments', icon: CreditCard },
]

const CATALOG_NAV: NavItem[] = [
  { label: 'Products', href: '/dashboard/products', icon: Box },
  { label: 'Suppliers', href: '/dashboard/suppliers', icon: Truck, adminOnly: true },
  { label: 'Clients', href: '/dashboard/clients', icon: Coffee },
]

const ADMIN_NAV: NavItem[] = [
  { label: 'Reports', href: '/dashboard/reports', icon: BarChart2 },
  { label: 'Users', href: '/dashboard/users', icon: Users },
]

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const active =
    item.href === '/dashboard'
      ? pathname === '/dashboard'
      : pathname.startsWith(item.href)
  const Icon = item.icon

  return (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-2.5 px-3 py-1.5 text-sm rounded-md border-l-[2px] transition-colors',
        active
          ? 'bg-[#EAF3DE] text-[#3B6D11] border-[#3B6D11] font-medium'
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-transparent'
      )}
    >
      <Icon className="w-4 h-4 flex-shrink-0" strokeWidth={1.75} />
      {item.label}
    </Link>
  )
}

function NavSection({ title, items, admin }: { title: string; items: NavItem[]; admin: boolean }) {
  const visible = items.filter(item => !item.adminOnly || admin)
  if (!visible.length) return null

  return (
    <div>
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 mb-1">
        {title}
      </p>
      <div className="space-y-0.5">
        {visible.map(item => (
          <NavLinkWrapper key={item.href} item={item} />
        ))}
      </div>
    </div>
  )
}

// Wrapper to avoid calling usePathname in NavSection
function NavLinkWrapper({ item }: { item: NavItem }) {
  const pathname = usePathname()
  return <NavLink item={item} pathname={pathname} />
}

export default function Sidebar({ user }: { user: AuthUser | null }) {
  const router = useRouter()
  const admin = user?.roles.includes('ADMIN') ?? false

  const primaryRole = admin ? 'Admin' : user?.roles.includes('STAFF') ? 'Staff' : ''
  const firstName = user?.firstName ?? ''
  const lastName = user?.lastName ?? ''
  const fullName = [firstName, lastName].filter(Boolean).join(' ')
  const initials = [firstName[0], lastName[0]].filter(Boolean).join('').toUpperCase()

  function handleLogout() {
    removeAuthCookie()
    window.location.href = '/login'
  }

  return (
    <aside className="w-[210px] flex flex-col h-full bg-white border-r border-gray-200 flex-shrink-0">

      {/* Logo + role */}
      <div className="px-4 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-[#3B6D11] rounded-md flex items-center justify-center flex-shrink-0">
            <Box className="w-4 h-4 text-white" strokeWidth={1.75} />
          </div>
          <span className="text-sm font-semibold text-gray-900 tracking-tight">Cupboard</span>
        </div>
        {primaryRole && (
          <p className="text-xs text-gray-400 mt-1 pl-9">{primaryRole}</p>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-5">
        <NavSection title="Main" items={MAIN_NAV} admin={admin} />
        <NavSection title="Catalog" items={CATALOG_NAV} admin={admin} />
        {admin && <NavSection title="Admin" items={ADMIN_NAV} admin={admin} />}
      </nav>

      {/* User + logout */}
      <div className="border-t border-gray-100 px-4 py-4">
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
          onClick={handleLogout}
          className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-700 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign out
        </button>
      </div>

    </aside>
  )
}
