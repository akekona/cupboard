export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  email: string
  firstName: string
  lastName: string
  roles: string[]
}

export interface AuthUser {
  email: string
  firstName: string
  lastName: string
  roles: string[]
}
