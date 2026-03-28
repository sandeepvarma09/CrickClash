import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  userId?: string;
  isAdmin?: boolean;
}

interface JwtPayload {
  id: string;
  isAdmin?: boolean;
}

/** Protect user routes — requires valid JWT */
export const protect = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Not authorised. No token provided.' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as JwtPayload;
    req.userId = decoded.id;
    req.isAdmin = decoded.isAdmin || false;
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Not authorised. Invalid or expired token.' });
  }
};

/** Protect admin-only routes */
export const adminOnly = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.isAdmin) {
    res.status(403).json({ success: false, message: 'Access denied. Admins only.' });
    return;
  }
  next();
};
