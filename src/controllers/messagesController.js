import { getDb, updateDb } from '../database/db.js';
import logger from '../utils/logger.js';

export async function getAllMessages(req, res) {
  try {
    const db = getDb();
    const messages = db.customerMessages || [];
    res.json(messages);
  } catch (err) {
    logger.error('Error getting customer messages:', err);
    res.status(500).json({ error: 'Failed to retrieve messages' });
  }
}

export async function saveMessageThread(req, res) {
  try {
    const incomingThread = req.body;
    if (!incomingThread || !incomingThread.id) {
      return res.status(400).json({ error: 'Thread data and id are required' });
    }

    await updateDb((db) => {
      db.customerMessages = db.customerMessages || [];
      const index = db.customerMessages.findIndex((t) => t.id === incomingThread.id);
      if (index >= 0) {
        db.customerMessages[index] = { ...db.customerMessages[index], ...incomingThread };
      } else {
        db.customerMessages.unshift(incomingThread);
      }
      return db;
    });

    res.status(200).json({ success: true, thread: incomingThread });
  } catch (err) {
    logger.error('Error saving message thread:', err);
    res.status(500).json({ error: 'Failed to save message thread' });
  }
}

export async function replyToMessageThread(req, res) {
  try {
    const { id } = req.params;
    const { text, senderName = 'EcoTex Support Team' } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Reply text is required' });
    }

    const newReply = {
      id: `admin-${Date.now()}`,
      sender: 'admin',
      senderName,
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    let updatedThread = null;

    await updateDb((db) => {
      db.customerMessages = db.customerMessages || [];
      const thread = db.customerMessages.find((t) => t.id === id);
      if (thread) {
        const rawPhone = thread.phone || '';
        let cleanPhone = rawPhone.replace(/[^0-9]/g, '');
        if (cleanPhone.startsWith('03') && cleanPhone.length === 11) {
          cleanPhone = '92' + cleanPhone.slice(1);
        } else if (cleanPhone.startsWith('00')) {
          cleanPhone = cleanPhone.slice(2);
        }
        const hasWhatsApp = Boolean(cleanPhone && cleanPhone.length >= 7);
        const hasEmail = Boolean(thread.email && !thread.email.includes('visitor@livechat') && !thread.email.includes('@whatsapp'));

        const newReply = {
          id: `admin-${Date.now()}`,
          sender: 'admin',
          senderName,
          text: text.trim(),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          notifications: {
            whatsapp: {
              target: rawPhone || null,
              dispatched: hasWhatsApp,
              url: hasWhatsApp ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text.trim())}` : null
            },
            email: {
              target: thread.email || null,
              dispatched: hasEmail
            }
          }
        };

        thread.messages = thread.messages || [];
        thread.messages.push(newReply);
        thread.status = thread.status === 'New' ? 'In Discussion' : thread.status;
        thread.isUnread = false;
        thread.lastUpdated = 'Just now';
        updatedThread = thread;

        if (hasWhatsApp) {
          logger.info(`[CUSTOMER NOTIFICATION - WHATSAPP] Admin reply dispatched for ${thread.customerName} via WhatsApp (${rawPhone}): "${text.trim()}"`);
        }
        if (hasEmail) {
          logger.info(`[CUSTOMER NOTIFICATION - EMAIL] Admin reply dispatched for ${thread.customerName} via Email (${thread.email}): "${text.trim()}"`);
        }
      }
      return db;
    });

    if (!updatedThread) {
      return res.status(404).json({ error: 'Thread not found' });
    }

    res.status(200).json(updatedThread);
  } catch (err) {
    logger.error('Error replying to thread:', err);
    res.status(500).json({ error: 'Failed to reply to thread' });
  }
}
