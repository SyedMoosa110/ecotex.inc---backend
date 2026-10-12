import express from 'express';
import {
  getAllQuotes,
  getQuoteById,
  createQuote,
  updateQuoteStatus,
  deleteQuote,
} from '../controllers/quotesController.js';
import { quotesLimiter } from '../middleware/rateLimiter.js';

export const quotesRouter = express.Router();

quotesRouter.get('/', getAllQuotes);
quotesRouter.get('/:id', getQuoteById);
quotesRouter.post('/', quotesLimiter, createQuote);
quotesRouter.patch('/:id/status', updateQuoteStatus);
quotesRouter.delete('/:id', deleteQuote);

export default quotesRouter;
