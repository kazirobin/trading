import mongoose from 'mongoose';
import { env } from './env';

mongoose.set('strictQuery', true);

let listenersBound = false;
function bindListeners(): void {
  if (listenersBound) return;
  listenersBound = true;
  mongoose.connection.on('connected', () => {
    console.log(`[db] connected -> ${mongoose.connection.name}`);
  });
  mongoose.connection.on('error', (err) => {
    console.error('[db] error', err.message);
  });
  mongoose.connection.on('disconnected', () => {
    console.warn('[db] disconnected');
  });
}

export async function connectDB(): Promise<typeof mongoose.connection> {
  if (mongoose.connection.readyState === 1) return mongoose.connection;

  bindListeners();

  await mongoose.connect(env.MONGODB_URI, {
    dbName: env.MONGODB_DB,
    serverSelectionTimeoutMS: 15000,
    autoIndex: env.NODE_ENV !== 'production',
  });

  return mongoose.connection;
}

/**
 * Keeps trying to reach MongoDB without crashing the process, so the HTTP
 * server stays up (and /health responds) even if Atlas is temporarily
 * unreachable. Resolves once connected.
 */
export async function connectDBWithRetry(delayMs = 10000): Promise<void> {
  for (;;) {
    try {
      await connectDB();
      return;
    } catch (err) {
      console.error(`[db] connect failed, retrying in ${delayMs / 1000}s:`, (err as Error).message);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

export function dbReady(): boolean {
  return mongoose.connection.readyState === 1;
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
}
