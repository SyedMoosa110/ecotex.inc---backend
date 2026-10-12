import { getDb, updateDb } from '../database/db.js';
import logger from '../utils/logger.js';

export async function getAllOrders(req, res) {
  try {
    const db = getDb();
    const rawOrders = [...(db.orders || [])];
    const orders = rawOrders.map((o) => {
      const buyerName = o.buyerName || o.customerName || 'Commercial Buyer';
      const companyName = o.companyName || o.customerCompany || 'Enterprise Packaging Client';
      const email = o.email || o.customerEmail || '';
      const address = o.address || o.shippingAddress || '';
      const subtotal = Number(o.subtotal) || 0;
      const shipping = Number(o.shipping) || 0;
      const total = Number(o.total || o.totalAmount) || (subtotal + shipping);

      return {
        ...o,
        buyerName,
        customerName: buyerName,
        companyName,
        customerCompany: companyName,
        email,
        customerEmail: email,
        address,
        shippingAddress: address,
        subtotal,
        shipping,
        total,
        totalAmount: total,
        status: o.status || 'Pending',
        date: o.date || (o.createdAt ? o.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]),
        items: Array.isArray(o.items)
          ? o.items.map((it) => ({
              ...it,
              productId: it.productId || it.id || '',
              productName: it.productName || it.name || 'Custom Bag',
              name: it.name || it.productName || 'Custom Bag',
              quantity: Number(it.quantity) || 1,
              unitPrice: Number(it.unitPrice || it.price) || 0,
              price: Number(it.price || it.unitPrice) || 0,
              totalPrice: Number(it.totalPrice) || ((Number(it.unitPrice || it.price) || 0) * (Number(it.quantity) || 1)),
              color: it.color || it.selectedColor || 'Default',
              customPrint: Boolean(it.customPrint),
            }))
          : [],
      };
    });

    // Sort latest first
    orders.sort((a, b) => new Date(b.date || b.createdAt || 0) - new Date(a.date || a.createdAt || 0));
    res.json(orders);
  } catch (err) {
    logger.error('Error fetching orders:', err);
    res.status(500).json({ error: 'Failed to retrieve orders' });
  }
}

export async function getOrderById(req, res) {
  try {
    const db = getDb();
    const order = db.orders?.find((o) => o.id === req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    const buyerName = order.buyerName || order.customerName || 'Commercial Buyer';
    const companyName = order.companyName || order.customerCompany || 'Enterprise Packaging Client';
    const email = order.email || order.customerEmail || '';
    const address = order.address || order.shippingAddress || '';
    const subtotal = Number(order.subtotal) || 0;
    const shipping = Number(order.shipping) || 0;
    const total = Number(order.total || order.totalAmount) || (subtotal + shipping);

    res.json({
      ...order,
      buyerName,
      customerName: buyerName,
      companyName,
      customerCompany: companyName,
      email,
      customerEmail: email,
      address,
      shippingAddress: address,
      subtotal,
      shipping,
      total,
      totalAmount: total,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve order' });
  }
}

export async function createOrder(req, res) {
  try {
    const body = req.body || {};

    const items = Array.isArray(body.items) ? body.items : [];
    const calculatedSubtotal = items.reduce(
      (sum, item) => sum + (Number(item.totalPrice) || (Number(item.price || item.unitPrice || 0) * Number(item.quantity || 1))),
      0
    );

    const subtotal = Number(body.subtotal) || calculatedSubtotal;
    const shipping = Number(body.shipping) || (subtotal > 1000 ? 0 : 50);
    const total = Number(body.total || body.totalAmount) || (subtotal + shipping);

    const buyerName = body.buyerName || body.customerName || 'Commercial Buyer';
    const companyName = body.companyName || body.customerCompany || 'Enterprise Packaging Client';
    const email = body.email || body.customerEmail || '';
    const address = body.address || body.shippingAddress || '';

    const newOrder = {
      id: body.id || `ECX-${Math.floor(100000 + Math.random() * 900000)}`,
      buyerName,
      customerName: buyerName,
      companyName,
      customerCompany: companyName,
      email,
      customerEmail: email,
      phone: body.phone || '',
      address,
      shippingAddress: address,
      city: body.city || '',
      state: body.state || 'CA',
      zip: body.zip || '',
      paymentTerms: body.paymentTerms || 'Credit Card / Instant ACH',
      subtotal,
      shipping,
      total,
      totalAmount: total,
      status: body.status || 'Pending',
      date: body.date || new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      items: items.map((it) => ({
        productId: it.productId || it.id || '',
        productName: it.productName || it.name || 'Custom Bag',
        name: it.name || it.productName || 'Custom Bag',
        quantity: Number(it.quantity) || 1,
        unitPrice: Number(it.unitPrice || it.price) || 0,
        price: Number(it.price || it.unitPrice) || 0,
        totalPrice: Number(it.totalPrice) || ((Number(it.unitPrice || it.price) || 0) * (Number(it.quantity) || 1)),
        color: it.color || it.selectedColor || 'Default',
        customPrint: Boolean(it.customPrint),
      })),
    };

    // Dynamic EcoTex Order Notifications (Email & WhatsApp targets from settings)
    const currentDb = getDb();
    const settings = currentDb?.settings || {};
    const notifConfig = settings.orderNotifications || {};
    const targetEmail = notifConfig.notificationEmail || settings.email || 'orders@ecotexinc.com';
    const targetWhatsApp = notifConfig.whatsappNumber || settings.phone || '+1 (951) 450-9773';
    const isEmailEnabled = notifConfig.emailEnabled !== false;
    const isWhatsAppEnabled = notifConfig.whatsappEnabled !== false;

    newOrder.notifications = {
      email: {
        enabled: isEmailEnabled,
        dispatchedTo: targetEmail,
        timestamp: new Date().toISOString()
      },
      whatsapp: {
        enabled: isWhatsAppEnabled,
        targetPhone: targetWhatsApp,
        timestamp: new Date().toISOString()
      }
    };

    logger.info(`[ORDER NOTIFICATION] New order ${newOrder.id} received. Alert to Email: ${targetEmail} [${isEmailEnabled ? 'ENABLED' : 'DISABLED'}], Alert to WhatsApp: ${targetWhatsApp} [${isWhatsAppEnabled ? 'ENABLED' : 'DISABLED'}]`);

    await updateDb((db) => {
      db.orders = db.orders || [];
      const existingIdx = db.orders.findIndex((o) => o.id === newOrder.id);
      if (existingIdx >= 0) {
        db.orders[existingIdx] = newOrder;
      } else {
        db.orders.unshift(newOrder);
      }
      return db;
    });

    res.status(201).json(newOrder);
  } catch (err) {
    logger.error('Error creating order:', err);
    res.status(500).json({ error: 'Failed to create order' });
  }
}

export async function updateOrderStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required.' });
    }

    let updatedOrder = null;

    await updateDb((db) => {
      const order = db.orders?.find((o) => o.id === id);
      if (!order) return db;

      order.status = String(status).trim();
      order.updatedAt = new Date().toISOString();
      updatedOrder = order;
      return db;
    });

    if (!updatedOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(updatedOrder);
  } catch (err) {
    logger.error('Error updating order status:', err);
    res.status(500).json({ error: 'Failed to update order status' });
  }
}

export async function deleteOrder(req, res) {
  try {
    const { id } = req.params;
    let deletedOrder = null;

    await updateDb((db) => {
      const idx = db.orders?.findIndex((o) => o.id === id);
      if (idx === -1 || idx === undefined) return db;

      const removed = db.orders.splice(idx, 1);
      deletedOrder = removed[0];
      return db;
    });

    if (!deletedOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ success: true, deleted: deletedOrder });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete order' });
  }
}

export default {
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  deleteOrder,
};
