import { pool } from '../config/db';

export interface User {
  id: string;
  email: string;
  password_hash: string;
  role: 'user' | 'admin';
  created_at: Date;
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0] ?? null;
}

export async function findUserById(id: string): Promise<User | null> {
  const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
  return result.rows[0] ?? null;
}

export async function createUser(email: string, passwordHash: string): Promise<User> {
  const result = await pool.query(
    `INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING *`,
    [email, passwordHash]
  );
  return result.rows[0];
}

export async function storeRefreshToken(userId: string, tokenHash: string, expiresAt: Date): Promise<void> {
  await pool.query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
    [userId, tokenHash, expiresAt]
  );
}

export async function isRefreshTokenValid(userId: string, tokenHash: string): Promise<boolean> {
  const result = await pool.query(
    `SELECT 1 FROM refresh_tokens
     WHERE user_id = $1 AND token_hash = $2 AND revoked = false AND expires_at > now()`,
    [userId, tokenHash]
  );
  return (result.rowCount ?? 0) > 0;
}

export async function revokeRefreshToken(userId: string, tokenHash: string): Promise<void> {
  await pool.query(
    `UPDATE refresh_tokens SET revoked = true WHERE user_id = $1 AND token_hash = $2`,
    [userId, tokenHash]
  );
}
