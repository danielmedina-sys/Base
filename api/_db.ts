import pg from 'pg';

const { Pool } = pg;

// Local type definitions to eliminate ANY dependency on src/
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
  accountNumber: string;
  bankCode: string;
  bankName: string;
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
  name: string;
  alias?: string;
  documentType: DocumentType;
  documentNumber: string;
  email?: string;
  phone?: string;
  category: ContactCategory;
  company?: string;
  notes?: string;
  status: 'Activo' | 'Inactivo';
  accounts: BankAccount[];
  createdAt: string;
  updatedAt: string;
}

// Inlined self-contained default dataset for backend seeding
export const DEFAULT_CONTACTS: Contact[] = [
  {
    id: 'contact-rosana',
    name: 'ROSANA BEATRIZ OROPEZA RUBIO',
    alias: 'Rosana',
    documentType: 'V',
    documentNumber: '23490380',
    email: 'roropeza@allstarpublicidad.com',
    phone: '0414-2349038',
    category: 'Proveedor',
    company: 'All Star Publicidad',
    notes: 'Diseño publicitario y medios. Cuentas en Banplus y Banco de Venezuela.',
    status: 'Activo',
    createdAt: '2026-01-15T10:30:00Z',
    updatedAt: '2026-03-20T14:22:00Z',
    accounts: [
      {
        id: 'acc-rosana-banplus',
        contactId: 'contact-rosana',
        accountNumber: '01740149131494043803',
        bankCode: '0174',
        bankName: 'Banplus Banco Universal',
        accountType: 'Corriente',
        currency: 'VES',
        isDefault: true,
        hasMobilePayment: true,
        mobilePaymentPhone: '0414-2349038',
        notes: 'Cuenta principal para transferencias y pagos',
        createdAt: '2026-01-15T10:30:00Z',
        updatedAt: '2026-03-20T14:22:00Z',
      },
      {
        id: 'acc-rosana-bdv',
        contactId: 'contact-rosana',
        accountNumber: '01020372430000103334',
        bankCode: '0102',
        bankName: 'Banco de Venezuela',
        accountType: 'Corriente',
        currency: 'VES',
        isDefault: false,
        hasMobilePayment: true,
        mobilePaymentPhone: '0414-2349038',
        notes: 'Cuenta alterna Banco de Venezuela (BDV)',
        createdAt: '2026-01-15T10:35:00Z',
        updatedAt: '2026-01-15T10:35:00Z',
      },
    ],
  },
  {
    id: 'contact-distribuidora',
    name: 'DISTRIBUIDORA DE PAPELERIA Y SUMINISTROS C.A.',
    alias: 'Suministros Caracas',
    documentType: 'J',
    documentNumber: '408921503',
    email: 'administracion@suministroscaracas.com',
    phone: '0212-9876543',
    category: 'Proveedor',
    company: 'Distribuidora de Papelería C.A.',
    notes: 'Proveedor de material de oficina y consumibles',
    status: 'Activo',
    createdAt: '2026-02-01T09:00:00Z',
    updatedAt: '2026-02-18T11:15:00Z',
    accounts: [
      {
        id: 'acc-distribuidora-banesco',
        contactId: 'contact-distribuidora',
        accountNumber: '01340037410371089201',
        bankCode: '0134',
        bankName: 'Banesco Banco Universal',
        accountType: 'Corriente',
        currency: 'VES',
        isDefault: true,
        hasMobilePayment: false,
        notes: 'Emisión de facturas con crédito 15 días',
        createdAt: '2026-02-01T09:00:00Z',
        updatedAt: '2026-02-01T09:00:00Z',
      },
      {
        id: 'acc-distribuidora-mercantil',
        contactId: 'contact-distribuidora',
        accountNumber: '01050012521012384759',
        bankCode: '0105',
        bankName: 'Banco Mercantil',
        accountType: 'Moneda Extranjera / Dólares',
        currency: 'USD',
        isDefault: false,
        hasMobilePayment: false,
        notes: 'Cuenta custodia en divisas',
        createdAt: '2026-02-10T15:00:00Z',
        updatedAt: '2026-02-10T15:00:00Z',
      },
    ],
  },
  {
    id: 'contact-carlos',
    name: 'CARLOS EDUARDO MENDEZ SILVA',
    alias: 'Carlos Mendez (TI)',
    documentType: 'V',
    documentNumber: '19482910',
    email: 'cmendez.dev@gmail.com',
    phone: '0412-5551234',
    category: 'Nómina / Empleado',
    company: 'Sistemas & Infraestructura',
    notes: 'Ingeniero de soporte y servidores',
    status: 'Activo',
    createdAt: '2026-01-10T08:00:00Z',
    updatedAt: '2026-03-01T16:00:00Z',
    accounts: [
      {
        id: 'acc-carlos-bnc',
        contactId: 'contact-carlos',
        accountNumber: '01910045182045189203',
        bankCode: '0191',
        bankName: 'Banco Nacional de Crédito (BNC)',
        accountType: 'Corriente',
        currency: 'VES',
        isDefault: true,
        hasMobilePayment: true,
        mobilePaymentPhone: '0412-5551234',
        notes: 'Pago quincenal de nómina',
        createdAt: '2026-01-10T08:00:00Z',
        updatedAt: '2026-01-10T08:00:00Z',
      },
      {
        id: 'acc-carlos-bancamiga',
        contactId: 'contact-carlos',
        accountNumber: '01720110771101827364',
        bankCode: '0172',
        bankName: 'Bancamiga Banco Universal',
        accountType: 'Ahorro',
        currency: 'VES',
        isDefault: false,
        hasMobilePayment: true,
        mobilePaymentPhone: '0412-5551234',
        notes: 'Cuenta de ahorros secundaria',
        createdAt: '2026-02-15T12:00:00Z',
        updatedAt: '2026-02-15T12:00:00Z',
      },
    ],
  },
  {
    id: 'contact-valeria',
    name: 'VALERIA ANDREINA CASTILLO PAREDES',
    alias: 'Valeria Castillo',
    documentType: 'V',
    documentNumber: '25114782',
    email: 'valeria.castillo@consultoria.ve',
    phone: '0424-8192034',
    category: 'Servicios',
    company: 'Consultores Financieros',
    notes: 'Asesoría contable y fiscal mensual',
    status: 'Activo',
    createdAt: '2026-02-05T14:20:00Z',
    updatedAt: '2026-03-12T09:40:00Z',
    accounts: [
      {
        id: 'acc-valeria-provincial',
        contactId: 'contact-valeria',
        accountNumber: '01080035190100384729',
        bankCode: '0108',
        bankName: 'BBVA Banco Provincial',
        accountType: 'Corriente',
        currency: 'VES',
        isDefault: true,
        hasMobilePayment: true,
        mobilePaymentPhone: '0424-8192034',
        notes: 'Honorarios profesionales',
        createdAt: '2026-02-05T14:20:00Z',
        updatedAt: '2026-02-05T14:20:00Z',
      },
      {
        id: 'acc-valeria-zelle',
        contactId: 'contact-valeria',
        accountNumber: 'valeria.castillo@consultoria.ve',
        bankCode: 'ZELLE',
        bankName: 'Zelle (EE. UU.)',
        accountType: 'Zelle',
        currency: 'USD',
        isDefault: false,
        hasMobilePayment: false,
        notes: 'Transferencias internacionales Zelle',
        createdAt: '2026-02-20T10:00:00Z',
        updatedAt: '2026-02-20T10:00:00Z',
      },
    ],
  },
];

let pool: pg.Pool | null = null;
let isInitialized = false;

// In-memory fallback if no Postgres URL is provided yet
let memoryContacts: Contact[] = JSON.parse(JSON.stringify(DEFAULT_CONTACTS));

export interface DbConnectionInfo {
  url: string | null;
  envVarName: string | null;
  isPrisma: boolean;
  cleanUrl: string | null;
}

/**
 * Returns connection info from process.env.
 * Prioritizes process.env.DATABASE_URL before process.env.POSTGRES_URL.
 * Handles Prisma protocol `prisma+postgres://` by converting to `postgres://`.
 */
export function getConnectionInfo(): DbConnectionInfo {
  const candidates: Array<{ name: string; val: string }> = [
    { name: 'DATABASE_URL', val: (process.env.DATABASE_URL || '').trim() },
    { name: 'POSTGRES_URL', val: (process.env.POSTGRES_URL || '').trim() },
    { name: 'POSTGRES_URL_NON_POOLING', val: (process.env.POSTGRES_URL_NON_POOLING || '').trim() },
    { name: 'POSTGRES_PRISMA_URL', val: (process.env.POSTGRES_PRISMA_URL || '').trim() },
    { name: 'PRISMA_DATABASE_URL', val: (process.env.PRISMA_DATABASE_URL || '').trim() },
  ].filter((c) => c.val.length > 0);

  if (candidates.length === 0) {
    return { url: null, envVarName: null, isPrisma: false, cleanUrl: null };
  }

  // 1. Prioritize variables starting with postgres:// or postgresql:// (DATABASE_URL first)
  const standardPostgres = candidates.find(
    (c) => c.val.startsWith('postgres://') || c.val.startsWith('postgresql://')
  );

  const selected = standardPostgres || candidates[0];
  const envVarName = selected.name;
  const rawUrl = selected.val;
  const isPrisma = rawUrl.startsWith('prisma+postgres://') || envVarName.includes('PRISMA');

  // Convert prisma+postgres:// to standard postgres:// for node-pg driver
  let cleanUrl = rawUrl;
  if (cleanUrl.startsWith('prisma+postgres://')) {
    cleanUrl = cleanUrl.replace('prisma+postgres://', 'postgres://');
  }

  return {
    url: rawUrl,
    envVarName,
    isPrisma,
    cleanUrl,
  };
}

export function getConnectionString(): string | null {
  return getConnectionInfo().cleanUrl;
}

export function getPool(): pg.Pool | null {
  const { cleanUrl } = getConnectionInfo();
  if (!cleanUrl) {
    return null;
  }

  if (!pool) {
    const isLocal = cleanUrl.includes('localhost') || cleanUrl.includes('127.0.0.1');

    pool = new Pool({
      connectionString: cleanUrl,
      // For cloud databases (Vercel Postgres, Prisma Postgres, Supabase, Neon), SSL is required
      ssl: isLocal ? false : { rejectUnauthorized: false },
      max: 5,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 10000,
    });

    pool.on('error', (err) => {
      console.error('Unexpected error on idle Postgres client:', err);
    });
  }

  return pool;
}

export interface DbErrorPayload {
  message: string;
  code?: string;
  detail?: string;
  hint?: string;
  envVarUsed?: string | null;
  isPrisma?: boolean;
}

export function formatDbError(err: any): DbErrorPayload {
  const info = getConnectionInfo();
  let messageStr = 'Error desconocido en base de datos';

  if (typeof err === 'string') {
    messageStr = err;
  } else if (typeof err === 'object' && err !== null) {
    if (typeof err.message === 'string') {
      messageStr = err.message;
    } else if (typeof err.message === 'object' && err.message !== null) {
      messageStr = err.message.message || JSON.stringify(err.message);
    } else {
      try {
        messageStr = JSON.stringify(err);
      } catch {
        messageStr = String(err);
      }
    }
  } else if (err !== undefined && err !== null) {
    messageStr = String(err);
  }

  return {
    message: messageStr,
    code: err?.code ? String(err.code) : undefined,
    detail: err?.detail ? String(err.detail) : undefined,
    hint: err?.hint ? String(err.hint) : undefined,
    envVarUsed: info.envVarName ? String(info.envVarName) : null,
    isPrisma: Boolean(info.isPrisma),
  };
}

export async function initDb(): Promise<void> {
  const p = getPool();
  if (!p) {
    return;
  }

  if (isInitialized) return;

  try {
    // 1. Create contacts table
    await p.query(`
      CREATE TABLE IF NOT EXISTS contacts (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        alias VARCHAR(255),
        document_type VARCHAR(10) NOT NULL,
        document_number VARCHAR(64) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(64),
        category VARCHAR(64) NOT NULL DEFAULT 'Proveedor',
        company VARCHAR(255),
        notes TEXT,
        status VARCHAR(32) NOT NULL DEFAULT 'Activo',
        accounts JSONB NOT NULL DEFAULT '[]',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // 2. Create indices (safe even if already exist)
    try {
      await p.query(`
        CREATE INDEX IF NOT EXISTS idx_contacts_doc ON contacts(document_type, document_number);
        CREATE INDEX IF NOT EXISTS idx_contacts_name ON contacts(name);
      `);
    } catch (idxErr) {
      console.warn('Index creation warning (non-fatal):', idxErr);
    }

    // 3. Seed initial contacts if table is empty
    const countRes = await p.query('SELECT COUNT(*) FROM contacts');
    const count = parseInt(countRes.rows[0].count, 10);
    if (count === 0 && DEFAULT_CONTACTS.length > 0) {
      console.log('🌱 Seeding initial contacts to Postgres...');
      for (const contact of DEFAULT_CONTACTS) {
        await p.query(
          `INSERT INTO contacts (
            id, name, alias, document_type, document_number, email, phone, category, company, notes, status, accounts, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
          ON CONFLICT (id) DO NOTHING`,
          [
            contact.id,
            contact.name,
            contact.alias || null,
            contact.documentType,
            contact.documentNumber,
            contact.email || null,
            contact.phone || null,
            contact.category,
            contact.company || null,
            contact.notes || null,
            contact.status,
            JSON.stringify(contact.accounts || []),
            contact.createdAt || new Date().toISOString(),
            contact.updatedAt || new Date().toISOString(),
          ]
        );
      }
    }

    isInitialized = true;
    console.log('✅ Postgres database table initialized successfully');
  } catch (err: any) {
    console.error('❌ Failed to initialize Postgres table:', err);
    throw err;
  }
}

function mapRowToContact(row: any): Contact {
  return {
    id: row.id,
    name: row.name,
    alias: row.alias || undefined,
    documentType: row.document_type,
    documentNumber: row.document_number,
    email: row.email || undefined,
    phone: row.phone || undefined,
    category: row.category,
    company: row.company || undefined,
    notes: row.notes || undefined,
    status: row.status,
    accounts: Array.isArray(row.accounts)
      ? row.accounts
      : typeof row.accounts === 'string'
      ? JSON.parse(row.accounts)
      : [],
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
  };
}

export async function getAllContacts(): Promise<{ contacts: Contact[]; source: string }> {
  const p = getPool();
  if (!p) {
    return { contacts: memoryContacts, source: 'local_memory' };
  }

  await initDb();
  const result = await p.query('SELECT * FROM contacts ORDER BY name ASC');
  const contacts = result.rows.map(mapRowToContact);
  return { contacts, source: 'postgres' };
}

export async function getContactById(id: string): Promise<{ contact: Contact | null; source: string }> {
  const p = getPool();
  if (!p) {
    const found = memoryContacts.find((c) => c.id === id) || null;
    return { contact: found, source: 'local_memory' };
  }

  await initDb();
  const result = await p.query('SELECT * FROM contacts WHERE id = $1', [id]);
  if (result.rows.length === 0) {
    return { contact: null, source: 'postgres' };
  }
  return { contact: mapRowToContact(result.rows[0]), source: 'postgres' };
}

export async function upsertContact(contact: Contact): Promise<{ contact: Contact; source: string }> {
  const p = getPool();
  if (!p) {
    const idx = memoryContacts.findIndex((c) => c.id === contact.id);
    if (idx >= 0) {
      memoryContacts[idx] = contact;
    } else {
      memoryContacts.unshift(contact);
    }
    return { contact, source: 'local_memory' };
  }

  await initDb();
  const query = `
    INSERT INTO contacts (
      id, name, alias, document_type, document_number, email, phone, category, company, notes, status, accounts, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      alias = EXCLUDED.alias,
      document_type = EXCLUDED.document_type,
      document_number = EXCLUDED.document_number,
      email = EXCLUDED.email,
      phone = EXCLUDED.phone,
      category = EXCLUDED.category,
      company = EXCLUDED.company,
      notes = EXCLUDED.notes,
      status = EXCLUDED.status,
      accounts = EXCLUDED.accounts,
      updated_at = EXCLUDED.updated_at
    RETURNING *;
  `;

  const values = [
    contact.id,
    contact.name,
    contact.alias || null,
    contact.documentType,
    contact.documentNumber,
    contact.email || null,
    contact.phone || null,
    contact.category,
    contact.company || null,
    contact.notes || null,
    contact.status,
    JSON.stringify(contact.accounts || []),
    contact.createdAt || new Date().toISOString(),
    contact.updatedAt || new Date().toISOString(),
  ];

  const result = await p.query(query, values);
  return { contact: mapRowToContact(result.rows[0]), source: 'postgres' };
}

export async function deleteContact(id: string): Promise<{ success: boolean; source: string }> {
  const p = getPool();
  if (!p) {
    memoryContacts = memoryContacts.filter((c) => c.id !== id);
    return { success: true, source: 'local_memory' };
  }

  await initDb();
  await p.query('DELETE FROM contacts WHERE id = $1', [id]);
  return { success: true, source: 'postgres' };
}

export async function batchSyncContacts(
  contacts: Contact[],
  mode: 'merge' | 'replace' = 'merge'
): Promise<{ contacts: Contact[]; source: string }> {
  const p = getPool();
  if (!p) {
    if (mode === 'replace') {
      memoryContacts = contacts;
    } else {
      const map = new Map<string, Contact>();
      memoryContacts.forEach((c) => map.set(c.id, c));
      contacts.forEach((c) => map.set(c.id, c));
      memoryContacts = Array.from(map.values());
    }
    return { contacts: memoryContacts, source: 'local_memory' };
  }

  await initDb();
  if (mode === 'replace') {
    await p.query('DELETE FROM contacts');
  }

  for (const c of contacts) {
    await upsertContact(c);
  }

  const all = await getAllContacts();
  return all;
}

export async function resetDatabaseToDefault(): Promise<{ contacts: Contact[]; source: string }> {
  return batchSyncContacts(DEFAULT_CONTACTS, 'replace');
}

export async function getDbStatus(): Promise<{
  connected: boolean;
  provider: string;
  hasPostgresEnv: boolean;
  envVarUsed: string | null;
  tableInitialized: boolean;
  message: string;
  error?: string;
  code?: string;
  detail?: string;
}> {
  const info = getConnectionInfo();

  if (!info.cleanUrl) {
    return {
      connected: false,
      provider: 'Local Memory / LocalStorage',
      hasPostgresEnv: false,
      envVarUsed: null,
      tableInitialized: false,
      message: 'POSTGRES_URL o DATABASE_URL no configuradas en las variables de entorno.',
    };
  }

  const p = getPool();
  if (!p) {
    return {
      connected: false,
      provider: 'PostgreSQL',
      hasPostgresEnv: true,
      envVarUsed: info.envVarName,
      tableInitialized: false,
      message: 'No se pudo instanciar el cliente pg.Pool.',
    };
  }

  try {
    const res = await p.query('SELECT NOW()');
    await initDb();
    return {
      connected: true,
      provider: info.isPrisma ? 'Prisma Postgres' : 'PostgreSQL / Vercel Postgres',
      hasPostgresEnv: true,
      envVarUsed: info.envVarName,
      tableInitialized: isInitialized,
      message: `Conectado exitosamente a la base de datos (${res.rows[0].now})`,
    };
  } catch (err: any) {
    console.error('Database connection test failed:', err);
    const dbErr = formatDbError(err);
    return {
      connected: false,
      provider: info.isPrisma ? 'Prisma Postgres (Error)' : 'PostgreSQL (Error)',
      hasPostgresEnv: true,
      envVarUsed: info.envVarName,
      tableInitialized: isInitialized,
      message: `Error al conectar con la base de datos: ${dbErr.message}`,
      error: dbErr.message,
      code: dbErr.code,
      detail: dbErr.detail,
    };
  }
}
