import express from 'express';
import {
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  deleteOrder,
} from '../controllers/ordersController.js';

export const ordersRouter = express.Router();

ordersRouter.get('/', getAllOrders);
ordersRouter.get('/:id', getOrderById);
ordersRouter.post('/', createOrder);
ordersRouter.patch('/:id/status', updateOrderStatus);
ordersRouter.delete('/:id', deleteOrder);

export default ordersRouter;
