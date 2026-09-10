# PH.D. OS

A personal operating system for managing a PhD application season.

**Research → Professors → Applications → Documents → Tasks → Deadlines → Communication**

Single-user. No accounts — deploy your own copy with your own data.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS v4
- Zustand (`localStorage` + optional `data/user-data.json` when self-hosted)

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Demo seed data loads automatically. Reset anytime from **Settings**.

### Fixed local URL (Mac)

```bash
npm run start:autostart   # background service at http://127.0.0.1:3000
npm run open
npm run stop:autostart
```

### Deploy (Vercel)

Push to GitHub, then import the repo in [Vercel](https://vercel.com) (or run `npx vercel`).

On Vercel, edits persist in the **browser** (`localStorage`). Download backups from Settings. Personal `data/user-data.json` is gitignored and not deployed.

## Keyboard

- `⌘K` / `Ctrl+K` — command palette

## Docs

- [User guide](docs/USER_GUIDE.md) — how to add content in each section

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run start:autostart` | Mac login service (fixed local URL) |
| `npm run pull:data` | Copy live `~/phd-os` data into this folder |
| `npm run lint` | ESLint |
