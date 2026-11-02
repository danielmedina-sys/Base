import pg from 'pg';
import { Contact } from '../src/types';
import { INITIAL_CONTACTS } from '../src/data/initialData';

const { Pool } = pg;

let pool: pg.Pool | null = null;
let isInitialized = false;

// In-memory fallback if no Postgres URL is provided yet
let memoryContacts: Contact[] = JSON.parse(JSON.stringify(INITIAL_CONTACTS));

export function getConnectionString(): string | null {
  return (
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    null
  );
}

export function getPool(): pg.Pool | null {
  const connectionString = getConnectionString();
  if (!connectionString) {
    return null;
  }

  if (!pool) {
    pool = new Pool({
      connectionString,
      ssl: connectionString.includes('localhost') ? false : { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    pool.on('error', (err) => {
      console.error('Unexpected error on idle Postgres client', err);
    });
  }

  return pool;
}

export async function initDb(): Promise<void> {
  const p = getPool();
  if (!p) {
    console.log('ℹ️ Running in Local Memory / Fallback Mode (POSTGRES_URL not set).');
    return;
  }

  if (isInitialized) return;

  try {
    // Create contacts table if it doesn't exist
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

      CREATE INDEX IF NOT EXISTS idx_contacts_doc ON contacts(document_type, document_number);
      CREATE INDEX IF NOT EXISTS idx_contacts_name ON contacts(name);
    `);

    // Check if empty, seed with INITIAL_CONTACTS
    const countRes = await p.query('SELECT COUNT(*) FROM contacts');
    const count = parseInt(countRes.rows[0].count, 10);
    if (count === 0 && INITIAL_CONTACTS.length > 0) {
      console.log('🌱 Seeding initial contacts to Vercel Postgres...');
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
    console.log('✅ Vercel Postgres database initialized successfully');
  } catch (err) {
    console.error('❌ Failed to initialize Vercel Postgres table:', err);
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

  try {
    await initDb();
    const result = await p.query('SELECT * FROM contacts ORDER BY name ASC');
    const contacts = result.rows.map(mapRowToContact);
    return { contacts, source: 'vercel_postgres' };
  } catch (err) {
    console.error('Error fetching contacts from Postgres, falling back to memory:', err);
    return { contacts: memoryContacts, source: 'local_fallback' };
  }
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

  try {
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
    return { contact: mapRowToContact(result.rows[0]), source: 'vercel_postgres' };
  } catch (err) {
    console.error('Error upserting contact in Postgres:', err);
    // fallback
    const idx = memoryContacts.findIndex((c) => c.id === contact.id);
    if (idx >= 0) {
      memoryContacts[idx] = contact;
    } else {
      memoryContacts.unshift(contact);
    }
    return { contact, source: 'local_fallback' };
  }
}

export async function deleteContact(id: string): Promise<{ success: boolean; source: string }> {
  const p = getPool();
  if (!p) {
    memoryContacts = memoryContacts.filter((c) => c.id !== id);
    return { success: true, source: 'local_memory' };
  }

  try {
    await initDb();
    await p.query('DELETE FROM contacts WHERE id = $1', [id]);
    return { success: true, source: 'vercel_postgres' };
  } catch (err) {
    console.error('Error deleting contact from Postgres:', err);
    memoryContacts = memoryContacts.filter((c) => c.id !== id);
    return { success: true, source: 'local_fallback' };
  }
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

  try {
    await initDb();
    if (mode === 'replace') {
      await p.query('DELETE FROM contacts');
    }

    for (const c of contacts) {
      await upsertContact(c);
    }

    const all = await getAllContacts();
    return all;
  } catch (err) {
    console.error('Error in batch sync:', err);
    return { contacts, source: 'local_fallback' };
  }
}

export async function resetDatabaseToDefault(): Promise<{ contacts: Contact[]; source: string }> {
  return batchSyncContacts(INITIAL_CONTACTS, 'replace');
}

export async function getDbStatus(): Promise<{
  connected: boolean;
  provider: string;
  hasPostgresEnv: boolean;
  tableInitialized: boolean;
  message: string;
}> {
  const connStr = getConnectionString();
  const hasEnv = Boolean(connStr);

  if (!hasEnv) {
    return {
      connected: false,
      provider: 'Local Memory / LocalStorage',
      hasPostgresEnv: false,
      tableInitialized: false,
      message: 'POSTGRES_URL no configurada en las variables de entorno. Los datos se almacenan en memoria y caché local.',
    };
  }

  const p = getPool();
  if (!p) {
    return {
      connected: false,
      provider: 'PostgreSQL',
      hasPostgresEnv: true,
      tableInitialized: false,
      message: 'No se pudo crear la conexión de Postgres.',
    };
  }

  try {
    const res = await p.query('SELECT NOW()');
    return {
      connected: true,
      provider: 'Vercel Postgres',
      hasPostgresEnv: true,
      tableInitialized: isInitialized,
      message: `Conectado exitosamente a Vercel Postgres (${res.rows[0].now})`,
    };
  } catch (err: any) {
    return {
      connected: false,
      provider: 'Vercel Postgres (Error)',
      hasPostgresEnv: true,
      tableInitialized: false,
      message: `Error al conectar con Postgres: ${err?.message || String(err)}`,
    };
  }
}
