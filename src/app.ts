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
      <style>
        body {
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          background: #0f172a;
          color: #f8fafc;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
        }
        .container {
          text-align: center;
          max-width: 600px;
          padding: 2rem;
          background: #1e293b;
          border-radius: 12px;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
          border: 1px solid #334155;
        }
        h1 {
          font-size: 2.5rem;
          margin-bottom: 0.5rem;
          background: -webkit-linear-gradient(45deg, #38bdf8, #818cf8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        p {
          color: #94a3b8;
          font-size: 1.1rem;
          line-height: 1.5;
          margin-bottom: 2rem;
        }
        .endpoints {
          display: grid;
          gap: 1rem;
          text-align: left;
        }
        .endpoint {
          background: #0f172a;
          padding: 1rem;
          border-radius: 8px;
          border: 1px solid #334155;
        }
        .method {
          display: inline-block;
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
          font-size: 0.8rem;
          font-weight: bold;
          margin-right: 0.5rem;
        }
        .method.post { background: #0ea5e9; color: #fff; }
        .method.get { background: #10b981; color: #fff; }
        code {
          color: #e2e8f0;
          font-family: monospace;
          font-size: 0.95rem;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Zaguán Auth 🚪</h1>
        <p>Microservicio de autenticación seguro con JWT, rotación de Refresh Tokens y Postgres.</p>
        
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
