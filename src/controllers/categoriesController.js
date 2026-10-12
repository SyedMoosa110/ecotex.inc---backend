import { getDb, updateDb } from '../database/db.js';
import logger from '../utils/logger.js';

export async function getAllCategories(req, res) {
  try {
    const db = getDb();
    res.json(db.categories || []);
  } catch (err) {
    logger.error('Error fetching categories:', err);
    res.status(500).json({ error: 'Failed to retrieve categories' });
  }
}

export async function getCategoryById(req, res) {
  try {
    const db = getDb();
    const cat = db.categories?.find((c) => c.id === req.params.id);
    if (!cat) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json(cat);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve category' });
  }
}

export async function createCategory(req, res) {
  try {
    const body = req.body || {};
    const label = (body.label || '').trim();

    if (!label) {
      return res.status(400).json({ error: 'Category label is required.' });
    }

    const newCategory = {
      id: body.id || `cat-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      label,
      subtitle: body.subtitle || '',
      tag: body.tag || 'ECO PACKAGING',
      count: body.count || '0 Models',
      image: body.image || '/images/bag-green.png',
      description: body.description || '',
      createdAt: new Date().toISOString(),
    };

    await updateDb((db) => {
      db.categories = db.categories || [];
      db.categories.push(newCategory);
      return db;
    });

    res.status(201).json(newCategory);
  } catch (err) {
    logger.error('Error creating category:', err);
    res.status(500).json({ error: 'Failed to create category' });
  }
}

export async function updateCategory(req, res) {
  try {
    const { id } = req.params;
    let updatedCat = null;

    await updateDb((db) => {
      const idx = db.categories?.findIndex((c) => c.id === id);
      if (idx === -1 || idx === undefined) {
        return db;
      }

      updatedCat = {
        ...db.categories[idx],
        ...req.body,
        id, // Immutable ID
        updatedAt: new Date().toISOString(),
      };

      db.categories[idx] = updatedCat;
      return db;
    });

    if (!updatedCat) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json(updatedCat);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update category' });
  }
}

export async function deleteCategory(req, res) {
  try {
    const { id } = req.params;
    let deletedCat = null;

    await updateDb((db) => {
      const idx = db.categories?.findIndex((c) => c.id === id);
      if (idx === -1 || idx === undefined) {
        return db;
      }
      const removed = db.categories.splice(idx, 1);
      deletedCat = removed[0];
      return db;
    });

    if (!deletedCat) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({ success: true, deleted: deletedCat });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete category' });
  }
}

export default {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};
