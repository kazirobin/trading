export type Role = 'user' | 'admin';
export type UserStatus = 'active' | 'suspended' | 'banned';
export type KycStatus = 'unverified' | 'pending' | 'approved' | 'rejected';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
  kycStatus: KycStatus;
  twoFAEnabled: boolean;
  emailVerified: boolean;
  createdAt: string;
}

export interface WalletBalance {
  currency: string;
  total: number;
  locked: number;
  available: number;
}

export interface MarketPair {
  _id: string;
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  status: 'trading' | 'halted' | 'delisted';
  enabled: boolean;
  pricePrecision: number;
  qtyPrecision: number;
  tickSize: string;
  stepSize: string;
  minNotional: string;
  makerFeePct: string;
  takerFeePct: string;
  lastPrice: string;
  change24hPct: string;
  high24h: string;
  low24h: string;
  volume24h: string;
}

export type OrderSide = 'buy' | 'sell';
export type OrderType = 'market' | 'limit' | 'stop_limit' | 'stop_market';
export type OrderStatus = 'open' | 'partial' | 'filled' | 'canceled' | 'rejected' | 'expired';

export interface Order {
  _id: string;
  symbol: string;
  side: OrderSide;
  type: OrderType;
  status: OrderStatus;
  price: string | null;
  stopPrice: string | null;
  amount: string;
  filled: string;
  remaining: string;
  avgFillPrice: string;
  quoteAmount: string;
  createdAt: string;
  updatedAt: string;
}

export interface TradeDto {
  _id: string;
  symbol: string;
  price: string;
  amount: string;
  quoteAmount: string;
  takerSide: OrderSide;
  makerUserId: string;
  takerUserId: string;
  createdAt: string;
}

export interface DepthLevel {
  price: number;
  amount: number;
  orders: number;
}

export interface Depth {
  symbol: string;
  bids: DepthLevel[];
  asks: DepthLevel[];
}

export interface Transaction {
  _id: string;
  type: 'deposit' | 'withdraw' | 'fee' | 'refund' | 'adjustment' | 'trade' | 'transfer';
  currency: string;
  amount: string;
  status: 'pending' | 'completed' | 'failed' | 'canceled';
  method?: string | null;
  address?: string | null;
  note?: string | null;
  createdAt: string;
}
