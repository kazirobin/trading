'use client';

import { io, type Socket } from 'socket.io-client';
import { ACCESS_KEY } from './api';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:4000';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (socket) return socket;
  const token = typeof window !== 'undefined' ? window.localStorage.getItem(ACCESS_KEY) : null;
  socket = io(WS_URL, {
    transports: ['websocket'],
    auth: token ? { token } : {},
    reconnection: true,
    reconnectionDelay: 1500,
  });
  return socket;
}

export function resetSocket(): void {
  socket?.disconnect();
  socket = null;
}
