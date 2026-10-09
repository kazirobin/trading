import type { Server as HttpServer } from 'node:http';
import { Server, type Socket } from 'socket.io';
import { clientOrigins } from '../config/env';
import { verifyToken } from '../utils/jwt';
import { realtime } from '../services/realtime';

export function initSockets(server: HttpServer): Server {
  const io = new Server(server, {
    cors: { origin: clientOrigins, credentials: true },
  });

  io.use((socket, next) => {
    const token = (socket.handshake.auth?.token as string | undefined) ?? undefined;
    if (token) {
      try {
        const payload = verifyToken(token, 'access');
        socket.data.userId = payload.sub;
        socket.data.role = payload.role;
      } catch {
        /* anonymous socket is allowed for public market data */
      }
    }
    next();
  });

  io.on('connection', (socket: Socket) => {
    if (socket.data.userId) socket.join(`user:${socket.data.userId}`);

    socket.on('subscribe', (payload: { symbol?: string }) => {
      const symbol = String(payload?.symbol ?? '').toUpperCase();
      if (!symbol) return;
      socket.join(`sym:${symbol}`);
    });

    socket.on('unsubscribe', (payload: { symbol?: string }) => {
      const symbol = String(payload?.symbol ?? '').toUpperCase();
      if (symbol) socket.leave(`sym:${symbol}`);
    });
  });

  realtime.on('trade', (t) => {
    io.to(`sym:${t.symbol}`).emit('trade', t);
    io.to(`sym:${t.symbol}`).emit('price', { symbol: t.symbol, price: t.price, ts: t.ts });
  });

  realtime.on('price', (p) => {
    io.to(`sym:${p.symbol}`).emit('price', p);
  });

  realtime.on('order', (o) => {
    io.to(`user:${o.userId}`).emit('order', o);
  });

  return io;
}
