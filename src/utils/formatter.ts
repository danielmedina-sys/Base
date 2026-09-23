import { BankAccount, Contact } from '../types';

/**
 * Formats a 20-digit bank account number into 4-4-2-10 blocks (e.g., 0102 0372 43 0000103334)
 */
export function formatAccountNumber(accountNumber?: string | number | null, separator: ' ' | '-' = ' '): string {
  if (!accountNumber) return '';
  const digits = String(accountNumber).replace(/\D/g, '');
  if (digits.length === 20) {
    return `${digits.slice(0, 4)}${separator}${digits.slice(4, 8)}${separator}${digits.slice(8, 10)}${separator}${digits.slice(10, 20)}`;
  }
  return String(accountNumber);
}

/**
 * Checks if a Venezuelan bank account number is valid (must be exactly 20 digits)
 */
export function isValidVeAccount(accountNumber?: string | number | null): { isValid: boolean; length: number; message: string } {
  if (!accountNumber) {
    return { isValid: false, length: 0, message: 'Número de cuenta requerido' };
  }
  const digits = String(accountNumber).replace(/\D/g, '');
  if (digits.length === 20) {
    return { isValid: true, length: 20, message: 'Número de cuenta válido (20 dígitos)' };
  }
  if (digits.length < 20) {
    return { isValid: false, length: digits.length, message: `Faltan ${20 - digits.length} dígitos (${digits.length}/20)` };
  }
  return { isValid: false, length: digits.length, message: `Excede los 20 dígitos (${digits.length}/20)` };
}

/**
 * Formats a document string (e.g. V23490380 -> V-23.490.380 or V-23490380)
 */
export function formatDocument(type?: string | null, number?: string | number | null, withDots = false): string {
  if (!number) return '';
  const safeType = type || 'V';
  const cleanNumber = String(number).replace(/[^\d]/g, '');
  if (withDots) {
    const formattedNum = cleanNumber.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `${safeType}-${formattedNum}`;
  }
  return `${safeType}-${cleanNumber}`;
}

/**
 * Formats a phone number for clean reading (e.g. 04141234567 -> 0414-1234567)
 */
export function formatPhone(phone?: string | number | null): string {
  if (!phone) return '';
  const clean = String(phone).replace(/[^\d+]/g, '');
  if (clean.length === 11 && clean.startsWith('0')) {
    return `${clean.slice(0, 4)}-${clean.slice(4)}`;
  }
  return clean;
}

/**
 * Generates a clean, copyable text summary for bank transfer
 */
export function generateTransferSummary(contact: Contact, account: BankAccount): string {
  const lines: string[] = [
    `*DATOS DE PAGO / TRANSFERENCIA*`,
    `Titular: ${contact.name}`,
  ];

  if (contact.alias && contact.alias.toLowerCase() !== contact.name.toLowerCase()) {
    lines.push(`Alias: ${contact.alias}`);
  }

  lines.push(`C.I. / RIF: ${contact.documentType}-${contact.documentNumber}`);
  lines.push(`Banco: ${account.bankName} (${account.bankCode})`);
  lines.push(`Cuenta: ${account.accountNumber}`);

  if (account.accountType) {
    lines.push(`Tipo: ${account.accountType}`);
  }

  if (account.hasMobilePayment || contact.phone) {
    const phone = account.mobilePaymentPhone || contact.phone;
    if (phone) {
      lines.push(`Pago Móvil: Sí (${formatPhone(phone)})`);
    }
  }

  if (contact.email) {
    lines.push(`Correo: ${contact.email}`);
  }

  if (account.notes || contact.notes) {
    const note = account.notes || contact.notes;
    lines.push(`Nota: ${note}`);
  }

  return lines.join('\n');
}

/**
 * Generates a clean text line for Pago Móvil
 */
export function generateMobilePaymentSummary(contact: Contact, account: BankAccount): string {
  const phone = account.mobilePaymentPhone || contact.phone || '';
  return `PAGO MÓVIL: ${account.bankName} (${account.bankCode}) | CI/RIF: ${contact.documentType}-${contact.documentNumber} | Telf: ${phone} | Titular: ${contact.name}`;
}
