import { api } from '@/lib/api'
import type { User, CreateUserRequest, UpdateUserRequest } from '@/types/users'

interface ApiResponse<T> {
  success: boolean
  data: T
  message: string | null
}

async function unwrap<T>(p: Promise<ApiResponse<T>>): Promise<T> {
  const res = await p
  if (!res.success) throw new Error(res.message ?? 'Request failed')
  return res.data
}

export const getUsers     = ()                              => unwrap(api.get<ApiResponse<User[]>>('/api/users'))
export const getUserById  = (id: number)                   => unwrap(api.get<ApiResponse<User>>(`/api/users/${id}`))
export const createUser   = (data: CreateUserRequest)      => unwrap(api.post<ApiResponse<User>>('/api/users', data as never))
export const updateUser   = (id: number, data: UpdateUserRequest) => unwrap(api.put<ApiResponse<User>>(`/api/users/${id}`, data as never))
export const deactivateUser = (id: number)                 => unwrap(api.patch<ApiResponse<User>>(`/api/users/${id}/deactivate`, {}))
export const reactivateUser = (id: number)                 => unwrap(api.patch<ApiResponse<User>>(`/api/users/${id}/reactivate`, {}))
