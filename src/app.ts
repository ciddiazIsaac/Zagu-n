import 'express-async-errors';
import express from 'express';
import path from 'path';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';

dotenv.config();

const app = express();

app.use(helmet({
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'"]
    }
  }
}));

app.use((_req, res, next) => {
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  next();
});

const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : (process.env.NODE_ENV === 'development' ? ['http://localhost:3000'] : []);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

app.get('/', (_req, res) => {
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Zaguán Auth API</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
      <link rel="stylesheet" href="/styles.css">
    </head>
    <body>
      <div class="container">
        <span class="door-icon">🚪</span>
        <h1>Zaguán Auth</h1>
        <span class="badge">Authentication Microservice</span>
        <p class="subtitle">JWT · Refresh Token Rotation · RBAC · PostgreSQL</p>
        
        <p class="section-label">Endpoints</p>
        <div class="endpoints">
          <div class="endpoint">
            <span class="method post">POST</span>
            <code>/auth/register</code>
          </div>
          <div class="endpoint">
            <span class="method post">POST</span>
            <code>/auth/login</code>
          </div>
          <div class="endpoint">
            <span class="method post">POST</span>
            <code>/auth/refresh</code>
          </div>
          <div class="endpoint">
            <span class="method post">POST</span>
            <code>/auth/logout</code>
          </div>
          <div class="endpoint">
            <span class="method get">GET</span>
            <code>/auth/me</code>
          </div>
          <div class="endpoint">
            <span class="method get">GET</span>
            <code>/health</code>
          </div>
        </div>

        <div class="stack">
          <span>Node.js</span>
          <span>TypeScript</span>
          <span>Express</span>
          <span>PostgreSQL</span>
          <span>bcrypt</span>
          <span>Zod</span>
        </div>
      </div>
    </body>
    </html>
  `;
  res.send(html);
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'zaguan-auth' });
});

app.use('/auth', authRoutes);

export default app;
