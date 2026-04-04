import { loadConfig } from './config';
import { verifyToken } from '../utils/token';

export async function authMiddleware(req: Request, res: Response) {
  const token = req.headers.authorization;
  if (!token) return res.status(401).json({ error: 'Missing authorization header' });

  try {
    const user = await verifyToken(token.replace('Bearer ', ''));
    req.user = user;
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}
