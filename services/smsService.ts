import { PermissionsAndroid, Platform, Linking, Alert } from 'react-native';
import SmsAndroid from 'react-native-get-sms-android';
import api from './api';
import { getAccessToken } from './authService';
import { ParsedFinanceSms, RawSmsMessage, parseFinanceSms } from './smsParser';

export type SmsPermissionState = 'granted' | 'denied' | 'unsupported';
export type StatementProvider = 'esewa' | 'khalti' | 'bank' | 'other';

export interface SmsImportDraft {
  amount: number;
  date: Date;
  title: string;
  category: string;
  type: 'income' | 'expense';
  description: string;
}

export interface StatementPdfImportResult {
  createdCount: number;
  transactionIds: number[];
  provider: StatementProvider;
}

interface ApiResponse {
  success?: boolean;
  transaction?: {
    id: number;
    title: string;
    category: string;
    description?: string;
    amount: string;
    type: 'income' | 'expense';
    source?: string;
    transaction_date?: string;
  };
  error?: string | Record<string, unknown>;
  message?: string;
}

interface SmsFilter {
  box: 'inbox';
  maxCount: number;
  indexFrom: number;
}

const TRANSACTION_BASE_URL = `${api.host}/api/transactions`;

const parseResponseBody = async (response: Response): Promise<any> => {
  const raw = await response.text();
  if (!raw) return {};

  try {
    return JSON.parse(raw);
  } catch {
    return { message: raw };
  }
};

const parseApiError = (payload: any, fallback: string): string => {
  if (!payload) return fallback;
  if (typeof payload.message === 'string' && payload.message.trim()) return payload.message;
  if (typeof payload.error === 'string' && payload.error.trim()) return payload.error;

  // DRF may return field errors directly at the root level: { amount: ["..."] }
  if (typeof payload === 'object' && !Array.isArray(payload)) {
    for (const [key, value] of Object.entries(payload)) {
      if (Array.isArray(value) && value.length > 0) {
        return `${key}: ${String(value[0])}`;
      }
      if (typeof value === 'string' && value.trim()) {
        return `${key}: ${value}`;
      }
    }
  }

  if (payload.error && typeof payload.error === 'object') {
    const firstKey = Object.keys(payload.error)[0];
    const firstValue = payload.error[firstKey];
    if (Array.isArray(firstValue) && firstValue.length > 0) {
      return `${firstKey}: ${String(firstValue[0])}`;
    }
    if (typeof firstValue === 'string' && firstValue.trim()) {
      return `${firstKey}: ${firstValue}`;
    }
  }

  return fallback;
};

const normalizeSmsList = (rawList: string): RawSmsMessage[] => {
  try {
    const parsed = JSON.parse(rawList);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const toSafeIso = (value: Date): string => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString();
  }
  return parsed.toISOString();
};

const listInboxMessages = (maxCount: number): Promise<RawSmsMessage[]> => {
  const filter: SmsFilter = {
    box: 'inbox',
    indexFrom: 0,
    maxCount,
  };

  return new Promise((resolve, reject) => {
    SmsAndroid.list(
      JSON.stringify(filter),
      (fail: string) => reject(new Error(fail)),
      (_count: number, smsList: string) => resolve(normalizeSmsList(smsList))
    );
  });
};

export const requestSmsPermission = async (): Promise<SmsPermissionState> => {
  if (Platform.OS !== 'android') return 'unsupported';

  try {
    // Check if permission is already granted
    const checkResult = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_SMS);
    if (checkResult) {
      console.log('[SMS] Permission already granted');
      return 'granted';
    }

    console.log('[SMS] Requesting READ_SMS permission...');
    const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_SMS, {
      title: 'FinBit Needs SMS Access',
      message:
        'FinBit reads SMS from your inbox to help you import expenses and income quickly.\n\nYour SMS data stays private and is only used locally.',
      buttonNegative: 'Deny',
      buttonPositive: 'Allow',
      buttonNeutral: 'Ask Later',
    });

    console.log(`[SMS] Permission result: ${result}`);
    if (result === PermissionsAndroid.RESULTS.GRANTED) {
      return 'granted';
    }

    if (result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
      Alert.alert(
        'SMS Permission Blocked',
        'SMS permission is blocked on this device. Open app settings and enable SMS permission for FinBit.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Open Settings',
            onPress: () => {
              Linking.openSettings().catch(() => {
                // No-op: screen also offers a settings button fallback.
              });
            },
          },
        ]
      );
    }

    return 'denied';
  } catch (error) {
    console.error('[SMS] Permission request error:', error);
    return 'denied';
  }
};

export const scanFinanceSms = async (maxCount = 150): Promise<ParsedFinanceSms[]> => {
  if (Platform.OS !== 'android') return [];

  const inboxMessages = await listInboxMessages(maxCount);
  return inboxMessages
    .map((message) => parseFinanceSms(message))
    .filter((item): item is ParsedFinanceSms => !!item)
    .sort((a, b) => b.date.getTime() - a.date.getTime());
};

export const createDraftFromParsedSms = (
  parsedSms: ParsedFinanceSms,
  fallbackCategory = 'SMS Import'
): SmsImportDraft => ({
  amount: parsedSms.amount,
  date: parsedSms.date,
  title: parsedSms.title,
  category: fallbackCategory,
  type: parsedSms.type,
  description: parsedSms.body,
});

export const importSmsAsTransaction = async (
  parsedSms: ParsedFinanceSms,
  draft: SmsImportDraft
): Promise<{ transactionId: number }> => {
  const token = getAccessToken();
  if (!token) {
    throw new Error('You are not logged in. Please login again and retry import.');
  }

  const payload = {
    title: String(draft.title || 'SMS Transaction').trim().slice(0, 255),
    category: String(draft.category || 'SMS Import').trim().slice(0, 100),
    description: draft.description,
    amount: Number(draft.amount),
    type: draft.type,
    source: 'sms',
    transaction_date: toSafeIso(draft.date),
  };

  const response = await fetch(`${TRANSACTION_BASE_URL}/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Token ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const json = (await parseResponseBody(response)) as ApiResponse;

  if (!response.ok || !json.success || !json.transaction?.id) {
    throw new Error(
      parseApiError(json, 'Could not create transaction from SMS. Please verify fields and try again.')
    );
  }

  try {
    await saveSmsMetadata(json.transaction.id, parsedSms, token);
  } catch (metadataError) {
    // Do not fail the import if transaction itself is created successfully.
    console.warn('[SMS] Transaction created but metadata save failed:', metadataError);
  }

  return { transactionId: json.transaction.id };
};

export const importStatementPdfFile = async (
  fileUri: string,
  fileName: string,
  mimeType: string,
  provider: StatementProvider
): Promise<StatementPdfImportResult> => {
  const token = getAccessToken();
  if (!token) {
    throw new Error('You are not logged in. Please login again and retry import.');
  }

  const formData = new FormData();
  formData.append('provider', provider);
  formData.append('statement_file', {
    uri: fileUri,
    name: fileName,
    type: mimeType || 'application/pdf',
  } as any);

  const response = await fetch(`${TRANSACTION_BASE_URL}/import-statement/`, {
    method: 'POST',
    headers: {
      Authorization: `Token ${token}`,
    },
    body: formData,
  });

  const json = await parseResponseBody(response);
  if (!response.ok || !json?.success) {
    throw new Error(parseApiError(json, 'Could not import statement PDF.'));
  }

  const transactionIds = Array.isArray(json.transactions)
    ? json.transactions.map((item: { id?: number }) => item.id).filter((id: unknown): id is number => typeof id === 'number')
    : [];

  return {
    createdCount: typeof json.created_count === 'number' ? json.created_count : transactionIds.length,
    transactionIds,
    provider,
  };
};

const saveSmsMetadata = async (
  transactionId: number,
  parsedSms: ParsedFinanceSms,
  token: string
): Promise<void> => {
  const safeSender = String(parsedSms.sender || 'Unknown').trim().slice(0, 120);

  const response = await fetch(`${TRANSACTION_BASE_URL}/${transactionId}/sms/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Token ${token}`,
    },
    body: JSON.stringify({
      message: parsedSms.body,
      sender: safeSender,
      sms_timestamp: toSafeIso(parsedSms.date),
    }),
  });

  const json = await parseResponseBody(response);
  if (!response.ok || json?.success === false) {
    throw new Error(parseApiError(json, 'Transaction was created but SMS metadata save failed.'));
  }
};
