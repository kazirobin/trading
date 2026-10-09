import Big from 'big.js';
import mongoose from 'mongoose';

// Exact decimal arithmetic. Values are persisted as Mongo Decimal128.
Big.DP = 24;
Big.RM = Big.roundDown;

export type DecimalLike =
  | Big
  | string
  | number
  | mongoose.Types.Decimal128
  | null
  | undefined;

export const PRECISION = 8;

export function toBig(v: DecimalLike): Big {
  if (v == null) return new Big(0);
  if (v instanceof Big) return v;
  if (v instanceof mongoose.Types.Decimal128) return new Big(v.toString());
  return new Big(v);
}

export function toDecimal(v: DecimalLike): mongoose.Types.Decimal128 {
  return mongoose.Types.Decimal128.fromString(round(v).toString());
}

export function toNum(v: DecimalLike): number {
  return Number(toBig(v).toString());
}

export function round(v: DecimalLike, dp = PRECISION): Big {
  return toBig(v).round(dp, Big.roundDown);
}

export function isPositive(v: DecimalLike): boolean {
  return toBig(v).gt(0);
}

/** Round a quantity down to the nearest step (exchange lot size). */
export function floorToStep(value: DecimalLike, step: DecimalLike): Big {
  const s = toBig(step);
  if (s.lte(0)) return toBig(value);
  return toBig(value).div(s).round(0, Big.roundDown).times(s);
}

export function minBig(a: DecimalLike, b: DecimalLike): Big {
  const x = toBig(a);
  const y = toBig(b);
  return x.lte(y) ? x : y;
}

export function maxBig(a: DecimalLike, b: DecimalLike): Big {
  const x = toBig(a);
  const y = toBig(b);
  return x.gte(y) ? x : y;
}
