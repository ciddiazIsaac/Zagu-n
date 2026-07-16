import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { z } from 'zod';
import {
  findUserByEmail,
  createUser,
  storeRefreshToken,
  isRefreshTokenValid,
  revokeRefreshToken,
} from '../models/user.model';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
});

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function register(req: Request, res: Response) {
  const parsed = credentialsSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.errors[0].message });
  }
  const { email, password } = parsed.data;

  const existing = await findUserByEmail(email);
  if (existing) {
    return res.status(409).json({ error: 'El email ya está registrado' });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await createUser(email, passwordHash);

  return res.status(201).json({ id: user.id, email: user.email, role: user.role });
}

export async function login(req: Request, res: Response) {
  const parsed = credentialsSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Credenciales inválidas' });
  }
  const { email, password } = parsed.data;

  const user = await findUserByEmail(email);
  if (!user) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }

  const validPassword = await bcrypt.compare(password, user.password_hash);
  if (!validPassword) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }

  const payload = { userId: user.id, role: user.role };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  await storeRefreshToken(user.id, hashToken(refreshToken), expiresAt);

  return res.json({ accessToken, refreshToken });
}

export async function refresh(req: Request, res: Response) {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ error: 'refreshToken es requerido' });
  }

  try {
    const payload = verifyRefreshToken(refreshToken);
    const tokenHash = hashToken(refreshToken);

    const valid = await isRefreshTokenValid(payload.userId, tokenHash);
    if (!valid) {
      return res.status(401).json({ error: 'Refresh token inválido o revocado' });
    }

    // Rotacion: revocar el token usado y emitir uno nuevo
    await revokeRefreshToken(payload.userId, tokenHash);

    const newPayload = { userId: payload.userId, role: payload.role };
    const newAccessToken = signAccessToken(newPayload);
    const newRefreshToken = signRefreshToken(newPayload);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await storeRefreshToken(payload.userId, hashToken(newRefreshToken), expiresAt);

    return res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch {
    return res.status(401).json({ error: 'Refresh token inválido o expirado' });
  }
}

export async function logout(req: Request, res: Response) {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ error: 'refreshToken es requerido' });
  }
  try {
    const payload = verifyRefreshToken(refreshToken);
    await revokeRefreshToken(payload.userId, hashToken(refreshToken));
    return res.status(204).send();
  } catch {
    return res.status(401).json({ error: 'Refresh token inválido' });
  }
}
