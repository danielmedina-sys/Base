import { Contact } from '../types';
import { INITIAL_CONTACTS } from '../data/initialData';

const STORAGE_KEY = 'bank_contacts_db_v1';

function sanitizeContacts(data: any[]): Contact[] {
  return data
    .filter((item): item is Contact => Boolean(item && typeof item === 'object'))
    .map((c) => ({
      id: String(c.id || `con-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`),
      name: String(c.name || 'TITULAR PENDIENTE'),
      alias: c.alias ? String(c.alias) : undefined,
      documentType: c.documentType || 'V',
      documentNumber: String(c.documentNumber || '0'),
      email: c.email ? String(c.email) : undefined,
      phone: c.phone ? String(c.phone) : undefined,
      category: c.category || 'Proveedor',
      status: c.status || 'Activo',
      notes: c.notes ? String(c.notes) : '',
      createdAt: c.createdAt || new Date().toISOString(),
      updatedAt: c.updatedAt || new Date().toISOString(),
      accounts: (Array.isArray(c.accounts) ? c.accounts : [])
        .filter((a: any) => Boolean(a && typeof a === 'object'))
        .map((a: any) => ({
          id: String(a.id || `acc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`),
          contactId: String(a.contactId || c.id || ''),
          accountNumber: String(a.accountNumber || ''),
          bankName: String(a.bankName || 'Banco no especificado'),
          bankCode: String(a.bankCode || ''),
          accountType: a.accountType || 'Corriente',
          currency: a.currency || 'VES',
          isDefault: Boolean(a.isDefault),
          hasMobilePayment: Boolean(a.hasMobilePayment),
          mobilePaymentPhone: a.mobilePaymentPhone ? String(a.mobilePaymentPhone) : undefined,
          notes: a.notes ? String(a.notes) : '',
          createdAt: a.createdAt || new Date().toISOString(),
          updatedAt: a.updatedAt || new Date().toISOString(),
        })),
    }));
}

export function loadContacts(): Contact[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveContacts(INITIAL_CONTACTS);
      return sanitizeContacts(INITIAL_CONTACTS);
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return sanitizeContacts(parsed);
    }
    return sanitizeContacts(INITIAL_CONTACTS);
  } catch (err) {
    console.error('Error loading contacts from localStorage:', err);
    return sanitizeContacts(INITIAL_CONTACTS);
  }
}

export function saveContacts(contacts: Contact[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
  } catch (err) {
    console.error('Error saving contacts to localStorage:', err);
  }
}

export function resetToDefaultData(): Contact[] {
  saveContacts(INITIAL_CONTACTS);
  return INITIAL_CONTACTS;
}
