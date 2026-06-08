export type AccountStatus = 'ACTIVE' | 'SUSPENDED' | 'INACTIVE'

export interface UserRole {
  id: number
  name: string
  description?: string
}

export interface User {
  id: number
  email: string
  firstName: string
  lastName: string
  avatarUrl?: string
  accountStatus: AccountStatus
  roles: UserRole[]
  createdAt: string
}

export interface CreateUserRequest {
  email: string
  firstName: string
  lastName: string
  password: string
  roleNames: string[]
}

export interface UpdateUserRequest {
  firstName?: string
  lastName?: string
  roleNames?: string[]
  accountStatus?: AccountStatus
}
