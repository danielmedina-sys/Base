import { Contact } from '../types';
import { loadContacts as loadLocalContacts, saveContacts as saveLocalContacts } from './storage';

export interface DbStatusInfo {
  connected: boolean;
  provider: string;
  hasPostgresEnv: boolean;
  envVarUsed?: string | null;
  tableInitialized: boolean;
  message: string;
  error?: string;
  code?: string;
  detail?: string;
}

export interface FetchContactsResponse {
  contacts: Contact[];
  source: string;
  count: number;
  dbConnected: boolean;
  error?: string;
}

export function toSafeString(val: any, fallback = ''): string {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'string') return val;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  if (typeof val === 'object') {
    if (typeof val.message === 'string') return val.message;
    if (typeof val.error === 'string') return val.error;
    try {
      return JSON.stringify(val);
    } catch {
      return String(val);
    }
  }
  return String(val);
}

async function extractErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const errData = await res.json();
    if (errData?.error) {
      const errorStr = toSafeString(errData.error);
      const codePart = errData.code ? ` [Code: ${toSafeString(errData.code)}]` : '';
      const detailPart = errData.detail ? ` - ${toSafeString(errData.detail)}` : '';
      return `${errorStr}${codePart}${detailPart}`;
    }
    if (errData?.message) {
      return toSafeString(errData.message);
    }
  } catch {
    // Non-JSON response
  }
  return `${fallback} (HTTP ${res.status})`;
}

// Fetch all contacts from the /api/contacts endpoint with offline fallback
export async function apiFetchContacts(): Promise<FetchContactsResponse> {
  try {
    const res = await fetch('/api/contacts', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!res.ok) {
      const errorMsg = await extractErrorMessage(res, 'Error al obtener contactos');
      throw new Error(errorMsg);
    }

    const data = await res.json();
    if (data && Array.isArray(data.contacts)) {
      // Cache fresh data locally for instant offline availability
      saveLocalContacts(data.contacts);
      const isConnected = data.source === 'postgres' || data.source === 'vercel_postgres';
      return {
        contacts: data.contacts,
        source: data.source || 'api',
        count: data.contacts.length,
        dbConnected: isConnected,
      };
    }

    throw new Error('Respuesta de API inválida');
  } catch (err: any) {
    console.warn('⚠️ No se pudo obtener contactos desde la base de datos:', err);
    const local = loadLocalContacts();
    return {
      contacts: local,
      source: 'offline_cache',
      count: local.length,
      dbConnected: false,
      error: toSafeString(err, 'Error de conexión'),
    };
  }
}

// Save or update a single contact in the database
export async function apiSaveContact(contact: Contact): Promise<{ contact: Contact; source: string; error?: string }> {
  try {
    const res = await fetch('/api/contacts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(contact),
    });

    if (!res.ok) {
      const errorMsg = await extractErrorMessage(res, 'Error al guardar contacto');
      throw new Error(errorMsg);
    }

    const data = await res.json();
    if (data.success && data.contact) {
      return { contact: data.contact, source: data.source || 'api' };
    }
    return { contact, source: 'local_cache' };
  } catch (err: any) {
    console.warn('⚠️ Guardado en API falló, persistiendo localmente:', err);
    return { contact, source: 'local_cache_offline', error: toSafeString(err) };
  }
}

// Delete contact from the database
export async function apiDeleteContact(id: string): Promise<{ success: boolean; source: string; error?: string }> {
  try {
    const res = await fetch(`/api/contacts/${id}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!res.ok) {
      const errorMsg = await extractErrorMessage(res, 'Error al eliminar contacto');
      throw new Error(errorMsg);
    }

    const data = await res.json();
    return { success: Boolean(data.success), source: data.source || 'api' };
  } catch (err: any) {
    console.warn('⚠️ Eliminación en API falló, persistiendo localmente:', err);
    return { success: true, source: 'local_cache_offline', error: toSafeString(err) };
  }
}

// Batch import or sync contacts (merge or replace)
export async function apiBatchSync(
  contacts: Contact[],
  mode: 'merge' | 'replace' = 'merge'
): Promise<{ contacts: Contact[]; source: string; error?: string }> {
  try {
    const res = await fetch('/api/contacts/batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ contacts, mode }),
    });

    if (!res.ok) {
      const errorMsg = await extractErrorMessage(res, 'Error en sincronización');
      throw new Error(errorMsg);
    }

    const data = await res.json();
    if (data.success && Array.isArray(data.contacts)) {
      saveLocalContacts(data.contacts);
      return { contacts: data.contacts, source: data.source || 'api' };
    }
    saveLocalContacts(contacts);
    return { contacts, source: 'local_cache' };
  } catch (err: any) {
    console.warn('⚠️ Sincronización batch en API falló, usando local:', err);
    saveLocalContacts(contacts);
    return { contacts, source: 'local_cache_offline', error: toSafeString(err) };
  }
}

// Reset database to defaults
export async function apiResetDatabase(): Promise<{ contacts: Contact[]; source: string; error?: string }> {
  try {
    const res = await fetch('/api/contacts/reset', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!res.ok) {
      const errorMsg = await extractErrorMessage(res, 'Error al reiniciar base de datos');
      throw new Error(errorMsg);
    }

    const data = await res.json();
    if (data.success && Array.isArray(data.contacts)) {
      saveLocalContacts(data.contacts);
      return { contacts: data.contacts, source: data.source || 'api' };
    }
    throw new Error('Respuesta inválida');
  } catch (err: any) {
    console.warn('⚠️ Reset vía API falló, restaurando localmente:', err);
    const local = loadLocalContacts();
    return { contacts: local, source: 'local_cache_offline', error: toSafeString(err) };
  }
}

// Check database connection and provider status
export async function apiGetStatus(): Promise<DbStatusInfo> {
  try {
    const res = await fetch('/api/status', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    let data: any = {};
    try {
      data = await res.json();
    } catch {
      data = { message: `Respuesta del servidor no válida (HTTP ${res.status})` };
    }

    const errorStr = data.error ? toSafeString(data.error) : undefined;
    const messageStr = toSafeString(data.message, data.connected ? 'Conexión exitosa' : '');
    const codeStr = data.code ? toSafeString(data.code) : undefined;
    const detailStr = data.detail ? toSafeString(data.detail) : undefined;
    const envVarUsedStr = data.envVarUsed ? toSafeString(data.envVarUsed) : null;
    const providerStr = toSafeString(data.provider, 'Desconocido');

    return {
      connected: Boolean(data.connected),
      provider: providerStr,
      hasPostgresEnv: Boolean(data.hasPostgresEnv),
      envVarUsed: envVarUsedStr,
      tableInitialized: Boolean(data.tableInitialized),
      message: messageStr,
      error: errorStr,
      code: codeStr,
      detail: detailStr,
    };
  } catch (err: any) {
    const errStr = toSafeString(err, 'No se pudo contactar al endpoint /api/status');
    return {
      connected: false,
      provider: 'Sin conexión',
      hasPostgresEnv: false,
      envVarUsed: null,
      tableInitialized: false,
      message: errStr,
      error: errStr,
    };
  }
}

