# Contributing to NotifyX

## Setup

```bash
git clone https://github.com/MahmoudAssaf47/notifyx.git
cd notifyx
npm install
cp .env.example .env
npm run dev
```

## Commit Format

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
feat: add Telegram channel support
fix: handle empty webhook URL gracefully
chore: update mongoose to 8.3
docs: add API reference for /api/notify
```

## Branch Names

- `feature/description` — new features
- `fix/description` — bug fixes
- `chore/description` — maintenance

## Pull Request Checklist

Before submitting:

- [ ] `npm run build` passes
- [ ] `npm run test` passes
- [ ] `npm run lint` passes
- [ ] No secrets or credentials in code
- [ ] No AI-generated comments ("This function...", "Initialize the...")
- [ ] Documentation updated if behavior changed
- [ ] One concern per PR — keep it focused

## Code Style

- TypeScript strict mode
- 2-space indent
- No unused imports
- Function names: short and clear (`authenticateUser`, not `handleUserAuthenticationProcess`)

## Releases

Only maintainers tag releases. Do not include version bumps in PRs.
