import mongoose from 'mongoose';
import { env } from './env';

mongoose.set('strictQuery', true);

export async function connectDB(): Promise<typeof mongoose.connection> {
  if (mongoose.connection.readyState === 1) return mongoose.connection;

  mongoose.connection.on('connected', () => {
    console.log(`[db] connected -> ${mongoose.connection.name}`);
  });
  mongoose.connection.on('error', (err) => {
    console.error('[db] error', err.message);
  });
  mongoose.connection.on('disconnected', () => {
    console.warn('[db] disconnected');
  });

  await mongoose.connect(env.MONGODB_URI, {
    dbName: env.MONGODB_DB,
    serverSelectionTimeoutMS: 15000,
    autoIndex: env.NODE_ENV !== 'production',
  });

  return mongoose.connection;
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
}
