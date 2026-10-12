import { getDb, updateDb } from '../database/db.js';
import logger from '../utils/logger.js';

export async function getAllQuotes(req, res) {
  try {
    const db = getDb();
    const quotes = [...(db.quotes || [])];
    quotes.sort((a, b) => new Date(b.date || b.createdAt || 0) - new Date(a.date || a.createdAt || 0));
    res.json(quotes);
  } catch (err) {
    logger.error('Error fetching quotes:', err);
    res.status(500).json({ error: 'Failed to retrieve quotes' });
  }
}

export async function getQuoteById(req, res) {
  try {
    const db = getDb();
    const quote = db.quotes?.find((q) => q.id === req.params.id);
    if (!quote) {
      return res.status(404).json({ error: 'Quote not found' });
    }
    res.json(quote);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve quote' });
  }
}

export async function createQuote(req, res) {
  try {
    const body = req.body || {};
    const name = (body.name || body.company || 'Inquiry Contact').trim();
    const email = (body.email || '').trim();

    const newQuote = {
      id: body.id || `RFQ-${Math.floor(1000 + Math.random() * 9000)}`,
      name,
      company: body.company || name,
      email,
      phone: body.phone || '',
      category: body.category || body.bagType || 'General Inquiries',
      volume: body.volume || (body.quantity ? `${body.quantity} units` : '10,000 units'),
      printing: body.printing || 'Custom Flexo Printing',
      message: body.message || 'Direct quote request via Ecotex RFQ Engine.',
      bagType: body.bagType || '',
      quantity: body.quantity ? Number(body.quantity) : undefined,
      status: body.status || 'New',
      date: body.date || new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
    };

    await updateDb((db) => {
      db.quotes = db.quotes || [];
      db.quotes.unshift(newQuote);
      return db;
    });

    res.status(201).json(newQuote);
  } catch (err) {
    logger.error('Error creating quote:', err);
    res.status(500).json({ error: 'Failed to submit quote request' });
  }
}

export async function updateQuoteStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required.' });
    }

    let updatedQuote = null;

    await updateDb((db) => {
      const quote = db.quotes?.find((q) => q.id === id);
      if (!quote) return db;

      quote.status = String(status).trim();
      quote.updatedAt = new Date().toISOString();
      updatedQuote = quote;
      return db;
    });

    if (!updatedQuote) {
      return res.status(404).json({ error: 'Quote not found' });
    }

    res.json(updatedQuote);
  } catch (err) {
    logger.error('Error updating quote status:', err);
    res.status(500).json({ error: 'Failed to update quote status' });
  }
}

export async function deleteQuote(req, res) {
  try {
    const { id } = req.params;
    let deletedQuote = null;

    await updateDb((db) => {
      const idx = db.quotes?.findIndex((q) => q.id === id);
      if (idx === -1 || idx === undefined) return db;

      const removed = db.quotes.splice(idx, 1);
      deletedQuote = removed[0];
      return db;
    });

    if (!deletedQuote) {
      return res.status(404).json({ error: 'Quote not found' });
    }

    res.json({ success: true, deleted: deletedQuote });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete quote' });
  }
}

export default {
  getAllQuotes,
  getQuoteById,
  createQuote,
  updateQuoteStatus,
  deleteQuote,
};
