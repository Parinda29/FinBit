import api from './api';
import { getAccessToken } from './authService';

const BASE_URL = `${api.host}/api/transactions`;
const BUDGETS_URL = `${api.host}/api/budgets`;
const NOTIFICATIONS_URL = `${api.host}/api/notifications`;

export interface TransactionData {
  title: string;
  category: string;
  description?: string;
  amount: number | string;
  type: 'income' | 'expense';
  source?: 'manual' | 'sms' | 'scanner';
  transaction_date?: string;
}

export interface TransactionItem {
  id: number;
  title: string;
  category: string;
  description?: string;
  amount: string;
  type: 'income' | 'expense';
  source?: 'manual' | 'sms' | 'scanner';
  has_receipt?: boolean;
  transaction_date?: string;
  created_at?: string;
}

export interface TransactionSummary {
  month: string;
  total_income: number;
  total_expense: number;
  net_balance: number;
}

export interface BudgetPayload {
  category: string;
  limit_amount: number | string;
  month: string;
}

export interface BudgetItem {
  id: number;
  category: string;
  limit_amount: string;
  month: string;
  month_label?: string;
  created_at?: string;
}

export interface BudgetStatus {
  month: string;
  days_remaining: number;
  total_budget: string;
  total_spent: string;
  total_remaining: string;
  usage_percent: number;
  exceeded_count: number;
  near_limit_count: number;
  alerts: string[];
  categories: Array<{
    id: number;
    category: string;
    icon: string;
    month: string;
    limit_amount: string;
    current_spent: string;
    remaining: string;
    usage_percent: number;
    near_limit: boolean;
    exceeded: boolean;
    alert_message: string;
  }>;
}

export interface AppNotification {
  type: string;
  title: string;
  message: string;
  month: string;
  created_at: string;
}

export interface OcrScanResult {
  title: string;
  amount: string;
  category: 'food' | 'bill' | 'others' | string;
  transaction_date?: string | null;
  description: string;
  ocr_text_preview?: string;
}

const authHeaders = () => {
  const token = getAccessToken();
  return {
    Authorization: token ? `Token ${token}` : '',
  };
};

const toNumber = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const normalizeTransactionList = (payload: any): TransactionItem[] => {
  if (!payload) return [];

  if (Array.isArray(payload)) return payload as TransactionItem[];

  if (Array.isArray(payload.results)) return payload.results as TransactionItem[];

  if (payload.results && Array.isArray(payload.results.results)) {
    return payload.results.results as TransactionItem[];
  }

  return [];
};

const parseSummary = (payload: any): TransactionSummary => {
  const summary = payload?.summary || payload || {};
  return {
    month: String(summary.month || ''),
    total_income: toNumber(summary.total_income),
    total_expense: toNumber(summary.total_expense),
    net_balance: toNumber(summary.net_balance),
  };
};

export const fetchTransactions = async (queryParams?: {
  type?: 'income' | 'expense';
  category?: string;
  pageSize?: number;
}): Promise<TransactionItem[]> => {
  const search = new URLSearchParams();
  if (queryParams?.type) search.set('type', queryParams.type);
  if (queryParams?.category) search.set('category', queryParams.category);
  search.set('page_size', String(queryParams?.pageSize ?? 200));

  const resp = await fetch(`${BASE_URL}/?${search.toString()}`, {
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
  });

  if (!resp.ok) {
    throw new Error('Failed to fetch transactions.');
  }

  const payload = await resp.json();
  return normalizeTransactionList(payload);
};

export const createTransaction = async (
  data: TransactionData
): Promise<TransactionItem> => {
  const resp = await fetch(`${BASE_URL}/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify(data),
  });

  const payload = await resp.json();
  if (!resp.ok || !payload?.success) {
    const message = payload?.message || 'Failed to create transaction.';
    throw new Error(message);
  }

  return payload.transaction as TransactionItem;
};

export const getSummary = async (): Promise<TransactionSummary> => {
  const resp = await fetch(`${BASE_URL}/summary/`, {
    headers: {
      ...authHeaders(),
    },
  });

  if (!resp.ok) {
    throw new Error('Failed to fetch summary.');
  }

  const payload = await resp.json();
  return parseSummary(payload);
};

export const getHomeDashboardData = async (): Promise<{
  summary: TransactionSummary;
  transactions: TransactionItem[];
}> => {
  const [summary, transactions] = await Promise.all([getSummary(), fetchTransactions()]);
  return { summary, transactions };
};

export const getBudget = async (): Promise<BudgetItem | null> => {
  const month = new Date().toISOString().slice(0, 7);
  const resp = await fetch(`${BUDGETS_URL}/?month=${month}`, {
    headers: {
      ...authHeaders(),
    },
  });

  if (!resp.ok) {
    throw new Error('Failed to fetch budget.');
  }

  const payload = await resp.json();
  const first = Array.isArray(payload?.budgets) ? payload.budgets[0] : null;
  return (first || null) as BudgetItem | null;
};

export const saveBudget = async (data: BudgetPayload): Promise<BudgetItem> => {
  const resp = await fetch(`${BUDGETS_URL}/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify(data),
  });

  const payload = await resp.json();
  if (!resp.ok || !payload?.success) {
    throw new Error(payload?.message || 'Failed to save budget.');
  }

  return payload.budget as BudgetItem;
};

export const fetchBudgets = async (month?: string): Promise<BudgetItem[]> => {
  const targetMonth = month || new Date().toISOString().slice(0, 7);
  const resp = await fetch(`${BUDGETS_URL}/?month=${targetMonth}`, {
    headers: {
      ...authHeaders(),
    },
  });

  if (!resp.ok) {
    throw new Error('Failed to fetch budgets.');
  }

  const payload = await resp.json();
  return Array.isArray(payload?.budgets) ? (payload.budgets as BudgetItem[]) : [];
};

export const updateBudget = async (
  budgetId: number,
  data: Partial<BudgetPayload>
): Promise<BudgetItem> => {
  const resp = await fetch(`${BUDGETS_URL}/${budgetId}/`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify(data),
  });

  const payload = await resp.json();
  if (!resp.ok || !payload?.success) {
    throw new Error(payload?.message || 'Failed to update budget.');
  }

  return payload.budget as BudgetItem;
};

export const deleteBudget = async (budgetId: number): Promise<void> => {
  const resp = await fetch(`${BUDGETS_URL}/${budgetId}/`, {
    method: 'DELETE',
    headers: {
      ...authHeaders(),
    },
  });

  if (resp.status === 204) return;
  const payload = await resp.json();
  if (!resp.ok || payload?.success === false) {
    throw new Error(payload?.message || 'Failed to delete budget.');
  }
};

export const getBudgetStatus = async (): Promise<BudgetStatus | null> => {
  const month = new Date().toISOString().slice(0, 7);
  const resp = await fetch(`${BUDGETS_URL}/summary/?month=${month}`, {
    headers: {
      ...authHeaders(),
    },
  });

  if (!resp.ok) {
    throw new Error('Failed to fetch budget status.');
  }

  const payload = await resp.json();
  return (payload?.summary || null) as BudgetStatus | null;
};

export const getBudgetSummary = async (month?: string): Promise<BudgetStatus> => {
  const targetMonth = month || new Date().toISOString().slice(0, 7);
  const resp = await fetch(`${BUDGETS_URL}/summary/?month=${targetMonth}`, {
    headers: {
      ...authHeaders(),
    },
  });

  if (!resp.ok) {
    throw new Error('Failed to fetch budget summary.');
  }

  const payload = await resp.json();
  if (!payload?.success || !payload?.summary) {
    throw new Error(payload?.message || 'Failed to fetch budget summary.');
  }

  return payload.summary as BudgetStatus;
};

export const getNotifications = async (month?: string): Promise<{
  unread_count: number;
  notifications: AppNotification[];
}> => {
  const targetMonth = month || new Date().toISOString().slice(0, 7);
  const resp = await fetch(`${NOTIFICATIONS_URL}/?month=${targetMonth}`, {
    headers: {
      ...authHeaders(),
    },
  });

  if (!resp.ok) {
    throw new Error('Failed to fetch notifications.');
  }

  const payload = await resp.json();
  return {
    unread_count: Number(payload?.unread_count || 0),
    notifications: Array.isArray(payload?.notifications)
      ? (payload.notifications as AppNotification[])
      : [],
  };
};

export const scanReceiptOcr = async (file: {
  uri: string;
  name: string;
  type: string;
}, titleHint?: string): Promise<OcrScanResult> => {
  const parsePayload = async (response: Response): Promise<any> => {
    const raw = await response.text();
    if (!raw) return {};
    try {
      return JSON.parse(raw);
    } catch {
      return { message: raw };
    }
  };

  const runRequest = async (): Promise<Response> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    try {
      return await fetch(`${BASE_URL}/scan-ocr/`, {
        method: 'POST',
        headers: {
          ...authHeaders(),
        },
        body: formData,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }
  };

  const formData = new FormData();
  formData.append('receipt_image', {
    uri: file.uri,
    type: file.type,
    name: file.name,
  } as any);

  if (titleHint?.trim()) {
    formData.append('title_hint', titleHint.trim());
  }

  let resp: Response;
  try {
    resp = await runRequest();
  } catch {
    // Retry once for transient network failures from large camera images.
    try {
      resp = await runRequest();
    } catch {
      throw new Error('Network issue during OCR scan. Ensure backend server is running and retry.');
    }
  }

  const payload = await parsePayload(resp);
  if (!resp.ok || !payload?.success) {
    throw new Error(payload?.message || 'OCR scan failed.');
  }

  return payload.result as OcrScanResult;
};
