# SuperMarket POS Management System

Web-based supermarket management for owners, cashiers and stock managers: products, checkout, inventory, sales and reports.

## Stack

- Frontend: React, Tailwind CSS, Lucide React, Vite
- Backend: Node.js, Express, JWT, bcrypt
- Database: MongoDB Atlas with Mongoose

## Local setup

1. Copy `backend/.env.example` to `backend/.env` and set `MONGO_URI`.
2. Frontend local values are already in `frontend/.env.development`.
3. Install, seed, and run:

```bash
npm run install:all
npm run seed
npm run dev
```

- API: http://localhost:5000
- App: http://localhost:5173

## Environment variables

### Backend (`backend/.env`, or the API host's dashboard)

| Variable | Purpose |
| --- | --- |
| `PORT` | API port. Hosts such as Render set this themselves. |
| `MONGO_URI` | Atlas connection string. Database name: `supermarket-pos`. |
| `JWT_SECRET` | Long random signing secret. |
| `JWT_EXPIRES_IN` | Token lifetime, for example `7d`. |
| `CLIENT_URL` | Comma-separated frontend origins, for example `http://localhost:5173,https://your-app.vercel.app`. |

### Frontend (Vite, baked in at build time)

| Variable | Purpose |
| --- | --- |
| `VITE_API_URL` | API base. Local: `/api`. Hosted: `https://your-api-host.onrender.com/api`. |
| `VITE_PROXY_TARGET` | Local only. Where Vite forwards `/api` and `/uploads`. Default `http://localhost:5000`. |

See `frontend/.env.example` and `frontend/.env.production.example`.

## Hosting

1. Deploy the `backend` folder (start command `npm start`, root `backend`).
2. On the API host, set `MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, and `CLIENT_URL` to the frontend URL.
3. Deploy the `frontend` folder. Set `VITE_API_URL` to `https://<your-api-host>/api`, then rebuild.
4. In Atlas, Network Access must allow the API host (`0.0.0.0/0` is the simplest option).

`frontend/vercel.json` sends all routes to `index.html` so refresh works on client-side pages.

## Demo accounts

| Role | Email | Password |
| --- | --- | --- |
| Administrator | admin@supermarket.com | admin123 |
| Cashier | cashier@supermarket.com | cashier123 |
| Stock manager | stock@supermarket.com | stock123 |

Change these passwords before any real deployment.
