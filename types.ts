export interface JournalEntry {
  id: string;
  date: string;
  description: string;
  debitAccount: string;
  creditAccount: string;
  amount: number;
  category: string;
}

export interface User {
  email: string;
  password?: string; // Optional for security when passing around
  name: string;
  role: string;
  university: string;
}

export enum AppState {
  AUTH = 'AUTH',
  COA_SETUP = 'COA_SETUP',
  DASHBOARD = 'DASHBOARD',
  INPUT = 'INPUT',
  RESULTS = 'RESULTS',
  GUIDE = 'GUIDE',
  ABOUT = 'ABOUT'
}

export interface Stats {
  totalRevenue: number;
  totalExpense: number;
  netIncome: number;
  transactionCount: number;
}