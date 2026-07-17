# Zaguán Auth 🚪

> **Stateless JWT authentication microservice** with refresh token rotation, role-based access control, and brute-force protection — designed to be embedded into any Node.js backend or run as a standalone auth service.

---

## Why Another Auth Service?

Most teams reach for Auth0, Clerk, or Firebase Auth without asking whether they actually need a managed SaaS — and then discover the pricing cliff at scale or the inflexibility when custom claims are required.

Zaguán takes the opposite approach: **own your auth layer, keep it small, keep it auditable**. The implementation surface is intentionally minimal so any engineer on the team can fully understand every line running in production. That's not a limitation — it's the design goal.

**What it solves:**
- Secure password hashing (bcrypt, configurable cost factor)
- Short-lived access tokens + long-lived, single-use refresh tokens with automatic rotation
- Revocable sessions stored **hashed** in PostgreSQL — no plain tokens at rest, ever
- Role-based middleware ready to protect any Express route
- Rate limiting on login endpoints to mitigate credential-stuffing attacks

---

## Live Demo

🚀 **Base URL:** `https://zagu-n.onrender.com`

> **Cold-start notice:** Hosted on Render's free tier. First request after ~15 min of inactivity may take up to 50 s while the instance warms up. Subsequent requests are immediate.

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│                  Express App                    │
│                                                 │
│  POST /auth/register  →  hash → insert user     │
│  POST /auth/login     →  verify → issue tokens  │
│  POST /auth/refresh   →  rotate refresh token   │
│  POST /auth/logout    →  revoke refresh token   │
│  GET  /auth/me        →  validate Bearer JWT    │
│                                                 │
│  Middleware: authenticate · authorize(role)     │
│  Middleware: rate-limit (express-rate-limit)    │
└─────────────────┬───────────────────────────────┘
                  │
        ┌─────────▼─────────┐
        │    PostgreSQL      │
        │  users             │
        │  refresh_tokens    │
        └────────────────────┘
```

**Token lifecycle:**
1. `POST /auth/login` → issues `accessToken` (15 min) + `refreshToken` (7 days, stored hashed)
2. `POST /auth/refresh` → validates token hash, **immediately invalidates it**, issues a new pair
3. `POST /auth/logout` → hard-revokes the refresh token; subsequent refresh attempts return `401`

This design means token theft *during* a refresh is detectable: a second use of the same refresh token creates a hash conflict and can trigger full session revocation as an escalation policy.

---

## Tech Stack

| Layer | Choice | Rationale |
|---|---|---|
| Runtime | Node.js 20 LTS | Long-term support, native ESM |
| Language | TypeScript 5 | Type safety across the auth boundary |
| Framework | Express 4 | Mature, minimal, well-understood operational profile |
| Database | PostgreSQL 15 | ACID guarantees for token revocation semantics |
| Driver | `pg` (raw SQL) | No ORM magic, full control over query plans |
| Validation | Zod | Schema-first, parse-don't-validate at every API boundary |
| Hashing | bcrypt | Industry standard for password hashing |
| JWT | `jsonwebtoken` | RFC 7519 compliant, configurable algorithms |
| Tests | Vitest + Supertest | Fast, ESM-native, integration-level coverage |

---

## Getting Started

### Prerequisites

- Node.js ≥ 20
- PostgreSQL ≥ 14 (local or cloud — [Neon](https://neon.tech) works well for free-tier dev)

### Local Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Fill in DATABASE_URL and generate two independent JWT secrets:
#   openssl rand -hex 32  →  ACCESS_TOKEN_SECRET
#   openssl rand -hex 32  →  REFRESH_TOKEN_SECRET

# 3. Run the migration
psql $DATABASE_URL -f migrations/001_create_users.sql

# 4. Start the dev server (ts-node-dev, hot reload)
npm run dev

# 5. Smoke test
curl http://localhost:3000/health
```

---

## API Reference

### `POST /auth/register`
Creates a new user. Password is hashed before storage — the plain-text value never touches the database layer.

```json
// Request
{ "email": "user@example.com", "password": "min8chars" }

// 201 Created
{ "message": "User created" }
```

---

### `POST /auth/login`
Authenticates credentials and issues a token pair. Rate-limited to **10 attempts / 15 min per IP**.

```json
// Request
{ "email": "user@example.com", "password": "min8chars" }

// 200 OK
{
  "accessToken":  "<JWT — expires in 15 min>",
  "refreshToken": "<opaque token — valid 7 days, single-use>"
}
```

---

### `POST /auth/refresh`
Rotates the refresh token. The submitted token is **invalidated immediately** — by design, even if the response is dropped in transit.

```json
// Request
{ "refreshToken": "<current refresh token>" }

// 200 OK
{
  "accessToken":  "<new JWT>",
  "refreshToken": "<new refresh token>"
}
```

---

### `POST /auth/logout`
Revokes the refresh token, ending the session server-side.

```json
// Request
{ "refreshToken": "<token to revoke>" }

// 200 OK
{ "message": "Logged out" }
```

---

### `GET /auth/me`
Returns the authenticated user's profile. Requires a valid access token.

```
Authorization: Bearer <accessToken>
```

```json
// 200 OK
{ "id": 1, "email": "user@example.com", "role": "user" }
```

---

## Endpoint Summary

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/auth/register` | — | Register new user |
| POST | `/auth/login` | — | Authenticate, receive token pair |
| POST | `/auth/refresh` | — | Rotate refresh token |
| POST | `/auth/logout` | — | Revoke refresh token |
| GET | `/auth/me` | Bearer JWT | Get current user |
| GET | `/health` | — | Liveness probe |

---

## Running Tests

```bash
npm test
```

Coverage: registration, duplicate email rejection, login success/failure, protected route access with and without valid token, and refresh token rotation integrity (reuse attempt returns 401).

---

## Deployment

The service is **stateless at the process level** — horizontal scaling is safe as long as all instances share the same PostgreSQL instance. Deploy behind any reverse proxy (nginx, Caddy) or on any PaaS that supports Node.js.

**Required environment variables:**

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `ACCESS_TOKEN_SECRET` | Signing secret for access JWTs |
| `REFRESH_TOKEN_SECRET` | Signing secret for refresh JWTs |
| `PORT` | Server port (default: `3000`) |

---

## Roadmap

- [ ] Password reset via email (SMTP / Resend)
- [ ] OAuth 2.0 social login (Google, GitHub)
- [ ] TOTP-based two-factor authentication
- [ ] Audit log table for security events
- [ ] Admin endpoint to list and revoke active sessions
- [ ] OpenAPI 3.1 spec + Swagger UI

---

## License

MIT
