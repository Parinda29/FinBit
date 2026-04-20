const DEFAULT_NETWORK_ERROR = 'The service is temporarily unavailable. Please try again in a moment.';

const NETWORK_ERROR_PATTERNS = [
  /err_ngrok_\d+/i,
  /endpoint .* is offline/i,
  /network request failed/i,
  /failed to fetch/i,
  /load failed/i,
  /could not connect/i,
  /unable to reach/i,
  /temporarily unavailable/i,
];

const shouldReplaceWithFriendlyMessage = (message: string) =>
  NETWORK_ERROR_PATTERNS.some((pattern) => pattern.test(message));

export const getFriendlyErrorMessage = (error: unknown, fallback = DEFAULT_NETWORK_ERROR): string => {
  const rawMessage =
    typeof error === 'string'
      ? error
      : error instanceof Error
        ? error.message
        : error && typeof error === 'object' && 'message' in error
          ? String((error as { message?: unknown }).message || '')
          : '';

  const message = rawMessage.trim();
  if (!message) return fallback;

  return shouldReplaceWithFriendlyMessage(message) ? fallback : message;
};
