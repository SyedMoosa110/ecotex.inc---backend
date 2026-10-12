import express from 'express';
import { login, getMe, updateCredentials } from '../controllers/authController.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { requireAuth } from '../middleware/authMiddleware.js';

export const authRouter = express.Router();

authRouter.post('/login', authLimiter, login);
authRouter.get('/me', requireAuth, getMe);
authRouter.put('/credentials', updateCredentials);

export default authRouter;
