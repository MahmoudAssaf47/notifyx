# Contributing to NotifyX

Thanks for your interest in contributing! This guide will help you get started quickly.

## The 30-Minute Promise

We design the contributor experience so that:

- **Understand the project** in under 5 minutes (read this README)
- **Run the project** in under 10 minutes (follow the setup below)
- **Make your first PR** in under 30 minutes (pick a good first issue)

## Setup

### Prerequisites

- Node.js 22+
- npm
- MongoDB (local or Docker)
- Redis (optional — falls back to in-memory queue)

### Quick Start

```bash
# 1. Fork and clone
git clone https://github.com/<your-username>/notifyx.git
cd notifyx

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your local settings

# 4. Start services
npm run dev

# 5. Verify it works
curl http://localhost:8080/health
```

### With Docker (easiest)

```bash
git clone https://github.com/<your-username>/notifyx.git
cd notifyx
cp .env.example .env
docker compose up -d
```

## Finding Something to Work On

1. **Good first issues** — [Browse issues with the `good first issue` label](https://github.com/MahmoudAssaf47/notifyx/labels/good%20first%20issue)
2. **Help wanted** — [Browse issues with the `help wanted` label](https://github.com/MahmoudAssaf47/notifyx/labels/help%20wanted)
3. **Documentation** — Always needed! [docs/](docs/) directory
4. **Tests** — Improve test coverage for any service

**Not sure?** Start a [Discussion](https://github.com/MahmoudAssaf47/notifyx/discussions) and ask!

## Making Changes

### Branch Naming

```bash
git checkout -b feature/description     # new features
git checkout -b fix/description         # bug fixes
git checkout -b docs/description        # documentation only
```

### Commit Format

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>: <description>
```

Types:
- `feat:` — new feature
- `fix:` — bug fix
- `chore:` — maintenance, deps, config
- `docs:` — documentation only
- `test:` — adding or fixing tests
- `refactor:` — code restructuring without behavior change

Examples:
```
feat: add ntfy channel provider
fix: handle empty webhook URL gracefully
chore: update mongoose to 8.3
docs: add API reference for /api/notify
test: add unit tests for spam-check module
```

### Before Submitting a PR

Run these commands and make sure they all pass:

```bash
npm run build      # TypeScript compilation
npm run lint       # ESLint
npm run test       # Vitest
```

### Pull Request Checklist

Before submitting:

- [ ] `npm run build` passes
- [ ] `npm run test` passes
- [ ] `npm run lint` passes
- [ ] No secrets or credentials in code
- [ ] No AI-generated comments ("This function...", "Initialize the...")
- [ ] Documentation updated if behavior changed
- [ ] One concern per PR — keep it focused
- [ ] Clear description of what changed and why

## Code Style

- TypeScript strict mode
- 2-space indent
- No unused imports
- Function names: short and clear
- Prefer named exports over default exports

## Project Structure

```
notifyx/
├── apps/
│   ├── notifyx-gateway/          # API entry point
│   ├── notifyx-auth-service/     # Authentication
│   ├── notifyx-notification-service/  # Notification processing
│   ├── notifyx-worker-service/   # Delivery worker
│   ├── notifyx-audit-service/    # Audit logging
│   ├── notifyx-analytics-service/    # Analytics
│   └── notifyx-admin-service/    # Admin API
├── packages/
│   └── shared/                   # Shared types, utilities, models
├── docs/                         # Documentation
├── tests/                        # Unit and integration tests
└── turbo.json                    # Monorepo configuration
```

## Releases

Only maintainers tag releases. Do not include version bumps in PRs.

## Code of Conduct

Be respectful, inclusive, and constructive. See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

## Questions?

Start a [Discussion](https://github.com/MahmoudAssaf47/notifyx/discussions) — we are happy to help!
