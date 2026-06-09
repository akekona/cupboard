const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

export async function apiFetch(
  path: string,
  options?: RequestInit
): Promise<Response> {
  const token = document.cookie
    .split('; ')
    .find(row => row.startsWith('cupboard_token='))
    ?.split('=')[1]

  return fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  })
}
