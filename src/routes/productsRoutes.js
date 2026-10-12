import express from 'express';
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  toggleStock,
  deleteProduct,
} from '../controllers/productsController.js';

export const productsRouter = express.Router();

productsRouter.get('/', getAllProducts);
productsRouter.get('/:id', getProductById);
productsRouter.post('/', createProduct);
productsRouter.put('/:id', updateProduct);
productsRouter.patch('/:id/toggle-stock', toggleStock);
productsRouter.delete('/:id', deleteProduct);

export default productsRouter;
