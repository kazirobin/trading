import { Router } from 'express';
import { authRouter } from './auth';
import { marketsRouter } from './markets';
import { walletRouter } from './wallet';
import { ordersRouter, tradesRouter } from './orders';
import { kycRouter } from './kyc';
import { adminRouter } from './admin';

export const apiRouter = Router();

apiRouter.get('/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok', ts: Date.now() } });
});

apiRouter.use('/auth', authRouter);
apiRouter.use('/markets', marketsRouter);
apiRouter.use('/wallet', walletRouter);
apiRouter.use('/orders', ordersRouter);
apiRouter.use('/trades', tradesRouter);
apiRouter.use('/kyc', kycRouter);
apiRouter.use('/admin', adminRouter);
