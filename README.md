# Multi-Modal Research — Client

Next.js frontend for the multi-modal research tool. A user creates a project to
act as a research domain, uploads the documents (or source URLs to scrape —
currently unavailable, the backend's ScrapingBee API key has expired) they want
to gather information from, and then chats with that project to research over its contents — every answer comes with
citations back to the source material.

## Stack

- Next.js 16 (App Router), React 19, TypeScript
- Tailwind CSS
- Clerk (`@clerk/nextjs`) for authentication
- `react-dropzone` for file uploads, `react-hot-toast` for notifications

## Pages

- `(auth)/sign-in`, `(auth)/sign-up` — Clerk auth flows
- `(dashboard)/projects` — project list
- `(dashboard)/projects/[projectId]` — project detail: upload documents, inspect
  ingestion pipeline status per file
- `(dashboard)/projects/[projectId]/chats/[chatId]` — chat interface with citations

## Setup

```bash
cd client
npm install
cp .env.example .env.local   # fill in the values below
npm run dev
```

Runs at `http://localhost:3000`.

### Environment variables

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk public key (browser-side) |
| `CLERK_SECRET_KEY` | Clerk secret key (server-side, used by Next.js middleware) |
| `NEXT_PUBLIC_API_BASE_URL` | Base URL of the backend API (e.g. `http://localhost:8000`) |

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run start` | Serve a production build |
| `npm run lint` | Lint |

## Deployment

Currently deployed on Railway, built via Nixpacks (`npm run build` / `npm run
start`) — no Dockerfile needed. `NEXT_PUBLIC_*` variables must be set on the
Railway service *before* the build runs, since Next.js inlines them at build time.
Note the app listens on the port given by the `PORT` env var (`next start`
defaults away from 3000 if Railway doesn't get `PORT` set explicitly).
