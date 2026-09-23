export type DocumentType = 'V' | 'E' | 'J' | 'G' | 'P';

export type AccountType = 
  | 'Corriente'
  | 'Ahorro'
  | 'Moneda Extranjera / Dólares'
  | 'Custodia'
  | 'Zelle'
  | 'Internacional'
  | 'Otro';

export type ContactCategory = 
  | 'Proveedor'
  | 'Nómina / Empleado'
  | 'Cliente'
  | 'Socio / Directivo'
  | 'Servicios'
  | 'Personal'
  | 'Otro';

export interface BankAccount {
  id: string;
  contactId: string;
  accountNumber: string; // Typically 20 digits for VE or standard IBAN/account
  bankCode: string; // 4 digits e.g. "0102", "0174"
  bankName: string; // e.g. "BANPLUS", "Banco de Venezuela"
  accountType: AccountType;
  currency: 'VES' | 'USD' | 'EUR' | 'USDT';
  isDefault: boolean;
  hasMobilePayment: boolean;
  mobilePaymentPhone?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Contact {
  id: string;
  name: string; // Full legal name / Beneficiary (e.g. ROSANA BEATRIZ OROPEZA RUBIO)
  alias?: string; // Short name or familiar identifier (e.g. "rosana")
  documentType: DocumentType;
  documentNumber: string; // e.g. "23490380"
  email?: string; // e.g. "roropeza@allstarpublicidad.com"
  phone?: string;
  category: ContactCategory;
  company?: string;
  notes?: string;
  status: 'Activo' | 'Inactivo';
  accounts: BankAccount[];
  createdAt: string;
  updatedAt: string;
}

export interface BankInfo {
  code: string;
  name: string;
  shortName: string;
  color?: string;
  hasMobilePayment?: boolean;
}

export interface FilterState {
  searchQuery: string;
  bank: string;
  category: string;
  accountType: string;
  documentType: string;
  onlyMobilePayment: boolean;
  currency: string;
  sortBy: 'name_asc' | 'name_desc' | 'bank_asc' | 'updated_desc';
}
