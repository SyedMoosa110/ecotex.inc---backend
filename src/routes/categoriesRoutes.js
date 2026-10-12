import express from 'express';
import {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/categoriesController.js';

export const categoriesRouter = express.Router();

categoriesRouter.get('/', getAllCategories);
categoriesRouter.get('/:id', getCategoryById);
categoriesRouter.post('/', createCategory);
categoriesRouter.put('/:id', updateCategory);
categoriesRouter.delete('/:id', deleteCategory);

export default categoriesRouter;
