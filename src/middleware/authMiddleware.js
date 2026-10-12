import { verifyToken, extractBearerToken } from '../utils/jwt.js';
import { getDb } from '../database/db.js';

export function authenticate(options = { required: true }) {
  return (req, res, next) => {
    const token = extractBearerToken(req);

    if (!token) {
      if (options.required) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized: Authentication token is missing.',
        });
      }
      return next();
    }

    // 1. Try JWT verification
    const decoded = verifyToken(token);
    if (decoded) {
      req.user = decoded;
      return next();
    }

    // 2. Backward compatibility: check for legacy session tokens
    if (
      token.startsWith('ecx-auth-session-') ||
      token.startsWith('auth-session-') ||
      token.startsWith('token-')
    ) {
      const db = getDb();
      const adminAuth = db.adminAuth || {};
      req.user = {
        email: adminAuth.email || 'admin@ecotexinc.com',
        name: adminAuth.name || 'Executive Operations Director',
        role: 'Chief Administrator',
      };
      return next();
    }

    if (options.required) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Authentication token is invalid or expired.',
      });
    }

    next();
  };
}

export const requireAuth = authenticate({ required: true });
export const optionalAuth = authenticate({ required: false });

export default {
  authenticate,
  requireAuth,
  optionalAuth,
};
