import pg from 'pg';
import { Contact } from '../src/types';
import { INITIAL_CONTACTS } from '../src/data/initialData';

const { Pool } = pg;

let pool: pg.Pool | null = null;
let isInitialized = false;

// In-memory fallback if no Postgres URL is provided yet
let memoryContacts: Contact[] = JSON.parse(JSON.stringify(INITIAL_CONTACTS));

export interface DbConnectionInfo {
  url: string | null;
  envVarName: string | null;
  isPrisma: boolean;
  cleanUrl: string | null;
}

/**
 * Returns connection info from process.env.
 * Checks POSTGRES_URL, DATABASE_URL, POSTGRES_PRISMA_URL, POSTGRES_URL_NON_POOLING.
 * Handles Prisma Postgres protocol `prisma+postgres://` by converting to `postgres://`.
 */
export function getConnectionInfo(): DbConnectionInfo {
  let envVarName: string | null = null;
  let rawUrl: string | null = null;

  if (process.env.POSTGRES_URL) {
    envVarName = 'POSTGRES_URL';
    rawUrl = process.env.POSTGRES_URL.trim();
  } else if (process.env.DATABASE_URL) {
    envVarName = 'DATABASE_URL';
    rawUrl = process.env.DATABASE_URL.trim();
  } else if (process.env.POSTGRES_PRISMA_URL) {
    envVarName = 'POSTGRES_PRISMA_URL';
    rawUrl = process.env.POSTGRES_PRISMA_URL.trim();
  } else if (process.env.POSTGRES_URL_NON_POOLING) {
    envVarName = 'POSTGRES_URL_NON_POOLING';
    rawUrl = process.env.POSTGRES_URL_NON_POOLING.trim();
  }

  if (!rawUrl) {
    return { url: null, envVarName: null, isPrisma: false, cleanUrl: null };
  }

  let cleanUrl = rawUrl;
  const isPrisma = rawUrl.startsWith('prisma+postgres://');

  // Convert prisma+postgres:// to standard postgres:// for node-pg driver
  if (isPrisma) {
    cleanUrl = rawUrl.replace('prisma+postgres://', 'postgres://');
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
  return {
    message: err?.message || String(err),
    code: err?.code,
    detail: err?.detail,
    hint: err?.hint,
    envVarUsed: info.envVarName,
    isPrisma: info.isPrisma,
  };
}

export async function initDb(): Promise<void> {
  const p = getPool();
  if (!p) {
    console.log('ℹ️ Running in Local Memory / Fallback Mode (No POSTGRES_URL / DATABASE_URL set).');
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
    if (count === 0 && INITIAL_CONTACTS.length > 0) {
      console.log('🌱 Seeding initial contacts to Postgres...');
      for (const contact of INITIAL_CONTACTS) {
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
    throw err; // Rethrow so caller can report exact error in JSON
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
    accounts: Array.isArray(row.accounts) ? row.accounts : (typeof row.accounts === 'string' ? JSON.parse(row.accounts) : []),
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
  return batchSyncContacts(INITIAL_CONTACTS, 'replace');
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
    return {
      connected: false,
      provider: info.isPrisma ? 'Prisma Postgres (Error)' : 'PostgreSQL (Error)',
      hasPostgresEnv: true,
      envVarUsed: info.envVarName,
      tableInitialized: isInitialized,
      message: `Error al conectar con la base de datos: ${err?.message || String(err)}`,
      error: err?.message || String(err),
      code: err?.code,
      detail: err?.detail,
    };
  }
}
