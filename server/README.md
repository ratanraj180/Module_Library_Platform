# Module Library Server

Backend API for the Module Library Platform. Node.js + Express + MongoDB (Mongoose).

## Setup

```bash
cd server
npm install
cp .env.example .env
# edit .env and set MONGO_URI to point at your MongoDB instance
```

## Run

```bash
npm run dev      # nodemon, reloads on changes
npm start        # plain node
```

The server listens on `PORT` (default `5000`).

## Health check

```bash
curl http://localhost:5000/api/health
```

Response:

```json
{ "status": "ok", "uptime": 1.23, "timestamp": "2026-06-11T00:00:00.000Z" }
```

## Scripts

- `npm run dev` — start with nodemon
- `npm start` — start with node
- `npm run lint` — run ESLint over `src/`
- `npm run format` — run Prettier
