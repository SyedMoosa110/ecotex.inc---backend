import { getDb, updateDb } from '../database/db.js';
import logger from '../utils/logger.js';

export async function getAllTestimonials(req, res) {
  try {
    const db = getDb();
    res.json(db.testimonials || []);
  } catch (err) {
    logger.error('Error fetching testimonials:', err);
    res.status(500).json({ error: 'Failed to retrieve testimonials' });
  }
}

export async function createTestimonial(req, res) {
  try {
    const body = req.body || {};
    const newTestimonial = {
      id: body.id || `t-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      quote: body.quote || '',
      author: body.author || 'Verified Client',
      role: body.role || 'Procurement Officer',
      company: body.company || '',
      rating: Number(body.rating) || 5,
      avatar: body.avatar || '',
      createdAt: new Date().toISOString(),
    };

    await updateDb((db) => {
      db.testimonials = db.testimonials || [];
      db.testimonials.push(newTestimonial);
      return db;
    });

    res.status(201).json(newTestimonial);
  } catch (err) {
    logger.error('Error creating testimonial:', err);
    res.status(500).json({ error: 'Failed to create testimonial' });
  }
}

export async function updateTestimonial(req, res) {
  try {
    const { id } = req.params;
    let updatedItem = null;

    await updateDb((db) => {
      const idx = db.testimonials?.findIndex((t) => t.id === id);
      if (idx === -1 || idx === undefined) return db;

      updatedItem = {
        ...db.testimonials[idx],
        ...req.body,
        id,
        updatedAt: new Date().toISOString(),
      };

      db.testimonials[idx] = updatedItem;
      return db;
    });

    if (!updatedItem) {
      return res.status(404).json({ error: 'Testimonial not found' });
    }

    res.json(updatedItem);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update testimonial' });
  }
}

export async function deleteTestimonial(req, res) {
  try {
    const { id } = req.params;
    let deletedItem = null;

    await updateDb((db) => {
      const idx = db.testimonials?.findIndex((t) => t.id === id);
      if (idx === -1 || idx === undefined) return db;

      const removed = db.testimonials.splice(idx, 1);
      deletedItem = removed[0];
      return db;
    });

    if (!deletedItem) {
      return res.status(404).json({ error: 'Testimonial not found' });
    }

    res.json({ success: true, deleted: deletedItem });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete testimonial' });
  }
}

export default {
  getAllTestimonials,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
};
