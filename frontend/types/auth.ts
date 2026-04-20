/**
 * FinBit Authentication Types
 * Shared type definitions for the authentication system
 */

export interface UserData {
  id?: number | string;
  name: string;
  email: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends AuthCredentials {
  name: string;
  confirmPassword: string;
}

export interface AuthResponse {
  success: boolean;
  user?: UserData;
  // JWT tokens returned by the backend
  accessToken?: string;
  refreshToken?: string;
  message?: string;
  error?: string;
}

export interface AuthContextType {
  user: UserData | null;
  isLoading: boolean;
  isSignedIn: boolean;
  login: (credentials: AuthCredentials) => Promise<AuthResponse>;
  register: (data: RegisterData) => Promise<AuthResponse>;
  logout: () => Promise<void>;
}
