import * as XLSX from 'xlsx';
import { Contact, BankAccount, DocumentType, AccountType, ContactCategory } from '../types/index.ts';
import { detectBankByAccountNumber, findBankByNameOrCode } from '../data/banks.ts';

/**
 * Canonical column headers in the exact order requested by user:
 * 1. N° (Ignored on import, numbered on export)
 * 2. Titular / Beneficiario
 * 3. Alias / Nombre Corto
 * 4. Banco
 * 5. Código Banco
 * 6. Número de Cuenta
 * 7. C.I. / RIF
 * 8. Teléfono / Contacto
 * 9. Pago Móvil
 * 10. Correo Electrónico
 */
export const EXCEL_COLUMNS = [
  'N°',
  'Titular / Beneficiario',
  'Alias / Nombre Corto',
  'Banco',
  'Código Banco',
  'Número de Cuenta',
  'C.I. / RIF',
  'Teléfono / Contacto',
  'Pago Móvil',
  'Correo Electrónico',
] as const;

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
        bankCode: '0000',
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
 * Export data to a styled Excel (.xlsx) file using the exact requested headers and column order
 */
export function exportToExcel(contacts: Contact[], filename = 'base_cuentas_bancarias.xlsx') {
  const rows = flattenContactsToRows(contacts);

  const excelData = rows.map((r, index) => {
    // Prepend apostrophe so Excel keeps leading zero and avoids scientific notation
    const cleanAccount = String(r.accountNumber || '').replace(/^'+/, '').trim();
    const formattedAccount = cleanAccount ? `'${cleanAccount}` : '';

    return {
      'N°': index + 1,
      'Titular / Beneficiario': r.name || '',
      'Alias / Nombre Corto': r.alias || '',
      'Banco': r.bankName || '',
      'Código Banco': r.bankCode || '',
      'Número de Cuenta': formattedAccount,
      'C.I. / RIF': r.documentFull || '',
      'Teléfono / Contacto': r.phone || '',
      'Pago Móvil': r.hasMobilePayment ? 'Sí' : 'No',
      'Correo Electrónico': r.email || '',
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(excelData);

  // Set column widths for optimal reading across all 10 columns
  worksheet['!cols'] = [
    { wch: 6 },  // N°
    { wch: 34 }, // Titular / Beneficiario
    { wch: 20 }, // Alias / Nombre Corto
    { wch: 26 }, // Banco
    { wch: 14 }, // Código Banco
    { wch: 26 }, // Número de Cuenta
    { wch: 16 }, // C.I. / RIF
    { wch: 18 }, // Teléfono / Contacto
    { wch: 12 }, // Pago Móvil
    { wch: 32 }, // Correo Electrónico
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Cuentas y Contactos');
  XLSX.writeFile(workbook, filename);
}

/**
 * Export data to clean UTF-8 CSV with the exact same headers and order
 */
export function exportToCsv(contacts: Contact[], filename = 'base_cuentas_bancarias.csv') {
  const rows = flattenContactsToRows(contacts);
  const headers = [
    'N°',
    'Titular / Beneficiario',
    'Alias / Nombre Corto',
    'Banco',
    'Código Banco',
    'Número de Cuenta',
    'C.I. / RIF',
    'Teléfono / Contacto',
    'Pago Móvil',
    'Correo Electrónico',
  ];

  const csvRows = [headers.join(',')];

  for (let index = 0; index < rows.length; index++) {
    const r = rows[index];
    const cleanAccount = String(r.accountNumber || '').replace(/^'+/, '').trim();
    const values = [
      String(index + 1),
      `"${String(r.name || '').replace(/"/g, '""')}"`,
      `"${String(r.alias || '').replace(/"/g, '""')}"`,
      `"${String(r.bankName || '').replace(/"/g, '""')}"`,
      `"${String(r.bankCode || '').replace(/"/g, '""')}"`,
      `"'${cleanAccount}"`,
      `"${String(r.documentFull || '').replace(/"/g, '""')}"`,
      `"${String(r.phone || '').replace(/"/g, '""')}"`,
      `"${r.hasMobilePayment ? 'Sí' : 'No'}"`,
      `"${String(r.email || '').replace(/"/g, '""')}"`,
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

// Helper to normalize strings for robust header comparisons
function normalizeStr(str: any): string {
  if (str === null || str === undefined) return '';
  return String(str)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // strip accents
}

type ColumnRole =
  | 'ignore'
  | 'name'
  | 'alias'
  | 'bankName'
  | 'bankCode'
  | 'accountNumber'
  | 'document'
  | 'phone'
  | 'mobilePayment'
  | 'email'
  | 'unknown';

/**
 * Identify which canonical field a header corresponds to,
 * prioritising the user's exact header strings.
 */
function identifyHeaderRole(rawHeader: any): ColumnRole {
  const raw = String(rawHeader || '').trim();
  const norm = normalizeStr(rawHeader);

  // 1. Column N° (Ignored completely)
  if (
    raw === 'N°' ||
    raw === 'Nº' ||
    norm === 'n°' ||
    norm === 'no' ||
    norm === 'no.' ||
    norm === '#' ||
    norm === 'num' ||
    norm === 'item' ||
    norm === 'indice' ||
    norm === 'index'
  ) {
    return 'ignore';
  }

  // 2. Titular / Beneficiario
  if (
    raw === 'Titular / Beneficiario' ||
    norm === 'titular / beneficiario' ||
    norm === 'titular/beneficiario' ||
    norm === 'beneficiario' ||
    (norm.includes('titular') && !norm.includes('cuenta') && !norm.includes('alias'))
  ) {
    return 'name';
  }

  // 3. Alias / Nombre Corto
  if (
    raw === 'Alias / Nombre Corto' ||
    norm === 'alias / nombre corto' ||
    norm === 'alias/nombre corto' ||
    norm === 'alias' ||
    norm.includes('nombre corto')
  ) {
    return 'alias';
  }

  // 4. Código Banco
  if (
    raw === 'Código Banco' ||
    norm === 'codigo banco' ||
    norm === 'cod banco' ||
    norm === 'cod. banco' ||
    norm === 'codigo del banco'
  ) {
    return 'bankCode';
  }

  // 5. Banco
  if (
    raw === 'Banco' ||
    norm === 'banco' ||
    norm === 'nombre banco' ||
    norm === 'entidad bancaria' ||
    (norm.includes('banco') && !norm.includes('codigo') && !norm.includes('cuenta'))
  ) {
    return 'bankName';
  }

  // 6. Número de Cuenta
  if (
    raw === 'Número de Cuenta' ||
    norm === 'numero de cuenta' ||
    norm === 'numero cuenta' ||
    norm === 'nro cuenta' ||
    norm === 'num cuenta' ||
    norm === 'cuenta' ||
    norm === 'cuenta bancaria' ||
    norm.includes('cuenta')
  ) {
    return 'accountNumber';
  }

  // 7. C.I. / RIF
  if (
    raw === 'C.I. / RIF' ||
    norm === 'c.i. / rif' ||
    norm === 'ci / rif' ||
    norm === 'c.i./rif' ||
    norm === 'ci/rif' ||
    norm === 'cedula' ||
    norm === 'c.i.' ||
    norm === 'ci' ||
    norm === 'rif' ||
    norm === 'documento' ||
    norm === 'identificacion'
  ) {
    return 'document';
  }

  // 8. Pago Móvil
  if (
    raw === 'Pago Móvil' ||
    norm === 'pago movil' ||
    norm === 'pagomovil' ||
    (norm.includes('pago') && norm.includes('movil'))
  ) {
    return 'mobilePayment';
  }

  // 9. Teléfono / Contacto
  if (
    raw === 'Teléfono / Contacto' ||
    norm === 'telefono / contacto' ||
    norm === 'telefono/contacto' ||
    norm === 'telefono' ||
    norm === 'celular' ||
    norm === 'contacto' ||
    (norm.includes('telefono') && !norm.includes('pago'))
  ) {
    return 'phone';
  }

  // 10. Correo Electrónico
  if (
    raw === 'Correo Electrónico' ||
    norm === 'correo electronico' ||
    norm === 'correo' ||
    norm === 'email' ||
    norm === 'e-mail' ||
    norm.includes('correo') ||
    norm.includes('email')
  ) {
    return 'email';
  }

  return 'unknown';
}

/**
 * Parses C.I. / RIF strings into DocumentType (V, J, E, P, G) and digits.
 * E.g. "V-23.490.380" -> type: "V", number: "23490380"
 * E.g. "J-408921503" -> type: "J", number: "408921503"
 * E.g. "23490380" -> type: "V", number: "23490380"
 */
function parseDocumentString(rawVal: string): { docType: DocumentType; docNumber: string; docFull: string } {
  const cleaned = rawVal.replace(/^'+/, '').trim();
  if (!cleaned) {
    return { docType: 'V', docNumber: '', docFull: '' };
  }

  const match = cleaned.match(/^([VEJPGvejpg])[-.\s]?([\d.]+)$/i);
  if (match) {
    const docType = match[1].toUpperCase() as DocumentType;
    const docNumber = match[2].replace(/\D/g, '');
    return { docType, docNumber, docFull: `${docType}-${docNumber}` };
  }

  const digits = cleaned.replace(/\D/g, '');
  if (digits) {
    const firstChar = cleaned[0].toUpperCase();
    const docType: DocumentType = ['V', 'E', 'J', 'P', 'G'].includes(firstChar)
      ? (firstChar as DocumentType)
      : 'V';
    return { docType, docNumber: digits, docFull: `${docType}-${digits}` };
  }

  return { docType: 'V', docNumber: cleaned, docFull: cleaned };
}

interface ColumnMap {
  nameCol: number;
  aliasCol: number;
  bankNameCol: number;
  bankCodeCol: number;
  accountNumberCol: number;
  documentCol: number;
  phoneCol: number;
  mobilePaymentCol: number;
  emailCol: number;
  ignoredCols: Set<number>;
}

/**
 * Core Parser: Parses 2D table data (from XLSX or CSV) by identifying
 * exact column headers regardless of the column order, ignoring "N°",
 * and constructing validated Contact and BankAccount models.
 */
export function parseRowsData(rawRows: (string | number)[][]): Contact[] {
  if (!Array.isArray(rawRows) || rawRows.length === 0) return [];

  const existingContactsMap = new Map<string, Contact>();
  const parsedContacts: Contact[] = [];

  // Step 1: Detect the header row by inspecting first 10 rows
  let headerRowIndex = -1;
  const colMap: ColumnMap = {
    nameCol: -1,
    aliasCol: -1,
    bankNameCol: -1,
    bankCodeCol: -1,
    accountNumberCol: -1,
    documentCol: -1,
    phoneCol: -1,
    mobilePaymentCol: -1,
    emailCol: -1,
    ignoredCols: new Set<number>(),
  };

  const maxScanRows = Math.min(10, rawRows.length);
  for (let r = 0; r < maxScanRows; r++) {
    const row = rawRows[r];
    if (!row || row.length === 0) continue;

    let recognizedCount = 0;
    const tempRoles: { col: number; role: ColumnRole }[] = [];

    for (let c = 0; c < row.length; c++) {
      const cellVal = row[c];
      const role = identifyHeaderRole(cellVal);
      if (role !== 'unknown') {
        if (role !== 'ignore') recognizedCount++;
        tempRoles.push({ col: c, role });
      }
    }

    // If at least 2 distinct recognizable headers are found, this is the header row!
    if (recognizedCount >= 2) {
      headerRowIndex = r;
      for (const item of tempRoles) {
        if (item.role === 'ignore') {
          colMap.ignoredCols.add(item.col);
        } else if (item.role === 'name' && colMap.nameCol === -1) {
          colMap.nameCol = item.col;
        } else if (item.role === 'alias' && colMap.aliasCol === -1) {
          colMap.aliasCol = item.col;
        } else if (item.role === 'bankName' && colMap.bankNameCol === -1) {
          colMap.bankNameCol = item.col;
        } else if (item.role === 'bankCode' && colMap.bankCodeCol === -1) {
          colMap.bankCodeCol = item.col;
        } else if (item.role === 'accountNumber' && colMap.accountNumberCol === -1) {
          colMap.accountNumberCol = item.col;
        } else if (item.role === 'document' && colMap.documentCol === -1) {
          colMap.documentCol = item.col;
        } else if (item.role === 'phone' && colMap.phoneCol === -1) {
          colMap.phoneCol = item.col;
        } else if (item.role === 'mobilePayment' && colMap.mobilePaymentCol === -1) {
          colMap.mobilePaymentCol = item.col;
        } else if (item.role === 'email' && colMap.emailCol === -1) {
          colMap.emailCol = item.col;
        }
      }
      break;
    }
  }

  // Step 2: Parse data rows
  const startRow = headerRowIndex !== -1 ? headerRowIndex + 1 : 0;

  for (let r = startRow; r < rawRows.length; r++) {
    const row = rawRows[r];
    if (!row || row.length === 0) continue;

    const cells = row.map(c => (c !== null && c !== undefined ? String(c).trim() : ''));
    const nonEmptyCells = cells.filter(c => c.length > 0);
    if (nonEmptyCells.length === 0) continue;

    // Check if entire row is just repetitive headers or junk
    const rowJoin = cells.join(' ').toLowerCase();
    if (
      (rowJoin.includes('titular') && rowJoin.includes('cuenta')) ||
      (rowJoin.includes('🔎') && nonEmptyCells.length <= 2)
    ) {
      continue;
    }

    let name = '';
    let alias = '';
    let bankName = '';
    let bankCode = '';
    let accountNumber = '';
    let docType: DocumentType = 'V';
    let docNumber = '';
    let phone = '';
    let hasMobilePayment = false;
    let email = '';

    if (headerRowIndex !== -1) {
      // Map columns using the identified header mapping
      if (colMap.nameCol !== -1 && cells[colMap.nameCol] !== undefined) {
        name = cells[colMap.nameCol].replace(/^'+/, '').trim();
      }
      if (colMap.aliasCol !== -1 && cells[colMap.aliasCol] !== undefined) {
        alias = cells[colMap.aliasCol].replace(/^'+/, '').trim();
      }
      if (colMap.bankNameCol !== -1 && cells[colMap.bankNameCol] !== undefined) {
        bankName = cells[colMap.bankNameCol].replace(/^'+/, '').trim();
      }
      if (colMap.bankCodeCol !== -1 && cells[colMap.bankCodeCol] !== undefined) {
        bankCode = cells[colMap.bankCodeCol].replace(/^'+/, '').trim();
      }
      if (colMap.accountNumberCol !== -1 && cells[colMap.accountNumberCol] !== undefined) {
        // Strip leading apostrophe `'`
        const rawAcc = cells[colMap.accountNumberCol].replace(/^'+/, '').trim();
        accountNumber = rawAcc.replace(/[\s-]+/g, '');
      }
      if (colMap.documentCol !== -1 && cells[colMap.documentCol] !== undefined) {
        const rawDoc = cells[colMap.documentCol];
        const parsedDoc = parseDocumentString(rawDoc);
        docType = parsedDoc.docType;
        docNumber = parsedDoc.docNumber;
      }
      if (colMap.phoneCol !== -1 && cells[colMap.phoneCol] !== undefined) {
        phone = cells[colMap.phoneCol].replace(/^'+/, '').trim();
      }
      if (colMap.mobilePaymentCol !== -1 && cells[colMap.mobilePaymentCol] !== undefined) {
        const rawMob = cells[colMap.mobilePaymentCol].replace(/^'+/, '').trim();
        // Activate Mobile Payment if it says "Sí" or "Si"
        hasMobilePayment = /^(s[ií]|yes|true|1)$/i.test(rawMob);
      }
      if (colMap.emailCol !== -1 && cells[colMap.emailCol] !== undefined) {
        email = cells[colMap.emailCol].replace(/^'+/, '').trim().toLowerCase();
      }
    } else {
      // Fallback heuristic parsing when file has no headers:
      for (let c = 0; c < cells.length; c++) {
        const strCell = cells[c];
        if (!strCell) continue;

        // Check email
        if (strCell.includes('@') && !email) {
          email = strCell.toLowerCase();
          continue;
        }

        // Check account number (>= 18 digits or bank code prefix)
        const digits = strCell.replace(/\D/g, '');
        if (digits.length >= 18 && !accountNumber) {
          accountNumber = digits;
          continue;
        }

        // Check document
        const docMatch = strCell.match(/^([VEJPGvejpg])[-.\s]?(\d{6,10})$/i);
        if (docMatch && !docNumber) {
          docType = docMatch[1].toUpperCase() as DocumentType;
          docNumber = docMatch[2];
          continue;
        }

        // Pure numeric document (6 to 9 digits)
        if (/^\d{6,9}$/.test(digits) && !docNumber && !accountNumber) {
          docNumber = digits;
          continue;
        }

        // Check phone
        if (/^(04\d{2}|02\d{2}|\+58)\d{7}/.test(digits) && !phone) {
          phone = strCell;
          continue;
        }

        // Check bank name
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

    // Auto-detect or sanitize Bank Code
    if (bankCode) {
      // Pad leading zero if Excel converted e.g. "102" to number
      if (/^\d{1,3}$/.test(bankCode)) {
        bankCode = bankCode.padStart(4, '0');
      }
    }
    if (!bankCode && accountNumber && accountNumber.length >= 4) {
      bankCode = accountNumber.slice(0, 4);
    }

    // Auto-detect bank name if missing
    if (!bankName || bankName === 'N/A' || bankName.toLowerCase() === 'banco no especificado') {
      if (accountNumber) {
        const detected = detectBankByAccountNumber(accountNumber);
        if (detected) {
          bankName = detected.name;
          if (!bankCode) bankCode = detected.code;
        }
      }
      if (!bankName && bankCode) {
        const detected = findBankByNameOrCode(bankCode);
        if (detected) bankName = detected.name;
      }
    }
    if (!bankName) bankName = 'Banco no especificado';
    if (!bankCode) bankCode = '0000';

    // Auto-fill Name / Alias / Email fallbacks
    if (!name && alias) name = alias.toUpperCase();
    if (!name && email) {
      const userPart = email.split('@')[0] || '';
      name = userPart.replace(/[._-]/g, ' ').toUpperCase();
    }
    if (!name) name = 'TITULAR PENDIENTE';

    // Key to group multiple bank accounts of the same contact
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
      hasMobilePayment,
      mobilePaymentPhone: hasMobilePayment ? (phone || undefined) : undefined,
      notes: 'Importado de Excel',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (existingContactsMap.has(groupKey)) {
      const existing = existingContactsMap.get(groupKey)!;
      newAccount.contactId = existing.id;

      // Update contact details if richer information is found in this row
      if (!existing.email && email) existing.email = email;
      if (!existing.phone && phone) existing.phone = phone;
      if (!existing.alias && alias) existing.alias = alias;
      if (existing.name === 'TITULAR PENDIENTE' && name !== 'TITULAR PENDIENTE') {
        existing.name = name;
      }

      // Avoid adding duplicate account numbers to the same contact
      const hasDuplicateAcc = existing.accounts.some(
        a => a.accountNumber === newAccount.accountNumber && a.accountNumber !== '00000000000000000000'
      );
      if (!hasDuplicateAcc) {
        existing.accounts.push(newAccount);
      }
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
 * Parse an Excel or CSV File instance using cellText formatting to preserve leading zeros
 */
export async function parseExcelOrCsvFile(file: File): Promise<Contact[]> {
  const buffer = await file.arrayBuffer();
  // Using cellText: true and raw: false formats cells so text like numbers with leading zeros are kept
  const workbook = XLSX.read(buffer, { type: 'array', cellText: true, raw: false });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const rawRows = XLSX.utils.sheet_to_json<(string | number)[]>(worksheet, { header: 1, defval: '' });
  return parseRowsData(rawRows);
}

/**
 * Parse raw text / CSV pasted directly by the user (supports tabs, semicolons, and commas)
 */
export function parsePastedText(text: string): Contact[] {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const rows = lines.map(line => {
    // Detect delimiter: tab (when copying from Excel), semicolon, or comma
    const delimiter = line.includes('\t') ? '\t' : (line.includes(';') ? ';' : ',');
    return line.split(delimiter).map(c => String(c || '').trim().replace(/^["']|["']$/g, ''));
  });
  return parseRowsData(rows);
}
