# DataFlow360

DataFlow360 is an enterprise-style SQL database management and data warehouse analytics platform. It demonstrates a Bronze → Silver → Gold pipeline, ETL orchestration, data-quality monitoring, governed SQL exploration, and business reporting.

## Features

- JWT authentication with `ADMIN`, `ANALYST`, and `VIEWER` roles
- Responsive React dashboard with dark/light theme and Recharts visualizations
- Bronze, Silver, and Gold data explorers with search and pagination
- ETL pipeline that validates and cleans Bronze records, rebuilds Silver, and creates Gold aggregates
- Data-quality scoring for completeness, accuracy, consistency, uniqueness, and validity
- Read-only SQL editor with saved/history queries and a 500-row limit
- ETL job history and logs, revenue/customer/product/data-quality reports

## Architecture

```text
React + Vite (5173) → REST API (Express, 4000) → MySQL
                              │
                    Bronze → Silver → Gold
```

## Technology stack

- Frontend: React, Vite, JavaScript/JSX, Tailwind CSS, Lucide React, Recharts, Axios
- Backend: Node.js, Express, mysql2, dotenv, bcrypt, jsonwebtoken
- Database: MySQL 8+

## Folder structure

```text
DataFlow360/
├── frontend/                 # React application
│   ├── src/components/       # Layout, dashboard, UI, and data-grid components
│   ├── src/contexts/         # Auth, toast, and theme state
│   ├── src/pages/            # Connected product pages
│   └── src/services/api.js   # Axios API client
├── backend/
│   ├── config/ controllers/ middleware/ routes/ utils/
│   └── server.js
└── database/dataflow360.sql  # Schema, indexes, relationships, and sample data
```

## Database setup

Create/import the schema before starting the API:

```powershell
mysql -u root -p < database/dataflow360.sql
```

The supplied data intentionally contains malformed, duplicate, and incomplete Bronze records. Silver holds standardized records; Gold contains business aggregates.

## Environment variables

Copy the examples and set real values. Never commit `.env` files.

```powershell
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env
```

Backend variables: `PORT`, `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `JWT_SECRET`, `FRONTEND_URL`.

Frontend variable: `VITE_API_URL` (defaults to `http://localhost:4000/api`).

## Installation and run

```powershell
# Terminal 1 — API
cd backend
npm install
npm run dev

# Terminal 2 — UI
cd frontend
npm install
npm run dev
```
