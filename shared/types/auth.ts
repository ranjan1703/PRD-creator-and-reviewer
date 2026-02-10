export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  token?: string;
  error?: string;
}

export interface Session {
  token: string;
  createdAt: string;
  expiresAt: string;
}

export interface ValidateResponse {
  valid: boolean;
  error?: string;
}
