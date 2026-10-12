import express from 'express';
import {
  getAllMessages,
  saveMessageThread,
  replyToMessageThread
} from '../controllers/messagesController.js';

export const messagesRouter = express.Router();

messagesRouter.get('/', getAllMessages);
messagesRouter.post('/', saveMessageThread);
messagesRouter.post('/:id/reply', replyToMessageThread);

export default messagesRouter;
