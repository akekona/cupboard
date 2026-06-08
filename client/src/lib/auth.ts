import { AuthUser } from '@/types/auth'

const COOKIE_NAME = 'cupboard_token'

export function setAuthCookie(token: string): void {
  const maxAge = 60 * 60 * 24
  document.cookie = `${COOKIE_NAME}=${token}; path=/; max-age=${maxAge}; SameSite=Strict`
}

export function getAuthCookie(): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

export function removeAuthCookie(): void {
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0`
}

export function getAuthUser(): AuthUser | null {
  const token = getAuthCookie()
  if (!token) return null
  try {
    // JWT uses base64url — replace chars before decoding
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const payload = JSON.parse(atob(base64))
    return {
      email: payload.sub ?? '',
      firstName: payload.firstName ?? '',
      lastName: payload.lastName ?? '',
      roles: Array.isArray(payload.roles) ? payload.roles : [],
    }
  } catch {
    return null
  }
}

export function isAdmin(user: AuthUser): boolean {
  return user.roles.includes('ADMIN')
}

export function isStaff(user: AuthUser): boolean {
  return user.roles.includes('STAFF')
}

export function redirectUnauthorized(router: { push: (url: string) => void }): void {
  router.push('/unauthorized')
}
