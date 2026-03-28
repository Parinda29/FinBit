export type ParsedTransactionType = 'income' | 'expense';

export interface RawSmsMessage {
  _id?: string | number;
  thread_id?: string | number;
  address?: string;
  body?: string;
  date?: number | string;
  date_sent?: number | string;
}

export interface ParsedFinanceSms {
  id: string;
  sender: string;
  body: string;
  amount: number;
  date: Date;
  type: ParsedTransactionType;
  title: string;
  currencyCode: 'NPR' | 'INR' | 'RS';
  messageId?: string;
}

const FINANCE_KEYWORDS = [
  'credited',
  'debited',
  'withdrawn',
  'deposit',
  'txn',
  'transaction',
  'payment',
  'purchase',
  'spent',
  'received',
  'salary',
  'a/c',
  'bank',
  'wallet',
  'upi',
  'avl bal',
  'balance',
  'atm',
  'transfer',
  'sent',
  'dr',
  'cr',
];

const INCOME_HINTS = ['credited', 'deposit', 'salary', 'received', 'refund', 'cashback', 'cr'];
const EXPENSE_HINTS = [
  'debited',
  'withdrawn',
  'purchase',
  'payment',
  'spent',
  'dr',
  'sent',
  'charged',
  'bill',
  'emi',
];

const FALLBACK_TITLE = 'SMS Transaction';

export const isFinanceSms = (body: string): boolean => {
  const lowerBody = body.toLowerCase();
  const hasKeyword = FINANCE_KEYWORDS.some((word) => lowerBody.includes(word));
  const hasAmount = /(?:rs\.?|npr|inr)\s*[0-9][0-9,]*(?:\.[0-9]{1,2})?/i.test(body);
  return hasKeyword || hasAmount;
};

export const extractAmount = (body: string): number | null => {
  // Improved regex to handle multiple comma formats:
  // Standard: 5,250.00 or 5250.00
  // Indian: 1,23,456.78 (will normalize by removing all commas)
  const currencyAmountRegex = /(?:rs\.?|npr|inr)\s*([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)/i;
  const primaryMatch = body.match(currencyAmountRegex);

  if (primaryMatch?.[1]) {
    const raw = primaryMatch[1];
    // Normalize all comma formats by removing all commas
    const normalized = raw.replace(/,/g, '');
    // Ensure only valid decimal format remains
    if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) {
      return null;
    }
    const parsed = parseFloat(normalized);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }

  const fallbackAmountRegex = /(credited|debited|spent|received|paid)\s*(?:with|for|of)?\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)/i;
  const fallbackMatch = body.match(fallbackAmountRegex);
  if (fallbackMatch?.[2]) {
    const normalized = fallbackMatch[2].replace(/,/g, '');
    if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) {
      return null;
    }
    const parsed = parseFloat(normalized);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }

  return null;
};

export const extractSmsDate = (rawDate: number | string | undefined): Date => {
  if (typeof rawDate === 'number') {
    const date = new Date(rawDate);
    if (!Number.isNaN(date.getTime())) return date;
  }

  if (typeof rawDate === 'string') {
    const numericValue = Number(rawDate);
    if (!Number.isNaN(numericValue)) {
      const numericDate = new Date(numericValue);
      if (!Number.isNaN(numericDate.getTime())) return numericDate;
    }

    const parsed = new Date(rawDate);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  return new Date();
};

export const inferType = (body: string): ParsedTransactionType => {
  const lowerBody = body.toLowerCase();
  if (lowerBody.includes('refund') || lowerBody.includes('cashback')) return 'income';
  if (EXPENSE_HINTS.some((hint) => lowerBody.includes(hint))) return 'expense';
  if (INCOME_HINTS.some((hint) => lowerBody.includes(hint))) return 'income';
  return 'expense';
};

export const inferTitle = (body: string, sender: string): string => {
  const merchantPatterns = [
    /(?:at|to)\s+([a-z0-9&\-\. ]{3,40})/i,
    /(?:from)\s+([a-z0-9&\-\. ]{3,40})/i,
    /(?:merchant|vendor)\s*:?\s*([a-z0-9&\-\. ]{3,40})/i,
  ];

  for (const pattern of merchantPatterns) {
    const match = body.match(pattern);
    if (match?.[1]) {
      const cleaned = match[1]
        .replace(/\s+/g, ' ')
        .replace(/[^a-z0-9&\-\. ]/gi, '')
        .trim();
      if (cleaned.length >= 3) {
        return cleaned
          .split(' ')
          .filter(Boolean)
          .slice(0, 4)
          .join(' ');
      }
    }
  }

  if (sender) return sender;
  return FALLBACK_TITLE;
};

const inferCurrency = (body: string): 'NPR' | 'INR' | 'RS' => {
  const lower = body.toLowerCase();
  if (lower.includes('npr')) return 'NPR';
  if (lower.includes('inr')) return 'INR';
  return 'RS';
};

export const parseFinanceSms = (message: RawSmsMessage): ParsedFinanceSms | null => {
  const body = (message.body || '').trim();
  if (!body || !isFinanceSms(body)) return null;

  const amount = extractAmount(body);
  if (!amount || amount <= 0) return null;

  const sender = (message.address || 'Unknown').trim();
  const date = extractSmsDate(message.date || message.date_sent);
  const type = inferType(body);
  const title = inferTitle(body, sender);

  return {
    id: `${message._id || sender}-${date.getTime()}`,
    sender,
    body,
    amount,
    date,
    type,
    title,
    currencyCode: inferCurrency(body),
    messageId: message._id ? String(message._id) : undefined,
  };
};
