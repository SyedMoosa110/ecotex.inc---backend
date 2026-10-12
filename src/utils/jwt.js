import jwt from 'jsonwebtoken';
import config from '../config/index.js';

export function signToken(payload, options = {}) {
  const signOptions = {
    expiresIn: config.jwt.expiresIn,
    ...options,
  };
  return jwt.sign(payload, config.jwt.secret, signOptions);
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, config.jwt.secret);
  } catch (err) {
    return null;
  }
}

export function extractBearerToken(req) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || typeof authHeader !== 'string') {
    return null;
  }
  const parts = authHeader.trim().split(' ');
  if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
    return parts[1];
  }
  return authHeader.trim();
}
