# Zaguán 🚪

> El zaguán es la entrada de la casa: el punto que controla quién pasa y quién no.
> Un servicio de autenticación reusable — JWT + refresh tokens + roles — listo para
> integrarse en cualquier backend.

## Brief del producto

**Problema que resuelve:** casi todo backend necesita login seguro, pero implementarlo
bien (hash correcto, rotación de refresh tokens, rate limiting anti fuerza bruta, roles)
toma tiempo y es fácil hacerlo mal. Zaguán es ese módulo, ya hecho bien, listo para
integrar o para ofrecer como servicio a clientes.

**A quién se lo vendes:** startups o negocios chicos que necesitan un sistema de login
seguro para su app/web y no quieren (o no saben) implementarlo desde cero.

## Alcance del MVP (v1)

- [x] Registro de usuario (email + password, hash con bcrypt)
- [x] Login → access token (corto) + refresh token (largo, guardado hasheado en DB)
- [x] Endpoint de renovación de token con **rotación** de refresh token (más seguro:
      cada refresh token solo se usa una vez)
- [x] Logout (revoca el refresh token)
- [x] Middleware de autenticación (protege rutas)
- [x] Roles básicos (`user` / `admin`)
- [x] Rate limiting en `/login` (anti fuerza bruta)
- [x] Tests del flujo principal
- [x] Deploy con demo en vivo (Render + Neon)

**Fuera de alcance en v1** (anótalo para v2, no lo agregues ahora):
recuperación de contraseña por email, OAuth social login, 2FA.

## Demo en Vivo

🚀 **API Pública:** `https://zagu-n.onrender.com`

> **Nota sobre Cold-Start:** Este servicio está alojado en el nivel gratuito de Render. Si no recibe peticiones durante 15 minutos, el servidor entra en suspensión (spin-down). La primera petición después de un rato puede tardar ~50 segundos en responder mientras el servidor se despierta. Las siguientes peticiones serán instantáneas.

## Cómo levantar el proyecto

1. Instala dependencias:
   ```bash
   npm install
   ```
2. Crea una base de datos PostgreSQL local y copia `.env.example` a `.env`,
   completando `DATABASE_URL` y generando dos secretos JWT distintos
   (puedes generarlos con `openssl rand -hex 32`).
3. Corre la migración inicial:
   ```bash
   psql $DATABASE_URL -f migrations/001_create_users.sql
   ```
4. Levanta el servidor en modo desarrollo:
   ```bash
   npm run dev
   ```
5. Verifica que esté vivo:
   ```bash
   curl http://localhost:3000/health
   ```

## Endpoints

| Método | Ruta            | Auth requerida | Descripción                          |
|--------|-----------------|----------------|---------------------------------------|
| POST   | `/auth/register`| No             | Crea un usuario nuevo                 |
| POST   | `/auth/login`    | No             | Devuelve accessToken + refreshToken   |
| POST   | `/auth/refresh`  | No (usa refreshToken en body) | Rota tokens          |
| POST   | `/auth/logout`   | No (usa refreshToken en body) | Revoca el refresh token |
| GET    | `/auth/me`       | Sí (Bearer)    | Devuelve el usuario autenticado       |

## Próximos pasos (en orden — como CTO, este es tu roadmap real)

1. **Corre el proyecto localmente** y prueba los 5 endpoints con Postman/Thunder Client
   o `curl`. No sigas al paso 2 hasta que los 5 funcionen sin errores.
2. **Escribe tests** con Vitest + Supertest para: registro exitoso, registro con email
   duplicado, login exitoso, login con password incorrecto, acceso a `/me` sin token
   (debe fallar), acceso a `/me` con token válido (debe funcionar).
3. **Sube el repo a GitHub** con este README (edítalo con capturas de las pruebas
   cuando tengas Postman/Thunder Client corriendo).
4. **Haz deploy** en Render o Railway (tienen tier gratuito) + una base de datos
   Postgres gratuita (Neon o Supabase). Esto te da el "demo en vivo" que hace que
   un cliente confíe con solo ver el link.
5. Recién ahí, vuelve conmigo y armamos tu descripción de servicio para Upwork/Fiverr
   usando este proyecto como prueba.

## Stack

Node.js · TypeScript · Express · PostgreSQL · JWT · bcrypt · Zod (validación) · Vitest (tests)
