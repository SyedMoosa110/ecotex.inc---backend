import express from 'express';
import { resetDb } from '../database/db.js';

export const resetRouter = express.Router();

resetRouter.post('/', async (req, res) => {
  try {
    await resetDb();
    res.json({ success: true, message: 'Database reset to factory state successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Database reset failed.' });
  }
});

export default resetRouter;
