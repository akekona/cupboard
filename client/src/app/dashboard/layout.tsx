import { cookies } from 'next/headers'
import Sidebar from '@/components/dashboard/sidebar'
import type { AuthUser } from '@/types/auth'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const token = cookieStore.get('cupboard_token')?.value

  let user: AuthUser | null = null
  if (token) {
    try {
      const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
      const payload = JSON.parse(Buffer.from(base64, 'base64').toString('utf-8'))
      user = {
        email: payload.sub ?? '',
        firstName: payload.firstName ?? '',
        lastName: payload.lastName ?? '',
        roles: Array.isArray(payload.roles) ? payload.roles : [],
      }
    } catch {}
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar user={user} />
      <main className="flex-1 bg-gray-50 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
