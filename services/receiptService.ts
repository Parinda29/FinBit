import api from './api';
import { getAccessToken } from './authService';

const RECEIPTS_BASE_URL = `${api.host}/api/receipts`;
const TRANSACTIONS_BASE_URL = `${api.host}/api/transactions`;

export interface ReceiptFileInput {
  uri: string;
  name: string;
  type: string;
}

export type ReceiptCategory =
  | 'food'
  | 'bill'
  | 'transport'
  | 'shopping'
  | 'health'
  | 'entertainment'
  | 'others';

const inferMimeType = (fileName: string, fallback = 'application/octet-stream') => {
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.gif')) return 'image/gif';
  if (lower.endsWith('.heic')) return 'image/heic';
  if (lower.endsWith('.pdf')) return 'application/pdf';
  return fallback;
};

const normalizeReceiptFile = (file: ReceiptFileInput) => {
  const safeUri = (file.uri || '').trim();
  const uriLower = safeUri.toLowerCase();
  const guessedName = file.name?.trim() || `receipt-${Date.now()}`;
  const inferredType = file.type?.trim() || inferMimeType(guessedName, 'image/jpeg');

  let finalName = guessedName;
  if (!/\.[a-z0-9]+$/i.test(finalName)) {
    if (inferredType === 'application/pdf') finalName = `${finalName}.pdf`;
    else if (inferredType === 'image/png') finalName = `${finalName}.png`;
    else if (inferredType === 'image/webp') finalName = `${finalName}.webp`;
    else if (inferredType === 'image/gif') finalName = `${finalName}.gif`;
    else finalName = `${finalName}.jpg`;
  }

  const finalType = inferMimeType(finalName, inferredType);
  const normalizedUri = uriLower.startsWith('content://') || uriLower.startsWith('file://') ? safeUri : `file://${safeUri}`;

  return {
    uri: normalizedUri,
    name: finalName,
    type: finalType,
  };
};

export interface ReceiptItem {
  id: number;
  transaction: number;
  receipt_image?: string | null;
  receipt_image_url?: string | null;
  created_at: string;
  transaction_title?: string;
  transaction_category?: string;
  transaction_type?: 'income' | 'expense';
  transaction_amount?: string;
  transaction_date?: string;
}

export interface ReceiptCaptureItem {
  id: number;
  image?: string | null;
  image_url?: string | null;
  extracted_title?: string | null;
  transaction?: number | null;
  transaction_title?: string | null;
  source: 'camera' | 'upload';
  category: ReceiptCategory;
  ocr_amount?: string | null;
  ocr_text?: string | null;
  created_at: string;
}

const authHeaders = () => {
  const token = getAccessToken();
  return {
    Authorization: token ? `Token ${token}` : '',
  };
};

const parseBody = async (response: Response): Promise<any> => {
  const raw = await response.text();
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return { message: raw };
  }
};

const parseError = (payload: any, fallback: string): string => {
  if (!payload) return fallback;
  if (typeof payload.message === 'string' && payload.message.trim()) return payload.message;
  if (typeof payload.error === 'string' && payload.error.trim()) return payload.error;

  if (payload.error && typeof payload.error === 'object') {
    const [firstKey] = Object.keys(payload.error);
    const firstValue = payload.error[firstKey];
    if (Array.isArray(firstValue) && firstValue.length > 0) {
      return `${firstKey}: ${String(firstValue[0])}`;
    }
  }

  return fallback;
};

const normalizeDecimalString = (value?: string): string | null => {
  if (!value) return null;
  const cleaned = value.replace(/[^0-9.]/g, '');
  if (!cleaned) return null;

  const parts = cleaned.split('.');
  if (parts.length === 1) return parts[0];

  const intPart = parts.shift() || '0';
  const fracPart = parts.join('');
  return fracPart ? `${intPart}.${fracPart}` : intPart;
};

// Helper to convert URI-based file references to Blob for FormData
const buildReceiptFileBlob = async (file: ReceiptFileInput): Promise<Blob> => {
  const normalized = normalizeReceiptFile(file);
  try {
    const response = await fetch(normalized.uri);
    if (!response.ok) throw new Error(`Failed to fetch file: ${response.status}`);
    return await response.blob();
  } catch (error) {
    // If fetch fails, try creating a minimal blob - FormData might handle URI directly
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.warn('[buildReceiptFileBlob] Fetch failed:', errorMsg, '- attempting direct URI append');
    // Return the normalized object which FormData may handle as a file reference
    return normalized as any;
  }
};

export const listReceipts = async (): Promise<ReceiptItem[]> => {
  const response = await fetch(`${RECEIPTS_BASE_URL}/`, {
    headers: {
      ...authHeaders(),
    },
  });

  const payload = await parseBody(response);
  if (!response.ok || payload?.success === false) {
    throw new Error(parseError(payload, 'Failed to load receipts.'));
  }

  return Array.isArray(payload?.receipts) ? payload.receipts : [];
};

export const getReceiptByTransaction = async (transactionId: number): Promise<ReceiptItem | null> => {
  const response = await fetch(`${RECEIPTS_BASE_URL}/${transactionId}/`, {
    headers: {
      ...authHeaders(),
    },
  });

  if (response.status === 404) return null;

  const payload = await parseBody(response);
  if (!response.ok || payload?.success === false) {
    throw new Error(parseError(payload, 'Failed to fetch receipt.'));
  }

  return payload?.receipt || null;
};

export const createReceipt = async (
  transactionId: number,
  file: ReceiptFileInput
): Promise<ReceiptItem> => {
  const formData = new FormData();
    const normalized = normalizeReceiptFile(file);
    formData.append('receipt_image', normalized as any);

  const response = await fetch(`${RECEIPTS_BASE_URL}/${transactionId}/`, {
    method: 'POST',
    headers: {
      ...authHeaders(),
    },
    body: formData,
  });

  const payload = await parseBody(response);
  if (!response.ok || payload?.success === false) {
    throw new Error(parseError(payload, 'Failed to upload receipt.'));
  }

  return payload.receipt as ReceiptItem;
};

export const replaceReceipt = async (
  transactionId: number,
  file: ReceiptFileInput
): Promise<ReceiptItem> => {
  const formData = new FormData();
    const normalized = normalizeReceiptFile(file);
    formData.append('receipt_image', normalized as any);

  const response = await fetch(`${RECEIPTS_BASE_URL}/${transactionId}/`, {
    method: 'PUT',
    headers: {
      ...authHeaders(),
    },
    body: formData,
  });

  const payload = await parseBody(response);
  if (!response.ok || payload?.success === false) {
    throw new Error(parseError(payload, 'Failed to replace receipt.'));
  }

  return payload.receipt as ReceiptItem;
};

export const deleteReceipt = async (transactionId: number): Promise<void> => {
  const response = await fetch(`${RECEIPTS_BASE_URL}/${transactionId}/`, {
    method: 'DELETE',
    headers: {
      ...authHeaders(),
    },
  });

  if (response.status === 204) return;

  const payload = await parseBody(response);
  if (!response.ok || payload?.success === false) {
    throw new Error(parseError(payload, 'Failed to delete receipt.'));
  }
};

export const uploadOrReplaceReceipt = async (
  transactionId: number,
  file: ReceiptFileInput
): Promise<ReceiptItem> => {
  const uploadViaTransactionEndpoint = async (): Promise<ReceiptItem> => {
    const formData = new FormData();
    const normalized = normalizeReceiptFile(file);
    formData.append('receipt_image', normalized as any);

    const response = await fetch(`${TRANSACTIONS_BASE_URL}/${transactionId}/receipt/`, {
      method: 'POST',
      headers: {
        ...authHeaders(),
      },
      body: formData,
    });

    const payload = await parseBody(response);
    if (!response.ok || payload?.success === false) {
      throw new Error(parseError(payload, 'Failed to upload receipt.'));
    }

    return payload.receipt as ReceiptItem;
  };

  try {
    return await createReceipt(transactionId, file);
  } catch (error) {
    const message = error instanceof Error ? error.message.toLowerCase() : '';
    if (message.includes('already exists')) {
      try {
        return await replaceReceipt(transactionId, file);
      } catch {
        return uploadViaTransactionEndpoint();
      }
    }
    try {
      return await uploadViaTransactionEndpoint();
    } catch {
      throw error;
    }
  }
};

export const toReceiptPreviewUrl = (receipt: ReceiptItem): string | null => {
  const raw = receipt.receipt_image_url || receipt.receipt_image || null;
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  return `${api.host}${raw.startsWith('/') ? '' : '/'}${raw}`;
};

export const createReceiptCapture = async (
  file: ReceiptFileInput,
  source: 'camera' | 'upload',
  category: ReceiptCategory,
  extractedTitle?: string,
  transactionId?: number,
  ocrAmount?: string,
  ocrText?: string
): Promise<ReceiptCaptureItem> => {
  const formData = new FormData();
  const normalized = normalizeReceiptFile(file);
  formData.append('image', normalized as any);
  formData.append('source', source);
  formData.append('category', category);
  if (extractedTitle) formData.append('extracted_title', extractedTitle);
  if (typeof transactionId === 'number') {
    formData.append('transaction', String(transactionId));
  }
  const normalizedAmount = normalizeDecimalString(ocrAmount);
  if (normalizedAmount) formData.append('ocr_amount', normalizedAmount);
  if (ocrText) formData.append('ocr_text', ocrText);

  const response = await fetch(`${RECEIPTS_BASE_URL}/captures/`, {
    method: 'POST',
    headers: {
      ...authHeaders(),
    },
    body: formData,
  });

  const payload = await parseBody(response);
  if (!response.ok) {
    const serverError = parseError(payload, 'Failed to save receipt image.');
    throw new Error(serverError);
  }

  if (!payload?.capture) {
    console.warn('[createReceiptCapture] No capture in response. Payload:', payload);
    const serverError = parseError(payload, 'Failed to save receipt image.');
    throw new Error(serverError);
  }

  return payload.capture as ReceiptCaptureItem;
};

export const listReceiptCaptures = async (): Promise<ReceiptCaptureItem[]> => {
  const response = await fetch(`${RECEIPTS_BASE_URL}/captures/`, {
    headers: {
      ...authHeaders(),
    },
  });

  const payload = await parseBody(response);
  if (!response.ok || payload?.success === false) {
    throw new Error(parseError(payload, 'Failed to load receipt captures.'));
  }

  return Array.isArray(payload?.captures) ? payload.captures : [];
};

export const deleteReceiptCapture = async (captureId: number): Promise<void> => {
  const response = await fetch(`${RECEIPTS_BASE_URL}/captures/${captureId}/`, {
    method: 'DELETE',
    headers: {
      ...authHeaders(),
    },
  });

  if (response.status === 204) return;

  const payload = await parseBody(response);
  if (!response.ok || payload?.success === false) {
    throw new Error(parseError(payload, 'Failed to delete saved receipt.'));
  }
};

export const toReceiptCapturePreviewUrl = (capture: ReceiptCaptureItem): string | null => {
  const raw = capture.image_url || capture.image || null;
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  return `${api.host}${raw.startsWith('/') ? '' : '/'}${raw}`;
};
