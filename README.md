# SuperMarket POS Management System

Web-based supermarket management for owners, cashiers and stock managers: products, checkout, inventory, sales and reports.

## Stack

- Frontend: React, Tailwind CSS, Lucide React, Vite
- Backend: Node.js, Express, JWT, bcrypt
- Database: MongoDB Atlas with Mongoose

## Setup

1. Create a MongoDB Atlas cluster and database user. Copy the connection string.
2. Open `backend/.env` and set `MONGO_URI`.
3. Install and seed:

```bash
npm run install:all
npm run seed
npm run dev
```

- API: http://localhost:5000
- App: http://localhost:5173

## Demo accounts

| Role | Email | Password |
| --- | --- | --- |
| Administrator | admin@supermarket.com | admin123 |
| Cashier | cashier@supermarket.com | cashier123 |
| Stock manager | stock@supermarket.com | stock123 |

Change these passwords before any real deployment.

## Roles

- **Admin**: users, products, categories, sales, reports, inventory, settings
- **Cashier**: POS checkout, own sales, customers
- **Stock manager**: products, categories, inventory, stock history

## Checkout

Search by name, SKU or barcode (USB scanners that type and press Enter work in the POS search box). Cash and M-Pesa reference recording, change calculation, printable receipts, and automatic stock deduction are included. Sales store product name/price snapshots so old receipts stay accurate after price changes.
