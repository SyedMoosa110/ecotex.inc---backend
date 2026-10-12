import express from 'express';
import { getHealth } from '../controllers/healthController.js';

export const healthRouter = express.Router();

healthRouter.get('/health', getHealth);
healthRouter.get('/ping', (req, res) => res.send('pong'));

export default healthRouter;
