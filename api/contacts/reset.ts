import { resetDatabaseToDefault, formatDbError } from '../_db.ts';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: `Method ${req.method} not allowed`,
    });
  }

  try {
    const result = await resetDatabaseToDefault();
    return res.status(200).json({
      success: true,
      contacts: result.contacts,
      source: result.source,
      count: result.contacts.length,
    });
  } catch (error: any) {
    const dbErr = formatDbError(error);
    console.error('API Error in /api/contacts/reset:', error);
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
