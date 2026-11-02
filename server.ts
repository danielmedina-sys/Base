import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  getAllContacts,
  getContactById,
  upsertContact,
  deleteContact,
  batchSyncContacts,
  resetDatabaseToDefault,
  getDbStatus,
  formatDbError,
} from './server/db.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// Health and DB status
app.get('/api/status', async (_req: Request, res: Response) => {
  try {
    const status = await getDbStatus();
    res.json(status);
  } catch (err: any) {
    const dbErr = formatDbError(err);
    res.status(500).json({
      connected: false,
      success: false,
      error: dbErr.message,
      code: dbErr.code,
      detail: dbErr.detail,
      hint: dbErr.hint,
      envVarUsed: dbErr.envVarUsed,
    });
  }
});

// GET all contacts
app.get('/api/contacts', async (_req: Request, res: Response) => {
  try {
    const result = await getAllContacts();
    res.json({
      success: true,
      contacts: result.contacts,
      source: result.source,
      count: result.contacts.length,
    });
  } catch (err: any) {
    console.error('Error fetching contacts in /api/contacts:', err);
    const dbErr = formatDbError(err);
    res.status(500).json({
      success: false,
      error: dbErr.message,
      code: dbErr.code,
      detail: dbErr.detail,
      hint: dbErr.hint,
      envVarUsed: dbErr.envVarUsed,
    });
  }
});

// GET contact by ID
app.get('/api/contacts/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await getContactById(id);
    if (!result.contact) {
      return res.status(404).json({ success: false, error: `Contacto ${id} no encontrado` });
    }
    res.json({
      success: true,
      contact: result.contact,
      source: result.source,
    });
  } catch (err: any) {
    console.error('Error fetching contact in /api/contacts/:id:', err);
    const dbErr = formatDbError(err);
    res.status(500).json({
      success: false,
      error: dbErr.message,
      code: dbErr.code,
      detail: dbErr.detail,
      hint: dbErr.hint,
      envVarUsed: dbErr.envVarUsed,
    });
  }
});

// POST create or upsert contact
app.post('/api/contacts', async (req: Request, res: Response) => {
  try {
    const contact = req.body;
    if (!contact || !contact.id || !contact.name) {
      return res.status(400).json({ success: false, error: 'Contact ID and Name are required' });
    }
    const result = await upsertContact(contact);
    res.json({
      success: true,
      contact: result.contact,
      source: result.source,
    });
  } catch (err: any) {
    console.error('Error saving contact in /api/contacts:', err);
    const dbErr = formatDbError(err);
    res.status(500).json({
      success: false,
      error: dbErr.message,
      code: dbErr.code,
      detail: dbErr.detail,
      hint: dbErr.hint,
      envVarUsed: dbErr.envVarUsed,
    });
  }
});

// PUT update contact
app.put('/api/contacts/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const contact = req.body;
    if (!contact) {
      return res.status(400).json({ success: false, error: 'Contact data required' });
    }
    contact.id = id;
    const result = await upsertContact(contact);
    res.json({
      success: true,
      contact: result.contact,
      source: result.source,
    });
  } catch (err: any) {
    console.error('Error updating contact in /api/contacts/:id:', err);
    const dbErr = formatDbError(err);
    res.status(500).json({
      success: false,
      error: dbErr.message,
      code: dbErr.code,
      detail: dbErr.detail,
      hint: dbErr.hint,
      envVarUsed: dbErr.envVarUsed,
    });
  }
});

// DELETE contact
app.delete('/api/contacts/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await deleteContact(id);
    res.json({
      success: result.success,
      source: result.source,
    });
  } catch (err: any) {
    console.error('Error deleting contact in /api/contacts/:id:', err);
    const dbErr = formatDbError(err);
    res.status(500).json({
      success: false,
      error: dbErr.message,
      code: dbErr.code,
      detail: dbErr.detail,
      hint: dbErr.hint,
      envVarUsed: dbErr.envVarUsed,
    });
  }
});

// POST batch sync (for merge / replace)
app.post('/api/contacts/batch', async (req: Request, res: Response) => {
  try {
    const { contacts, mode = 'merge' } = req.body;
    if (!Array.isArray(contacts)) {
      return res.status(400).json({ success: false, error: 'contacts array is required' });
    }
    const result = await batchSyncContacts(contacts, mode);
    res.json({
      success: true,
      contacts: result.contacts,
      source: result.source,
      count: result.contacts.length,
    });
  } catch (err: any) {
    console.error('Error batch syncing contacts:', err);
    const dbErr = formatDbError(err);
    res.status(500).json({
      success: false,
      error: dbErr.message,
      code: dbErr.code,
      detail: dbErr.detail,
      hint: dbErr.hint,
      envVarUsed: dbErr.envVarUsed,
    });
  }
});

// POST reset to defaults
app.post('/api/contacts/reset', async (_req: Request, res: Response) => {
  try {
    const result = await resetDatabaseToDefault();
    res.json({
      success: true,
      contacts: result.contacts,
      source: result.source,
    });
  } catch (err: any) {
    console.error('Error resetting database:', err);
    const dbErr = formatDbError(err);
    res.status(500).json({
      success: false,
      error: dbErr.message,
      code: dbErr.code,
      detail: dbErr.detail,
      hint: dbErr.hint,
      envVarUsed: dbErr.envVarUsed,
    });
  }
});

// Mount Vite or serve static
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`🚀 BancaDatos server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
