# Setup

## Requirements

- Node 22+
- pnpm

## Install

```bash
pnpm install --ignore-scripts
```

Puppeteer is already configured as an ignored build dependency for this project. Do not approve third-party install scripts unless you know why the script is needed.

## Environment

Copy `.env.example` to `.env` and fill only the providers you use.

```bash
cp .env.example .env
```

LLM keys are optional. Without keys, the system still runs and produces deterministic local drafts.

## Run Dashboard

```bash
pnpm dev
```

Open:

```text
http://localhost:5173/marketing-dashboard
```

## Generate Data

```bash
pnpm audit:site -- --url=https://youraicoach.life --max-pages=25
pnpm keywords:generate -- --seed="AI personal trainer accountability"
pnpm blog:create -- --keyword="fitness app that calls you"
pnpm social:repurpose
pnpm report:weekly
```

Artifacts are written to:

```text
data/marketing-employee/
```

Dashboard snapshot is written to:

```text
public/marketing-data/index.json
```

## Docker Compose

```bash
docker compose up
```

This starts the Vite dashboard and the worker health service. The worker health endpoint is:

```text
http://localhost:4317/health
```

