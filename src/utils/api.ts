import { Contact } from '../types';
import { loadContacts as loadLocalContacts, saveContacts as saveLocalContacts } from './storage';

export interface DbStatusInfo {
  connected: boolean;
  provider: string;
  hasPostgresEnv: boolean;
  tableInitialized: boolean;
  message: string;
}

export interface FetchContactsResponse {
  contacts: Contact[];
  source: string;
  count: number;
  dbConnected: boolean;
  error?: string;
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
      throw new Error(`Servidor devolvió código HTTP ${res.status}`);
    }

    const data = await res.json();
    if (data && Array.isArray(data.contacts)) {
      // Cache fresh data locally for instant offline availability
      saveLocalContacts(data.contacts);
      return {
        contacts: data.contacts,
        source: data.source || 'api',
        count: data.contacts.length,
        dbConnected: data.source === 'vercel_postgres',
      };
    }

    throw new Error('Respuesta de API inválida');
  } catch (err: any) {
    console.warn('⚠️ No se pudo obtener contactos desde la API, utilizando almacenamiento local:', err);
    const local = loadLocalContacts();
    return {
      contacts: local,
      source: 'offline_cache',
      count: local.length,
      dbConnected: false,
      error: err?.message || 'Error de conexión',
    };
  }
}

// Save or update a single contact in the database
export async function apiSaveContact(contact: Contact): Promise<{ contact: Contact; source: string }> {
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
      throw new Error(`Error en servidor (${res.status})`);
    }

    const data = await res.json();
    if (data.success && data.contact) {
      return { contact: data.contact, source: data.source || 'api' };
    }
    return { contact, source: 'local_cache' };
  } catch (err) {
    console.warn('⚠️ Guardado en API falló, persistiendo localmente:', err);
    return { contact, source: 'local_cache_offline' };
  }
}

// Delete contact from the database
export async function apiDeleteContact(id: string): Promise<{ success: boolean; source: string }> {
  try {
    const res = await fetch(`/api/contacts/${id}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`Error en servidor (${res.status})`);
    }

    const data = await res.json();
    return { success: Boolean(data.success), source: data.source || 'api' };
  } catch (err) {
    console.warn('⚠️ Eliminación en API falló, persistiendo localmente:', err);
    return { success: true, source: 'local_cache_offline' };
  }
}

// Batch import or sync contacts (merge or replace)
export async function apiBatchSync(
  contacts: Contact[],
  mode: 'merge' | 'replace' = 'merge'
): Promise<{ contacts: Contact[]; source: string }> {
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
      throw new Error(`Error en servidor (${res.status})`);
    }

    const data = await res.json();
    if (data.success && Array.isArray(data.contacts)) {
      saveLocalContacts(data.contacts);
      return { contacts: data.contacts, source: data.source || 'api' };
    }
    saveLocalContacts(contacts);
    return { contacts, source: 'local_cache' };
  } catch (err) {
    console.warn('⚠️ Sincronización batch en API falló, usando local:', err);
    saveLocalContacts(contacts);
    return { contacts, source: 'local_cache_offline' };
  }
}

// Reset database to defaults
export async function apiResetDatabase(): Promise<{ contacts: Contact[]; source: string }> {
  try {
    const res = await fetch('/api/contacts/reset', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`Error en servidor (${res.status})`);
    }

    const data = await res.json();
    if (data.success && Array.isArray(data.contacts)) {
      saveLocalContacts(data.contacts);
      return { contacts: data.contacts, source: data.source || 'api' };
    }
    throw new Error('Respuesta inválida');
  } catch (err) {
    console.warn('⚠️ Reset vía API falló, restaurando localmente:', err);
    const local = loadLocalContacts();
    return { contacts: local, source: 'local_cache_offline' };
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

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();
    return {
      connected: Boolean(data.connected),
      provider: data.provider || 'Desconocido',
      hasPostgresEnv: Boolean(data.hasPostgresEnv),
      tableInitialized: Boolean(data.tableInitialized),
      message: data.message || '',
    };
  } catch (err: any) {
    return {
      connected: false,
      provider: 'Sin conexión',
      hasPostgresEnv: false,
      tableInitialized: false,
      message: err?.message || 'No se pudo contactar al endpoint de estado',
    };
  }
}
