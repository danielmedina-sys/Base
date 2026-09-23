import { BankInfo } from '../types';

export const VENEZUELAN_BANKS: BankInfo[] = [
  { code: '0102', name: 'Banco de Venezuela', shortName: 'BDV', color: '#B91C1C', hasMobilePayment: true },
  { code: '0174', name: 'Banplus Banco Universal', shortName: 'Banplus', color: '#EA580C', hasMobilePayment: true },
  { code: '0134', name: 'Banesco Banco Universal', shortName: 'Banesco', color: '#15803D', hasMobilePayment: true },
  { code: '0105', name: 'Banco Mercantil', shortName: 'Mercantil', color: '#1D4ED8', hasMobilePayment: true },
  { code: '0108', name: 'BBVA Banco Provincial', shortName: 'Provincial', color: '#0369A1', hasMobilePayment: true },
  { code: '0172', name: 'Bancamiga Banco Universal', shortName: 'Bancamiga', color: '#047857', hasMobilePayment: true },
  { code: '0191', name: 'Banco Nacional de Crédito (BNC)', shortName: 'BNC', color: '#4338CA', hasMobilePayment: true },
  { code: '0114', name: 'Bancaribe', shortName: 'Bancaribe', color: '#0284C7', hasMobilePayment: true },
  { code: '0175', name: 'Banco Bicentenario', shortName: 'Bicentenario', color: '#BE123C', hasMobilePayment: true },
  { code: '0163', name: 'Banco del Tesoro', shortName: 'Tesoro', color: '#991B1B', hasMobilePayment: true },
  { code: '0104', name: 'Banco Venezolano de Crédito', shortName: 'BVC', color: '#0F766E', hasMobilePayment: true },
  { code: '0115', name: 'Banco Exterior', shortName: 'Exterior', color: '#B45309', hasMobilePayment: true },
  { code: '0151', name: 'BFC Banco Fondo Común', shortName: 'BFC', color: '#6D28D9', hasMobilePayment: true },
  { code: '0138', name: 'Banco Plaza', shortName: 'Plaza', color: '#0E7490', hasMobilePayment: true },
  { code: '0156', name: '100% Banco', shortName: '100% Banco', color: '#C2410C', hasMobilePayment: true },
  { code: '0157', name: 'DelSur Banco Universal', shortName: 'DelSur', color: '#1E40AF', hasMobilePayment: true },
  { code: '0171', name: 'Banco Activo', shortName: 'Activo', color: '#65A30D', hasMobilePayment: true },
  { code: '0177', name: 'BANFANB', shortName: 'BANFANB', color: '#166534', hasMobilePayment: true },
  { code: '0128', name: 'Banco Caroní', shortName: 'Caroní', color: '#374151', hasMobilePayment: true },
  { code: '0166', name: 'Banco Agrícola de Venezuela', shortName: 'Agrícola', color: '#15803D', hasMobilePayment: true },
  { code: '0168', name: 'Bancrecer', shortName: 'Bancrecer', color: '#D97706', hasMobilePayment: true },
  { code: '0169', name: 'Mi Banco', shortName: 'Mi Banco', color: '#7C3AED', hasMobilePayment: true },
  { code: '0137', name: 'Banco Sofitasa', shortName: 'Sofitasa', color: '#4B5563', hasMobilePayment: true },
];

export const OTHER_BANKS: BankInfo[] = [
  { code: 'ZELLE', name: 'Zelle (EE. UU.)', shortName: 'Zelle', color: '#7C3AED', hasMobilePayment: false },
  { code: 'BANESCO_PA', name: 'Banesco Panamá', shortName: 'Banesco PA', color: '#15803D', hasMobilePayment: false },
  { code: 'MERCANTIL_PA', name: 'Mercantil Banco Panamá', shortName: 'Mercantil PA', color: '#1D4ED8', hasMobilePayment: false },
  { code: 'CHASE', name: 'JPMorgan Chase Bank', shortName: 'Chase', color: '#1E40AF', hasMobilePayment: false },
  { code: 'BOA', name: 'Bank of America', shortName: 'BofA', color: '#DC2626', hasMobilePayment: false },
  { code: 'WELLS', name: 'Wells Fargo', shortName: 'Wells Fargo', color: '#B91C1C', hasMobilePayment: false },
  { code: 'PAYPAL', name: 'PayPal', shortName: 'PayPal', color: '#0284C7', hasMobilePayment: false },
  { code: 'BINANCE', name: 'Binance Pay / USDT', shortName: 'Binance', color: '#F59E0B', hasMobilePayment: false },
  { code: 'OTRO', name: 'Otro Banco / Internacional', shortName: 'Otro', color: '#475569', hasMobilePayment: false },
];

export const ALL_BANKS: BankInfo[] = [...VENEZUELAN_BANKS, ...OTHER_BANKS];

/**
 * Automatically recognizes the bank name from the first 4 digits of a 20-digit Venezuelan bank account number
 */
export function detectBankByAccountNumber(accountNumber?: string | null): BankInfo | null {
  if (!accountNumber) return null;
  const cleaned = String(accountNumber).replace(/\D/g, '');
  if (cleaned.length >= 4) {
    const code = cleaned.substring(0, 4);
    const found = VENEZUELAN_BANKS.find(b => b.code === code);
    if (found) return found;
  }
  return null;
}

/**
 * Finds bank info by code or name
 */
export function findBankByNameOrCode(term: string): BankInfo | undefined {
  if (!term) return undefined;
  const cleanTerm = term.trim().toLowerCase();
  return ALL_BANKS.find(
    b => b.code.toLowerCase() === cleanTerm ||
         b.name.toLowerCase().includes(cleanTerm) ||
         b.shortName.toLowerCase() === cleanTerm
  );
}
