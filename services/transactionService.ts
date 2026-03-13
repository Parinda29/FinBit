import api from './api';
import { getAccessToken } from './authService';

const BASE_URL = `${api.host}/api/transactions`;

interface TransactionData {
  title: string;
  category: string;
  description?: string;
  amount: number | string;
  type: 'income' | 'expense';
}

export const fetchTransactions = async (): Promise<any> => {
  const token = getAccessToken();
  const resp = await fetch(`${BASE_URL}/`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: token ? `Token ${token}` : '',
    },
  });
  return resp.json();
};

export const createTransaction = async (
  data: TransactionData
): Promise<any> => {
  const token = getAccessToken();
  const resp = await fetch(`${BASE_URL}/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: token ? `Token ${token}` : '',
    },
    body: JSON.stringify(data),
  });
  return resp.json();
};

export const getSummary = async (): Promise<any> => {
  const token = getAccessToken();
  const resp = await fetch(`${BASE_URL}/summary/`, {
    headers: {
      Authorization: token ? `Token ${token}` : '',
    },
  });
  return resp.json();
};
