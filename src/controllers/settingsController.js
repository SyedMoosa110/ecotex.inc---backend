import { getDb, updateDb } from '../database/db.js';
import logger from '../utils/logger.js';

export async function getSettings(req, res) {
  try {
    const db = getDb();
    res.json(db.settings || {});
  } catch (err) {
    logger.error('Error fetching settings:', err);
    res.status(500).json({ error: 'Failed to retrieve site settings' });
  }
}

export async function updateSettings(req, res) {
  try {
    const updates = req.body || {};
    let updatedSettings = null;

    await updateDb((db) => {
      db.settings = {
        ...(db.settings || {}),
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      updatedSettings = db.settings;
      return db;
    });

    res.json(updatedSettings);
  } catch (err) {
    logger.error('Error updating settings:', err);
    res.status(500).json({ error: 'Failed to update site settings' });
  }
}

export default {
  getSettings,
  updateSettings,
};
