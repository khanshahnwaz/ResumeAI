// ============================================================
// server.js — HTTP server bootstrap
// ============================================================
import 'dotenv/config';
import app from './app.js';
import { prisma } from './utils/prisma.js';
import { logger } from './utils/logger.js';

const PORT = process.env.PORT || 3001;

async function main() {
  // Verify database connection before starting
  console.log(process.env.NODE_ENV);
  

  await prisma.$connect();
  logger.info('Database connected');

  app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT} [${process.env.NODE_ENV}]`);
  });
}

main().catch((err) => {
  logger.error('Failed to start server:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received — shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});