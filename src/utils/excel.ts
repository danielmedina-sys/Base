import * as XLSX from 'xlsx';
import { Contact, BankAccount, DocumentType, AccountType, ContactCategory } from '../types';
import { detectBankByAccountNumber, findBankByNameOrCode } from '../data/banks';

export interface FlattenedAccountRow {
  contactId: string;
  accountId: string;
  accountNumber: string;
  bankName: string;
  bankCode: string;
  name: string;
  alias: string;
  documentType: DocumentType;
  documentNumber: string;
  documentFull: string;
  email: string;
  phone: string;
  accountType: AccountType;
  currency: string;
  hasMobilePayment: boolean;
  category: ContactCategory;
  notes: string;
  status: string;
  updatedAt: string;
}

export function flattenContactsToRows(contacts: Contact[]): FlattenedAccountRow[] {
  const rows: FlattenedAccountRow[] = [];
  if (!Array.isArray(contacts)) return rows;

  for (const contact of contacts) {
    if (!contact) continue;
    if (!contact.accounts || contact.accounts.length === 0) {
      // Accountless contact
      rows.push({
        contactId: contact.id || '',
        accountId: `acc-dummy-${contact.id || Math.random()}`,
        accountNumber: 'Sin cuenta registrada',
        bankName: 'N/A',
        bankCode: '----',
        name: contact.name || 'TITULAR PENDIENTE',
        alias: contact.alias || '',
        documentType: contact.documentType || 'V',
        documentNumber: contact.documentNumber || '',
        documentFull: `${contact.documentType || 'V'}-${contact.documentNumber || ''}`,
        email: contact.email || '',
        phone: contact.phone || '',
        accountType: 'Otro',
        currency: 'VES',
        hasMobilePayment: false,
        category: contact.category || 'Proveedor',
        notes: contact.notes || '',
        status: contact.status || 'Activo',
        updatedAt: contact.updatedAt || contact.createdAt || new Date().toISOString(),
      });
    } else {
      for (const acc of contact.accounts) {
        if (!acc) continue;
        rows.push({
          contactId: contact.id || '',
          accountId: acc.id || '',
          accountNumber: String(acc.accountNumber || ''),
          bankName: String(acc.bankName || 'Banco no especificado'),
          bankCode: String(acc.bankCode || ''),
          name: contact.name || 'TITULAR PENDIENTE',
          alias: contact.alias || '',
          documentType: contact.documentType || 'V',
          documentNumber: contact.documentNumber || '',
          documentFull: `${contact.documentType || 'V'}-${contact.documentNumber || ''}`,
          email: contact.email || '',
          phone: acc.mobilePaymentPhone || contact.phone || '',
          accountType: acc.accountType || 'Corriente',
          currency: acc.currency || 'VES',
          hasMobilePayment: Boolean(acc.hasMobilePayment),
          category: contact.category || 'Proveedor',
          notes: acc.notes || contact.notes || '',
          status: contact.status || 'Activo',
          updatedAt: acc.updatedAt || contact.updatedAt || new Date().toISOString(),
        });
      }
    }
  }
  return rows;
}

/**
 * Export data to a styled Excel (.xlsx) file
 */
export function exportToExcel(contacts: Contact[], filename = 'base_cuentas_bancarias.xlsx') {
  const rows = flattenContactsToRows(contacts);

  const excelData = rows.map((r, index) => ({
    'N°': index + 1,
    'Número de Cuenta': `'${r.accountNumber}`, // Prepend apostrophe so Excel keeps leading zero and avoids scientific notation
    'Titular / Beneficiario': r.name,
    'Alias / Nombre Corto': r.alias,
    'Banco': r.bankName,
    'Código Banco': r.bankCode,
    'C.I. / RIF': r.documentFull,
    'Teléfono / Contacto': r.phone,
    'Pago Móvil': r.hasMobilePayment ? 'Sí' : 'No',
    'Correo Electrónico': r.email,
    'Tipo de Cuenta': r.accountType,
    'Moneda': r.currency,
    'Categoría': r.category,
    'Notas / Observaciones': r.notes,
  }));

  const worksheet = XLSX.utils.json_to_sheet(excelData);

  // Set column widths for optimal reading
  worksheet['!cols'] = [
    { wch: 5 },  // N°
    { wch: 25 }, // Cuenta
    { wch: 32 }, // Titular
    { wch: 18 }, // Alias
    { wch: 24 }, // Banco
    { wch: 14 }, // Codigo
    { wch: 16 }, // Documento
    { wch: 16 }, // Telefono
    { wch: 12 }, // Pago Movil
    { wch: 30 }, // Correo
    { wch: 18 }, // Tipo Cuenta
    { wch: 10 }, // Moneda
    { wch: 18 }, // Categoria
    { wch: 30 }, // Notas
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Cuentas y Contactos');
  XLSX.writeFile(workbook, filename);
}

/**
 * Export data to clean UTF-8 CSV
 */
export function exportToCsv(contacts: Contact[], filename = 'base_cuentas_bancarias.csv') {
  const rows = flattenContactsToRows(contacts);
  const headers = [
    'Numero_Cuenta',
    'Titular',
    'Alias',
    'Banco',
    'Codigo_Banco',
    'Documento',
    'Telefono',
    'Pago_Movil',
    'Correo',
    'Tipo_Cuenta',
    'Moneda',
    'Categoria',
    'Notas',
  ];

  const csvRows = [headers.join(',')];

  for (const r of rows) {
    const values = [
      `"${String(r.accountNumber || '')}"`,
      `"${String(r.name || '').replace(/"/g, '""')}"`,
      `"${String(r.alias || '').replace(/"/g, '""')}"`,
      `"${String(r.bankName || '').replace(/"/g, '""')}"`,
      `"${String(r.bankCode || '')}"`,
      `"${String(r.documentFull || '')}"`,
      `"${String(r.phone || '')}"`,
      `"${r.hasMobilePayment ? 'SI' : 'NO'}"`,
      `"${String(r.email || '')}"`,
      `"${String(r.accountType || '')}"`,
      `"${String(r.currency || '')}"`,
      `"${String(r.category || '')}"`,
      `"${String(r.notes || '').replace(/"/g, '""')}"`,
    ];
    csvRows.push(values.join(','));
  }

  const csvContent = '\uFEFF' + csvRows.join('\n'); // UTF-8 BOM
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Heuristically parses an array of raw row items into contact and bank account records.
 * Perfectly handles formats like the user's Excel sample:
 * Row: `01020372430000103334,,,23490380,,roropeza@allstarpublicidad.com`
 * Row: `01740149131494043803,ROSANA BEATRIZ OROPEZA RUBIO,BANPLUS,23490380,,`
 */
export function parseRawRowData(rawRows: (string | number)[][]): Contact[] {
  const existingContactsMap = new Map<string, Contact>();
  const parsedContacts: Contact[] = [];

  for (const row of rawRows) {
    if (!row || row.length === 0) continue;

    // Convert row items to clean strings
    const cells = row.map(c => (c !== null && c !== undefined ? String(c).trim() : ''));

    // Check if entire row is empty or header junk
    const nonEmptyCells = cells.filter(c => c.length > 0);
    if (nonEmptyCells.length === 0) continue;

    // Skip obvious header rows like ["Cuenta", "Titular", ...] or search rows like [",rosana,🔎,,,"]
    const rowJoin = cells.join(' ').toLowerCase();
    if (
      (rowJoin.includes('cuenta') && rowJoin.includes('banco')) ||
      (rowJoin.includes('titular') && rowJoin.includes('documento')) ||
      (rowJoin.includes('🔎') && nonEmptyCells.length <= 2)
    ) {
      continue;
    }

    let accountNumber = '';
    let bankName = '';
    let bankCode = '';
    let name = '';
    let alias = '';
    let docType: DocumentType = 'V';
    let docNumber = '';
    let email = '';
    let phone = '';

    // If cells match exact positions of the user's Excel:
    // col 0: Account number
    // col 1: Beneficiary / Titular
    // col 2: Bank name
    // col 3: ID / Document
    // col 4: Phone
    // col 5: Email
    const firstCell = String(cells[0] || '');
    if (cells.length >= 4 && firstCell.replace(/\D/g, '').length >= 15) {
      accountNumber = firstCell.replace(/\s+/g, '');
      name = cells[1] || '';
      bankName = cells[2] || '';
      const rawDoc = String(cells[3] || '');
      phone = cells[4] || '';
      email = cells[5] || '';

      // Parse document type & number
      if (rawDoc) {
        const match = rawDoc.match(/^([VEJPGvejpg])[-.\s]?(\d+)$/);
        if (match) {
          docType = match[1].toUpperCase() as DocumentType;
          docNumber = match[2];
        } else {
          docNumber = rawDoc.replace(/\D/g, '');
        }
      }
    } else {
      // Heuristic parsing: inspect each cell by pattern
      for (const cell of cells) {
        if (!cell) continue;
        const strCell = String(cell);

        // Check if email
        if (strCell.includes('@') && !email) {
          email = strCell.toLowerCase();
          continue;
        }

        // Check if account number (starts with bank code or 20 digits)
        const digits = strCell.replace(/\D/g, '');
        if (digits.length >= 18 && !accountNumber) {
          accountNumber = digits;
          continue;
        }

        // Check if document (e.g. V-12345678, J-123456789, or 6-9 digits)
        const docMatch = strCell.match(/^([VEJPGvejpg])[-.\s]?(\d{6,10})$/i);
        if (docMatch && !docNumber) {
          docType = docMatch[1].toUpperCase() as DocumentType;
          docNumber = docMatch[2];
          continue;
        }

        // Check if pure numeric document (between 6 and 9 digits)
        if (/^\d{6,9}$/.test(digits) && !docNumber && !accountNumber) {
          docNumber = digits;
          continue;
        }

        // Check if phone number (e.g. 0414..., 0412..., +58..., 0212...)
        if (/^(04\d{2}|02\d{2}|\+58)\d{7}/.test(digits) && !phone) {
          phone = strCell;
          continue;
        }

        // Check if bank name
        const bankMatch = findBankByNameOrCode(strCell);
        if (bankMatch && !bankName) {
          bankName = bankMatch.name;
          bankCode = bankMatch.code;
          continue;
        }

        // Otherwise consider it name or alias
        if (strCell.length > 2 && !name) {
          name = strCell;
        } else if (strCell.length > 2 && !alias) {
          alias = strCell;
        }
      }
    }

    // Auto-detect bank from account number if missing
    if (accountNumber) {
      const detected = detectBankByAccountNumber(accountNumber);
      if (detected) {
        bankCode = detected.code;
        if (!bankName) bankName = detected.name;
      }
    }

    if (!bankName) bankName = 'Banco no especificado';
    if (!bankCode) bankCode = accountNumber ? accountNumber.slice(0, 4) : '0000';
    if (!name && alias) name = alias.toUpperCase();
    if (!name && email) {
      // derive name from email if all else fails
      const userPart = email.split('@')[0] || '';
      const username = userPart.replace(/[._-]/g, ' ');
      name = username.toUpperCase();
    }
    if (!name) name = 'TITULAR PENDIENTE';

    // Grouping key: by document number or cleaned name
    const groupKey = docNumber ? `${docType}-${docNumber}` : name.trim().toLowerCase();

    const newAccount: BankAccount = {
      id: `acc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      contactId: '',
      accountNumber: accountNumber || '00000000000000000000',
      bankCode,
      bankName,
      accountType: 'Corriente',
      currency: 'VES',
      isDefault: false,
      hasMobilePayment: Boolean(phone),
      mobilePaymentPhone: phone,
      notes: 'Importado de archivo',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (existingContactsMap.has(groupKey)) {
      const existing = existingContactsMap.get(groupKey)!;
      newAccount.contactId = existing.id;
      // If contact was missing email or phone, enrich it
      if (!existing.email && email) existing.email = email;
      if (!existing.phone && phone) existing.phone = phone;
      if (existing.name === 'TITULAR PENDIENTE' && name !== 'TITULAR PENDIENTE') {
        existing.name = name;
      }
      existing.accounts.push(newAccount);
    } else {
      const contactId = `contact-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      newAccount.contactId = contactId;
      newAccount.isDefault = true;

      const newContact: Contact = {
        id: contactId,
        name,
        alias: alias || undefined,
        documentType: docType,
        documentNumber: docNumber || '00000000',
        email: email || undefined,
        phone: phone || undefined,
        category: 'Proveedor',
        notes: '',
        status: 'Activo',
        accounts: [newAccount],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      existingContactsMap.set(groupKey, newContact);
      parsedContacts.push(newContact);
    }
  }

  return parsedContacts;
}

/**
 * Parse an Excel or CSV File instance
 */
export async function parseExcelOrCsvFile(file: File): Promise<Contact[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const rawRows = XLSX.utils.sheet_to_json<(string | number)[]>(worksheet, { header: 1 });
  return parseRawRowData(rawRows);
}

/**
 * Parse raw text / CSV pasted directly by the user (like in the prompt)
 */
export function parsePastedText(text: string): Contact[] {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const rows = lines.map(line => {
    // Check delimiter (comma, semicolon, or tab)
    const delimiter = line.includes('\t') ? '\t' : (line.includes(';') ? ';' : ',');
    return line.split(delimiter).map(c => String(c || '').trim().replace(/^["']|["']$/g, ''));
  });
  return parseRawRowData(rows);
}
