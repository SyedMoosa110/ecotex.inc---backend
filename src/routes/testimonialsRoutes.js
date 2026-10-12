import express from 'express';
import {
  getAllTestimonials,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
} from '../controllers/testimonialsController.js';

export const testimonialsRouter = express.Router();

testimonialsRouter.get('/', getAllTestimonials);
testimonialsRouter.post('/', createTestimonial);
testimonialsRouter.put('/:id', updateTestimonial);
testimonialsRouter.delete('/:id', deleteTestimonial);

export default testimonialsRouter;
