import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import app from '../app';
import { pool } from '../config/db';

describe('Auth Endpoints', () => {
  // Limpieza de base de datos de test antes de cada prueba
  beforeEach(async () => {
    await pool.query('TRUNCATE users, refresh_tokens CASCADE;');
  });

  // Cerrar la conexión a DB al finalizar todos los tests
  afterAll(async () => {
    await pool.end();
  });

  describe('1. Registro', () => {
    it('Registro exitoso -> 201, devuelve id y email, NO devuelve password_hash', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({ email: 'test@zaguan.dev', password: 'SuperSecret123' });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('email', 'test@zaguan.dev');
      expect(res.body).toHaveProperty('role', 'user');
      expect(res.body).not.toHaveProperty('password_hash');
    });

    it('Registro con email duplicado -> 409', async () => {
      // Primer registro
      await request(app)
        .post('/auth/register')
        .send({ email: 'test@zaguan.dev', password: 'SuperSecret123' });

      // Segundo registro con mismo email
      const res = await request(app)
        .post('/auth/register')
        .send({ email: 'test@zaguan.dev', password: 'OtraPassword456' });

      expect(res.status).toBe(409);
      expect(res.body).toHaveProperty('error');
    });

    it('Registro con password menor a 8 caracteres -> 400', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({ email: 'short@zaguan.dev', password: '123' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('2. Login', () => {
    beforeEach(async () => {
      await request(app)
        .post('/auth/register')
        .send({ email: 'login@zaguan.dev', password: 'ValidPassword123' });
    });

    it('Login exitoso -> 200, devuelve accessToken y refreshToken', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ email: 'login@zaguan.dev', password: 'ValidPassword123' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
    });

    it('Login con password incorrecta -> 401', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ email: 'login@zaguan.dev', password: 'WrongPassword' });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error', 'Credenciales inválidas');
    });

    it('Login con email inexistente -> 401 (mismo mensaje de error)', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ email: 'ghost@zaguan.dev', password: 'AnyPassword' });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error', 'Credenciales inválidas');
    });
  });

  describe('3. Ruta protegida /me', () => {
    let accessToken = '';

    beforeEach(async () => {
      await request(app)
        .post('/auth/register')
        .send({ email: 'me@zaguan.dev', password: 'MePassword123' });

      const loginRes = await request(app)
        .post('/auth/login')
        .send({ email: 'me@zaguan.dev', password: 'MePassword123' });
      
      accessToken = loginRes.body.accessToken;
    });

    it('Sin token -> 401', async () => {
      const res = await request(app).get('/auth/me');
      expect(res.status).toBe(401);
    });

    it('Con token inválido/manipulado -> 401', async () => {
      const res = await request(app)
        .get('/auth/me')
        .set('Authorization', `Bearer ${accessToken}manipulado`);
      
      expect(res.status).toBe(401);
    });

    it('Con token válido -> 200, devuelve el userId correcto', async () => {
      const res = await request(app)
        .get('/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('userId');
      expect(res.body).toHaveProperty('role', 'user');
    });
  });

  describe('4. Refresh y rotación', () => {
    let oldRefreshToken = '';

    beforeEach(async () => {
      await request(app)
        .post('/auth/register')
        .send({ email: 'refresh@zaguan.dev', password: 'RefreshPass123' });

      const loginRes = await request(app)
        .post('/auth/login')
        .send({ email: 'refresh@zaguan.dev', password: 'RefreshPass123' });
      
      oldRefreshToken = loginRes.body.refreshToken;
    });

    it('Refresh válido -> 200, nuevo accessToken + nuevo refreshToken', async () => {
      const res = await request(app)
        .post('/auth/refresh')
        .send({ refreshToken: oldRefreshToken });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
      expect(res.body.refreshToken).not.toBe(oldRefreshToken);
    });

    it('Reutilizar el refresh token viejo después de rotarlo -> debe fallar con 401', async () => {
      // 1. Primer refresh (vuelve inválido al token original)
      await request(app)
        .post('/auth/refresh')
        .send({ refreshToken: oldRefreshToken });

      // 2. Intento de reutilización maliciosa del viejo token
      const res = await request(app)
        .post('/auth/refresh')
        .send({ refreshToken: oldRefreshToken });

      // Este es el test de regresión del bug que arreglaste
      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error', 'Refresh token inválido o revocado');
    });
  });

  describe('5. Logout', () => {
    let refreshToken = '';

    beforeEach(async () => {
      await request(app)
        .post('/auth/register')
        .send({ email: 'logout@zaguan.dev', password: 'LogoutPass123' });

      const loginRes = await request(app)
        .post('/auth/login')
        .send({ email: 'logout@zaguan.dev', password: 'LogoutPass123' });
      
      refreshToken = loginRes.body.refreshToken;
    });

    it('Logout revoca el token -> intento de refresh posterior con ese token -> 401', async () => {
      // 1. Hacemos logout
      const logoutRes = await request(app)
        .post('/auth/logout')
        .send({ refreshToken });

      expect(logoutRes.status).toBe(204);

      // 2. Intentamos usar el token para un refresh
      const refreshRes = await request(app)
        .post('/auth/refresh')
        .send({ refreshToken });

      expect(refreshRes.status).toBe(401);
    });
  });
});
