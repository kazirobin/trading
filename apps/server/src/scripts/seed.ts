import { connectDB, disconnectDB } from '../config/db';
import { adminEmails, env } from '../config/env';
import { User, MarketPair, Wallet } from '../models';

type MarketSeed = {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  pricePrecision: number;
  qtyPrecision: number;
  tickSize: string;
  stepSize: string;
  minNotional: string;
  lastPrice: string;
  sortOrder: number;
};

const MARKETS: MarketSeed[] = [
  { symbol: 'BTCUSDT', baseAsset: 'BTC', quoteAsset: 'USDT', pricePrecision: 2, qtyPrecision: 6, tickSize: '0.01', stepSize: '0.000001', minNotional: '10', lastPrice: '65000', sortOrder: 1 },
  { symbol: 'ETHUSDT', baseAsset: 'ETH', quoteAsset: 'USDT', pricePrecision: 2, qtyPrecision: 5, tickSize: '0.01', stepSize: '0.00001', minNotional: '10', lastPrice: '3200', sortOrder: 2 },
  { symbol: 'BNBUSDT', baseAsset: 'BNB', quoteAsset: 'USDT', pricePrecision: 2, qtyPrecision: 4, tickSize: '0.01', stepSize: '0.0001', minNotional: '10', lastPrice: '580', sortOrder: 3 },
  { symbol: 'SOLUSDT', baseAsset: 'SOL', quoteAsset: 'USDT', pricePrecision: 3, qtyPrecision: 4, tickSize: '0.001', stepSize: '0.0001', minNotional: '10', lastPrice: '150', sortOrder: 4 },
  { symbol: 'XRPUSDT', baseAsset: 'XRP', quoteAsset: 'USDT', pricePrecision: 4, qtyPrecision: 2, tickSize: '0.0001', stepSize: '0.01', minNotional: '10', lastPrice: '0.52', sortOrder: 5 },
  { symbol: 'DOGEUSDT', baseAsset: 'DOGE', quoteAsset: 'USDT', pricePrecision: 5, qtyPrecision: 1, tickSize: '0.00001', stepSize: '0.1', minNotional: '10', lastPrice: '0.12', sortOrder: 6 },
  { symbol: 'ADAUSDT', baseAsset: 'ADA', quoteAsset: 'USDT', pricePrecision: 4, qtyPrecision: 2, tickSize: '0.0001', stepSize: '0.01', minNotional: '10', lastPrice: '0.45', sortOrder: 7 },
  { symbol: 'LTCUSDT', baseAsset: 'LTC', quoteAsset: 'USDT', pricePrecision: 2, qtyPrecision: 4, tickSize: '0.01', stepSize: '0.0001', minNotional: '10', lastPrice: '80', sortOrder: 8 },
];

const START_BALANCE = '100000';

async function ensureWallet(userId: string, currency: string, total: string) {
  await Wallet.updateOne(
    { userId, currency },
    { $setOnInsert: { totalBalance: total, lockedBalance: '0' } },
    { upsert: true },
  );
}

async function ensureUser(email: string, opts: { name: string; password: string; role: 'user' | 'admin'; kyc?: boolean; balance?: string }) {
  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({
      name: opts.name,
      email,
      passwordHash: await User.hashPassword(opts.password),
      role: opts.role,
      emailVerified: true,
      kycStatus: opts.kyc ? 'approved' : 'unverified',
    });
    console.log(`[seed] created ${opts.role}: ${email} / ${opts.password}`);
  }
  await Promise.all([
    ensureWallet(user.id, 'USDT', opts.balance ?? '0'),
    ensureWallet(user.id, 'BTC', '0'),
    ensureWallet(user.id, 'ETH', '0'),
    ensureWallet(user.id, 'USD', '0'),
  ]);
  return user;
}

async function run() {
  await connectDB();

  for (const m of MARKETS) {
    await MarketPair.updateOne({ symbol: m.symbol }, { $set: m }, { upsert: true });
  }
  console.log(`[seed] markets upserted: ${MARKETS.length}`);

  for (const email of adminEmails) {
    await ensureUser(email, { name: 'Platform Admin', password: 'Admin@12345', role: 'admin', kyc: true, balance: '0' });
  }

  await ensureUser(env.FEE_ACCOUNT_EMAIL, { name: 'Fee Account', password: 'Fee@12345', role: 'user', kyc: true, balance: '0' });

  await ensureUser('demo@tradevix.local', { name: 'Demo Trader', password: 'Demo@12345', role: 'user', kyc: true, balance: START_BALANCE });

  console.log('[seed] done');
  await disconnectDB();
}

run().catch(async (err) => {
  console.error('[seed] failed:', err);
  await disconnectDB().catch(() => undefined);
  process.exit(1);
});
