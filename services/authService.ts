/**
 * Authentication Service - Template
 * Replace with your actual API endpoint and logic
 *
 * This is a template to show how to integrate with your backend.
 * Implement actual API calls, token management, and error handling.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthCredentials, RegisterData, AuthResponse, UserData } from '../types/auth';

import api from './api';

const ACCESS_TOKEN_KEY = 'auth_access_token';
const REFRESH_TOKEN_KEY = 'auth_refresh_token';

// In-memory cache backed by AsyncStorage.
let accessToken: string | null = null;
let refreshTokenValue: string | null = null;

const persistTokens = async () => {
  try {
    if (accessToken) await AsyncStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    else await AsyncStorage.removeItem(ACCESS_TOKEN_KEY);

    if (refreshTokenValue) await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshTokenValue);
    else await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.warn('Persist token error:', error);
  }
};

export const setTokens = (access: string, refresh?: string) => {
  accessToken = access;
  if (refresh !== undefined) refreshTokenValue = refresh;
  void persistTokens();
};

export const getAccessToken = () => accessToken;
export const getRefreshToken = () => refreshTokenValue;

export const getAccessTokenAsync = async (): Promise<string | null> => {
  if (accessToken) return accessToken;

  try {
    const stored = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    if (stored) {
      accessToken = stored;
      return stored;
    }
  } catch (error) {
    console.warn('Read access token error:', error);
  }

  return null;
};

export const getRefreshTokenAsync = async (): Promise<string | null> => {
  if (refreshTokenValue) return refreshTokenValue;

  try {
    const stored = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
    if (stored) {
      refreshTokenValue = stored;
      return stored;
    }
  } catch (error) {
    console.warn('Read refresh token error:', error);
  }

  return null;
};

const API_BASE_URL = api.base; // pointing at /api/users

const parseApiError = (payload: any, fallback: string): string => {
  if (!payload) return fallback;
  if (typeof payload.error === 'string' && payload.error.trim()) return payload.error;
  if (typeof payload.message === 'string' && payload.message.trim()) return payload.message;

  if (payload.errors && typeof payload.errors === 'object') {
    for (const key of Object.keys(payload.errors)) {
      const value = payload.errors[key];
      if (Array.isArray(value) && value.length > 0) {
        return `${key}: ${String(value[0])}`;
      }
      if (typeof value === 'string' && value.trim()) {
        return `${key}: ${value}`;
      }
    }
  }

  return fallback;
};

const parseResponseBody = async (response: Response): Promise<any> => {
  const raw = await response.text();
  if (!raw) return {};

  try {
    return JSON.parse(raw);
  } catch {
    return { message: raw };
  }
};

/**
 * Login user with email and password
 * @param credentials - Email and password
 * @returns Authentication response with user data and token
 */
export const loginUser = async (
  credentials: AuthCredentials
): Promise<AuthResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    const data = await parseResponseBody(response);

    if (!response.ok) {
      return {
        success: false,
        error: parseApiError(
          data,
          response.status >= 500
            ? 'Server error while logging in. Please check backend logs.'
            : 'Login failed. Please try again.'
        ),
      };
    }

    const access = data?.access || data?.token;
    const refresh = data?.refresh;

    if (!access || !data?.user) {
      return {
        success: false,
        error: 'Login response is missing required data. Please check backend response.',
      };
    }

    // save tokens in memory (replace with secure storage later)
    setTokens(access, refresh);
    // TODO: store tokens in AsyncStorage or secure store as needed

    return {
      success: true,
      user: data.user,
      accessToken: access,
      refreshToken: refresh,
      message: 'Login successful',
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      error: `Network error. Unable to reach ${api.host}.`,
    };
  }
};

/**
 * Register new user
 * @param data - User registration data
 * @returns Authentication response
 */
export const registerUser = async (
  data: RegisterData
): Promise<AuthResponse> => {
  try {
    const { confirmPassword, ...registerPayload } = data;

    const response = await fetch(`${API_BASE_URL}/register/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(registerPayload),
    });

    const responseData = await parseResponseBody(response);

    if (!response.ok) {
      return {
        success: false,
        error: parseApiError(
          responseData,
          response.status >= 500
            ? 'Server error while registering. Please check backend logs.'
            : 'Registration failed. Please try again.'
        ),
      };
    }

    const access = responseData?.access || responseData?.token;
    const refresh = responseData?.refresh;

    if (!access || !responseData?.user) {
      return {
        success: false,
        error: 'Registration succeeded but auth token was not returned by backend.',
      };
    }

    // save tokens in memory for immediate use
    setTokens(access, refresh);
    // TODO: persist securely (AsyncStorage, SecureStore, etc.)

    return {
      success: true,
      user: responseData.user,
      accessToken: access,
      refreshToken: refresh,
      message: 'Registration successful',
    };
  } catch (error) {
    console.error('Registration error:', error);
    return {
      success: false,
      error: `Network error. Unable to reach ${api.host}.`,
    };
  }
};

/**
 * Logout user and clear stored credentials
 */
export const logoutUser = async (): Promise<void> => {
  try {
    accessToken = null;
    refreshTokenValue = null;
    await AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY]);
    console.log('User logged out');
  } catch (error) {
    console.error('Logout error:', error);
  }
};

/**
 * Retrieve authenticated user's profile data.
 */
export const fetchUserProfile = async (): Promise<any> => {
  const token = await getAccessTokenAsync();
  const resp = await fetch(`${API_BASE_URL}/profile/`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: token ? `Token ${token}` : '',
    },
  });
  return resp.json();
};

/**
 * Update authenticated user's profile.
 */
export const updateUserProfile = async (data: Partial<UserData>): Promise<any> => {
  const token = await getAccessTokenAsync();
  const resp = await fetch(`${API_BASE_URL}/profile/`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: token ? `Token ${token}` : '',
    },
    body: JSON.stringify(data),
  });
  return resp.json();
};

/**
 * Check if user is authenticated
 * @returns Boolean indicating authentication status
 */
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const token = await getAccessTokenAsync();
    return !!token;
  } catch (error) {
    console.error('Auth check error:', error);
    return false;
  }
};

/**
 * Get stored user data
 * @returns User data or null
 */
export const getUserData = async (): Promise<UserData | null> => {
  try {
    // TODO: Retrieve cached user data from AsyncStorage or API
    // const userData = await AsyncStorage.getItem('userData');
    // return userData ? JSON.parse(userData) : null;
    return null;
  } catch (error) {
    console.error('Get user data error:', error);
    return null;
  }
};

/**
 * Refresh authentication token
 * @returns New authentication response
 */
export const refreshAuthToken = async (): Promise<AuthResponse> => {
  try {
    // TODO: Implement token refresh logic
    // const currentToken = await AsyncStorage.getItem('authToken');
    // const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${currentToken}`,
    //   },
    // });

    return {
      success: false,
      error: 'Token refresh not implemented',
    };
  } catch (error) {
    console.error('Token refresh error:', error);
    return {
      success: false,
      error: 'Failed to refresh token',
    };
  }
};

export default {
  loginUser,
  registerUser,
  logoutUser,
  isAuthenticated,
  getUserData,
  refreshAuthToken,
};
