# tradevix

Full-stack online trading platform (Next.js + Node/Express + MongoDB).

## Structure

- `apps/server` — Express + Mongoose + Socket.io API, wallet engine, matching engine
- `apps/web` — Next.js trading terminal + user/admin dashboards

## Setup

1. `npm install`
2. Copy `apps/server/.env.example` to `apps/server/.env` and fill in `MONGODB_URI` and JWT secrets.
3. `npm run seed -w @tradevix/server` (creates markets, admin, fee + demo accounts)
4. `npm run dev:server` and `npm run dev:web`

Secrets live only in `.env` files and are gitignored. Never commit them.