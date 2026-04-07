# Sparkle Note Hub

## Overview

A personal note-taking application built as a pnpm monorepo. Notes are stored in a local MongoDB database with a React + Vite frontend and Express backend.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React 19 + Vite + Tailwind CSS
- **API framework**: Express 5
- **Database**: MongoDB (local, port 27017)
- **MongoDB client**: mongodb v6
- **Validation**: Zod (`zod/v4`)
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Project Structure

```
artifacts/
  api-server/     - Express backend (routes, MongoDB connection)
  sparkle-note-hub/ - React+Vite frontend
lib/
  mongodb/        - Shared MongoDB connection library (connectMongoDB, getDb)
  api-spec/       - OpenAPI spec (source of truth for API contract)
  api-client-react/ - Generated React Query hooks
  api-zod/        - Generated Zod validation schemas
  db/             - Drizzle/PostgreSQL (unused, original workspace default)
```

## MongoDB Setup

MongoDB runs locally (no cloud). Data directory: `~/.mongodb/data`

The MongoDB library is in `lib/mongodb/src/index.ts` and provides:
- `connectMongoDB()` - connect and return db instance
- `getDb()` - get existing db connection (reconnects if needed)

Environment variables:
- `MONGODB_URI` - MongoDB connection string (default: `mongodb://127.0.0.1:27017`)
- `MONGODB_DB_NAME` - Database name (default: `sparkle_note_hub`)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Workflows

1. **MongoDB** — starts local mongod, tails log
2. **artifacts/api-server: API Server** — builds and starts Express backend
3. **artifacts/sparkle-note-hub: web** — runs Vite dev server for frontend

## API Routes

All routes are under `/api`:
- `GET /healthz` — health check
- `GET /notes` — list notes (supports `?search=`, `?tag=`, `?pinned=true`)
- `POST /notes` — create note
- `GET /notes/stats` — dashboard statistics
- `GET /notes/tags` — all unique tags with counts
- `GET /notes/recent` — 5 most recently updated notes
- `GET /notes/:id` — get single note
- `PUT /notes/:id` — update note
- `DELETE /notes/:id` — delete note
- `PATCH /notes/:id/pin` — toggle pin status
