import {
  getAllContacts,
  upsertContact,
  deleteContact,
  batchSyncContacts,
  resetDatabaseToDefault,
  formatDbError,
} from '../server/db.ts';

export default async function handler(req: any, res: any) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      const result = await getAllContacts();
      return res.status(200).json({
        success: true,
        contacts: result.contacts,
        source: result.source,
        count: result.contacts.length,
      });
    }

    if (req.method === 'POST') {
      const body = req.body || {};

      // Handle batch / reset actions
      if (body.action === 'reset') {
        const result = await resetDatabaseToDefault();
        return res.status(200).json({
          success: true,
          contacts: result.contacts,
          source: result.source,
        });
      }

      if (Array.isArray(body.contacts)) {
        const result = await batchSyncContacts(body.contacts, body.mode || 'merge');
        return res.status(200).json({
          success: true,
          contacts: result.contacts,
          source: result.source,
          count: result.contacts.length,
        });
      }

      // Upsert single contact
      const contact = body.contact || body;
      if (!contact || !contact.id || !contact.name) {
        return res.status(400).json({
          success: false,
          error: 'Contact ID and Name are required',
        });
      }

      const result = await upsertContact(contact);
      return res.status(200).json({
        success: true,
        contact: result.contact,
        source: result.source,
      });
    }

    if (req.method === 'PUT') {
      const contact = req.body?.contact || req.body;
      const id = req.query?.id || contact?.id;
      if (!contact || !id) {
        return res.status(400).json({
          success: false,
          error: 'Contact data and ID are required',
        });
      }
      contact.id = id;
      const result = await upsertContact(contact);
      return res.status(200).json({
        success: true,
        contact: result.contact,
        source: result.source,
      });
    }

    if (req.method === 'DELETE') {
      const id = req.query?.id || req.body?.id;
      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Contact ID is required',
        });
      }
      const result = await deleteContact(String(id));
      return res.status(200).json({
        success: result.success,
        source: result.source,
      });
    }

    return res.status(405).json({
      success: false,
      error: `Method ${req.method} not allowed`,
    });
  } catch (error: any) {
    const dbErr = formatDbError(error);
    console.error('API Error in /api/contacts:', error);
    return res.status(500).json({
      success: false,
      error: dbErr.message,
      code: dbErr.code,
      detail: dbErr.detail,
      hint: dbErr.hint,
      envVarUsed: dbErr.envVarUsed,
      isPrisma: dbErr.isPrisma,
    });
  }
}
