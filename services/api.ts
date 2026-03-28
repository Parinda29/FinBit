import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

const API_PORT = '8000';

const extractHost = (value?: string | null): string | null => {
  if (!value) return null;

  const normalized = value
    .replace(/^exp:\/\//, 'http://')
    .replace(/^exps:\/\//, 'https://');

  try {
    const url = new URL(normalized);
    return url.hostname || null;
  } catch {
    const match = normalized.match(/^(?:[a-z]+:\/\/)?([^/:]+)/i);
    return match?.[1] || null;
  }
};

const isLoopbackHost = (host: string) =>
  host === 'localhost' || host === '127.0.0.1' || host === '10.0.2.2';

const getExpoLanHost = (): string | null => {
  const hostCandidates = [
    extractHost(Linking.createURL('/')),
    extractHost((Constants.expoConfig as { hostUri?: string } | null)?.hostUri),
    extractHost((Constants as { linkingUri?: string | null }).linkingUri),
  ];

  return hostCandidates.find((host): host is string => !!host && !isLoopbackHost(host)) || null;
};

const getDefaultApiHost = () => {
  if (Platform.OS === 'web') {
    return `http://127.0.0.1:${API_PORT}`;
  }

  const expoLanHost = getExpoLanHost();
  if (expoLanHost) {
    return `http://${expoLanHost}:${API_PORT}`;
  }

  return Platform.OS === 'android'
    ? `http://10.0.2.2:${API_PORT}`
    : `http://127.0.0.1:${API_PORT}`;
};

const configuredApiHost = (process.env.EXPO_PUBLIC_API_HOST || '').trim();
const shouldAutoDetectApiHost =
  !configuredApiHost || configuredApiHost.toLowerCase() === 'auto';

const API_HOST = (shouldAutoDetectApiHost ? getDefaultApiHost() : configuredApiHost).replace(/\/$/, '');

export const API_BASE_URL = `${API_HOST}/api/users`;

export default {
  host: API_HOST,
  base: API_BASE_URL,
};
