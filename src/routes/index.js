import express from 'express';
import healthRouter from './healthRoutes.js';
import authRouter from './authRoutes.js';
import productsRouter from './productsRoutes.js';
import categoriesRouter from './categoriesRoutes.js';
import ordersRouter from './ordersRoutes.js';
import quotesRouter from './quotesRoutes.js';
import settingsRouter from './settingsRoutes.js';
import testimonialsRouter from './testimonialsRoutes.js';
import statsRouter from './statsRoutes.js';
import uploadRouter from './uploadRoutes.js';
import resetRouter from './resetRoutes.js';
import messagesRouter from './messagesRoutes.js';

export const apiRouter = express.Router();

// Mount individual domain subrouters
apiRouter.use('/', healthRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/products', productsRouter);
apiRouter.use('/categories', categoriesRouter);
apiRouter.use('/orders', ordersRouter);
apiRouter.use('/quotes', quotesRouter);
apiRouter.use('/settings', settingsRouter);
apiRouter.use('/testimonials', testimonialsRouter);
apiRouter.use('/stats', statsRouter);
apiRouter.use('/upload', uploadRouter);
apiRouter.use('/reset', resetRouter);
apiRouter.use('/messages', messagesRouter);

export default apiRouter;
