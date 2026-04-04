const configuredApiHost = (process.env.EXPO_PUBLIC_API_HOST || '').trim();
const API_HOST = configuredApiHost.replace(/\/$/, '');

if (!API_HOST) {
  console.warn('EXPO_PUBLIC_API_HOST is missing. Run backend/start_ngrok_demo.ps1 to auto-sync ngrok URL.');
}

export const API_BASE_URL = `${API_HOST}/api/users`;

export default {
  host: API_HOST,
  base: API_BASE_URL,
};
