import express from 'express';
import { getStats } from '../controllers/statsController.js';

export const statsRouter = express.Router();

statsRouter.get('/', getStats);

export default statsRouter;
