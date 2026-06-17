# PROXIMITY

A modern browser-based competitive card game built with a deterministic simulation engine.

This repository contains the complete monorepo for the project.

---

## Tech Stack

- Node.js 22 LTS
- pnpm 10
- Next.js 16 (App Router)
- React 19
- Tailwind CSS 4
- PostgreSQL 16
- Prisma ORM 7
- TypeScript
- Docker Compose

---

## Repository Structure

.
├── apps/
│ └── web/ # Next.js application
│
├── packages/
│ ├── protocol/ # Shared DTOs, Zod schemas and types
│ └── simulation/ # Deterministic game simulation
│
├── docker-compose.yml
├── package.json
└── pnpm-workspace.yaml

---

## Requirements

Install:

- Node.js 22 LTS
- pnpm 10
- Docker Desktop

---

## First-Time Setup

Install dependencies:

```bash
pnpm install
```

Copy the environment file:

```bash
cp apps/web/.env.example apps/web/.env
```

(Windows users can simply duplicate the file.)

Start PostgreSQL:

```bash
pnpm db:up
```

Generate the Prisma client:

```bash
pnpm prisma:generate
```

Run database migrations:

```bash
pnpm prisma:migrate
```

Start the development server:

```bash
pnpm dev
```

The application will be available at:

```
http://localhost:3000
```

---

## Useful Commands

### Development

```bash
pnpm dev
```

### Build

```bash
pnpm build
```

### Lint

```bash
pnpm lint
```

### Type Check

```bash
pnpm typecheck
```

### Verify Repository

```bash
pnpm verify
```

---

## Database

Start PostgreSQL:

```bash
pnpm db:up
```

Stop PostgreSQL:

```bash
pnpm db:down
```

Reset the database:

```bash
pnpm db:reset
```

Open Prisma Studio:

```bash
pnpm prisma:studio
```

---

## Project Status

The repository currently contains only the infrastructure.

Gameplay systems, networking, and user interface features will be developed incrementally on top of this stable foundation.
