import 'express-async-errors';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';

dotenv.config();

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

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
      <style>
        *, *::before, *::after { box-sizing: border-box; }
        body {
          margin: 0;
          padding: 2rem 1rem;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          background: #080e1a;
          background-image:
            radial-gradient(ellipse 80% 50% at 50% -10%, rgba(56,189,248,0.08), transparent),
            radial-gradient(ellipse 60% 40% at 80% 100%, rgba(129,140,248,0.07), transparent);
          color: #f8fafc;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
        }
        .container {
          text-align: center;
          width: 100%;
          max-width: 620px;
          padding: 2.5rem 2rem;
          background: rgba(30, 41, 59, 0.7);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-radius: 16px;
          box-shadow: 0 0 0 1px rgba(255,255,255,0.06), 0 20px 40px -8px rgba(0,0,0,0.6);
          border: 1px solid #1e3a5f;
        }
        .door-icon {
          font-size: 3.5rem;
          line-height: 1;
          display: block;
          margin-bottom: 0.75rem;
          filter: drop-shadow(0 0 12px rgba(56,189,248,0.4));
          animation: float 3s ease-in-out infinite;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-6px); }
        }
        h1 {
          font-size: 2.25rem;
          font-weight: 700;
          margin: 0 0 0.4rem;
          letter-spacing: -0.02em;
          background: linear-gradient(90deg, #38bdf8 0%, #818cf8 50%, #c084fc 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .badge {
          display: inline-block;
          font-size: 0.72rem;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 0.25rem 0.7rem;
          border-radius: 999px;
          background: rgba(56,189,248,0.12);
          border: 1px solid rgba(56,189,248,0.25);
          color: #38bdf8;
          margin-bottom: 1.25rem;
        }
        p.subtitle {
          color: #94a3b8;
          font-size: 1rem;
          line-height: 1.6;
          margin: 0 0 2rem;
        }
        .section-label {
          text-align: left;
          font-size: 0.7rem;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #475569;
          margin-bottom: 0.75rem;
        }
        .endpoints {
          display: grid;
          gap: 0.5rem;
          text-align: left;
          margin-bottom: 1.5rem;
        }
        .endpoint {
          background: rgba(15, 23, 42, 0.8);
          padding: 0.75rem 1rem;
          border-radius: 8px;
          border: 1px solid #1e3a5f;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: border-color 0.2s, background 0.2s;
        }
        .endpoint:hover {
          border-color: rgba(56,189,248,0.3);
          background: rgba(56,189,248,0.04);
        }
        .method {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 3.8rem;
          padding: 0.2rem 0;
          border-radius: 4px;
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          flex-shrink: 0;
        }
        .method.post { background: rgba(14,165,233,0.15); color: #38bdf8; border: 1px solid rgba(14,165,233,0.3); }
        .method.get  { background: rgba(16,185,129,0.15); color: #34d399; border: 1px solid rgba(16,185,129,0.3); }
        code {
          color: #e2e8f0;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.88rem;
        }
        .stack {
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem;
          justify-content: center;
          padding-top: 1.5rem;
          border-top: 1px solid #1e293b;
        }
        .stack span {
          font-size: 0.72rem;
          font-weight: 500;
          padding: 0.2rem 0.6rem;
          border-radius: 999px;
          background: rgba(255,255,255,0.04);
          border: 1px solid #334155;
          color: #64748b;
        }
      </style>
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
