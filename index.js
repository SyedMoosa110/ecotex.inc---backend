import config from './src/config/index.js';
import logger from './src/utils/logger.js';
import { initDb } from './src/database/db.js';
import { app } from './src/app.js';

let server = null;

async function bootstrap() {
  try {
    // 1. Initialize persistent storage engine
    await initDb();

    // 2. Start HTTP server
    server = app.listen(config.port, config.host, () => {
      logger.info('======================================================');
      logger.info(` Ecotex Inc. Enterprise API Server Running`);
      logger.info(` Environment: ${config.env}`);
      logger.info(` Address:     http://${config.host}:${config.port}`);
      logger.info(` Health:      http://${config.host}:${config.port}/api/health`);
      logger.info(` Endpoints:   http://${config.host}:${config.port}/api`);
      logger.info('======================================================');
    });

    // 3. Graceful shutdown handler
    const handleShutdown = (signal) => {
      logger.info(`Received ${signal}. Gracefully closing HTTP server and flushing pending writes...`);
      if (server) {
        server.close(() => {
          logger.info('HTTP server closed successfully.');
          process.exit(0);
        });
      } else {
        process.exit(0);
      }
    };

    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
    process.on('SIGINT', () => handleShutdown('SIGINT'));

  } catch (err) {
    logger.error('Fatal initialization error:', err);
    process.exit(1);
  }
}

// Global exception handling
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception thrown:', err);
  process.exit(1);
});

bootstrap();
