import { getDbStatus } from '../server/db.ts';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const status = await getDbStatus();
    return res.status(200).json(status);
  } catch (error: any) {
    return res.status(500).json({
      connected: false,
      error: error?.message || 'Error checking status',
    });
  }
}
