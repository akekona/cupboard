import { cookies } from 'next/headers'
import { DashboardShell } from '@/components/layout/DashboardShell'
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
    <DashboardShell user={user}>
      {children}
    </DashboardShell>
  )
}
