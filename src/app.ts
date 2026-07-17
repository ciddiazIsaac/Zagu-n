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
  res.json({
    message: 'Bienvenido a Zaguán Auth API 🚪',
    version: '1.0.0',
    docs: 'Endpoints disponibles: /health, /auth/register, /auth/login, /auth/me, /auth/refresh, /auth/logout'
  });
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'zaguan-auth' });
});

app.use('/auth', authRoutes);

export default app;
