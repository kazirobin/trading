import http from 'node:http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { clientOrigins, env } from './config/env';
import { connectDB } from './config/db';
import { apiRouter } from './routes';
import { errorHandler, notFoundHandler } from './middleware/error';
import { initSockets } from './sockets/hub';
import { startMarketFeed } from './services/marketData';

async function main() {
  await connectDB();

  const app = express();
  app.set('trust proxy', 1);
  app.use(helmet({ crossOriginResourcePolicy: false }));
  app.use(cors({ origin: clientOrigins, credentials: true }));
  app.use(express.json({ limit: '2mb' }));
  app.use(cookieParser());
  if (env.NODE_ENV !== 'test') app.use(morgan('dev'));

  app.use(
    '/api/auth',
    rateLimit({ windowMs: 15 * 60 * 1000, limit: 100, standardHeaders: 'draft-7', legacyHeaders: false }),
  );
  app.use(
    '/api',
    rateLimit({ windowMs: 60 * 1000, limit: 600, standardHeaders: 'draft-7', legacyHeaders: false }),
  );

  app.use('/api', apiRouter);
  app.use(notFoundHandler);
  app.use(errorHandler);

  const server = http.createServer(app);
  initSockets(server);

  server.listen(env.PORT, () => {
    console.log(`[server] listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
  });

  void startMarketFeed();

  const shutdown = () => {
    console.log('[server] shutting down...');
    server.close(() => process.exit(0));
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error('[server] fatal startup error', err);
  process.exit(1);
});
