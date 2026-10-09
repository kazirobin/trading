export const fmt = (n: number | string, d = 2): string => {
  const num = Number(n);
  if (!Number.isFinite(num)) return '0';
  return num.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
};

export const sgn = (n: number): string => (n > 0 ? '+' : n < 0 ? '-' : '') + '$' + fmt(Math.abs(n));

export const cls = (n: number): string => (n >= 0 ? 'text-up' : 'text-down');

export const pdec = (p: number): number => (p < 1 ? 5 : p < 100 ? 2 : 2);

export const pad = (n: number): string => String(n).padStart(2, '0');

export const shortTime = (iso: string): string => {
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

export const dateTime = (iso: string): string => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const pct = (from: number, to: number): number => (from > 0 ? ((to - from) / from) * 100 : 0);
