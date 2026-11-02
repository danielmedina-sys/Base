import {
  getContactById,
  upsertContact,
  deleteContact,
  formatDbError,
} from '../../server/db.ts';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,DELETE,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Extract ID from query param (set automatically by Vercel for [id].ts) or path
  const id = req.query?.id ? String(req.query.id) : null;

  if (!id) {
    return res.status(400).json({
      success: false,
      error: 'Contact ID is required in URL parameter',
    });
  }

  try {
    if (req.method === 'GET') {
      const result = await getContactById(id);
      if (!result.contact) {
        return res.status(404).json({
          success: false,
          error: `Contacto con ID ${id} no encontrado`,
        });
      }
      return res.status(200).json({
        success: true,
        contact: result.contact,
        source: result.source,
      });
    }

    if (req.method === 'PUT') {
      const contact = req.body?.contact || req.body;
      if (!contact) {
        return res.status(400).json({
          success: false,
          error: 'Cuerpo de solicitud requerido con datos del contacto',
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
      const result = await deleteContact(id);
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
    console.error(`API Error in /api/contacts/[id] (ID: ${id}):`, error);
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
