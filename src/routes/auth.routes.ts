import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { register, login, refresh, logout } from '../controllers/auth.controller';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.middleware';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: Number(process.env.LOGIN_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.LOGIN_RATE_LIMIT_MAX) || 5,
  message: { error: 'Demasiados intentos de login, intenta de nuevo más tarde' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/register', register);
router.post('/login', loginLimiter, login);
router.post('/refresh', refresh);
router.post('/logout', logout);

// Ruta de ejemplo protegida, para verificar que el middleware funciona
router.get('/me', requireAuth, (req: AuthenticatedRequest, res) => {
  res.json({ userId: req.user?.userId, role: req.user?.role });
});

export default router;
