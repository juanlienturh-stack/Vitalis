import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";

const SECRET = process.env.SESSION_SECRET || "vitalis-secret-key";

export interface JwtPayload {
  userId: number;
  email: string;
  name: string;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: "30d" });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No autorizado" });
  }
  const token = auth.slice(7);
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: "Token inválido" });
  }
  (req as any).user = payload;
  next();
}
