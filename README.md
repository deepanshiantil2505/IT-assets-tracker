# Nexus IT — Asset & Ticket Tracker

An internal-style IT service desk: employees raise support tickets, IT agents triage and
resolve them, and admins track hardware assets end to end. Built to look and behave like a
real enterprise tool (role-based access, audit-friendly data model, analytics dashboard)
rather than a demo CRUD app.

## Why this project

Internal tooling — asset tracking, ticketing, workflow dashboards — is exactly the kind of
system enterprise IT organizations build and maintain. This project deliberately mirrors that:
three distinct roles, permission boundaries enforced server-side (not just hidden in the UI),
and a dashboard an IT manager would actually want to look at.

## Tech stack

| Layer      | Choices |
|------------|---------|
| Frontend   | React 18, TypeScript, Vite, Tailwind CSS, Recharts, React Router |
| Backend    | Node.js, Express, TypeScript, Prisma ORM |
| Database   | SQLite (dev) — schema is portable to Postgres/MySQL via Prisma |
| Auth       | JWT, bcrypt password hashing, role-based access control (RBAC) |
| Testing    | Jest + Supertest (API integration tests) |

## Core features

- **Role-based access control** — `ADMIN`, `AGENT`, `EMPLOYEE`. Employees only ever see their
  own tickets; only admins/agents can update ticket status, assign tickets, or manage assets.
  Enforced in middleware on the backend, not just hidden in the UI.
- **Ticketing workflow** — create, comment, and move tickets through `OPEN → IN_PROGRESS →
  RESOLVED → CLOSED`, with priority levels and optional linkage to a specific asset.
- **Asset inventory** — track hardware by tag, category, serial number, status, and current
  owner, with search and filtering.
- **Analytics dashboard** — tickets by status/priority, assets by status, and average
  resolution time, computed server-side and rendered with Recharts.
- **Seed script** — one command loads three demo users (one per role) and sample
  tickets/assets so the app is immediately explorable.

## Architecture

```
frontend (React/Vite)  ──HTTP/JSON──►  backend (Express/TS)  ──Prisma──►  SQLite
      │                                      │
   JWT stored in localStorage          JWT verified per-request,
   attached via axios interceptor      role checked via middleware
```

Data model (see `backend/prisma/schema.prisma`):

```
User ──< Asset (owner)        User ──< Ticket (requester, assignee)
Asset ──< Ticket (optional)   Ticket ──< Comment >── User (author)
```

## Getting started

Requires Node.js 18+.

### 1. Backend

```bash
cd backend
cp .env.example .env          # edit JWT_SECRET if you like
npm install
npx prisma migrate dev --name init
npm run seed                  # loads demo users + sample data
npm run dev                   # http://localhost:4000
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev                   # http://localhost:5173
```

The Vite dev server proxies `/api` to `http://localhost:4000`, so both must be running.

### 3. Log in

Use one of the seeded accounts (password for all: `Password123!`):

| Role     | Email                  | Can do |
|----------|-------------------------|--------|
| Admin    | admin@company.com      | Everything, including deleting assets |
| Agent    | agent@company.com      | Manage tickets/assets, cannot delete assets |
| Employee | employee@company.com   | Raise tickets, view only their own |

### 4. Run the tests

```bash
cd backend
npm test
```

Covers registration/login flows and confirms RBAC is enforced (e.g. an employee gets a 403
when trying to change a ticket's status directly).

## What I'd add next

- Email notifications on ticket status changes (e.g. via SendGrid)
- Optimistic UI updates and pagination controls on the tickets/assets tables
- SLA countdown per priority level, surfaced on the dashboard
- Deploy: backend on Render/Railway, frontend on Vercel, Postgres instead of SQLite

