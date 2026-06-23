# Contributing to NotifyX

Thank you for your interest in contributing to NotifyX.

## Code of Conduct

By participating, you agree to abide by the [Code of Conduct](CODE_OF_CONDUCT.md).

## Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run lint and type check (`npm run lint && npm run typecheck`)
5. Commit with clear messages
6. Push and open a Pull Request

## Development Setup

```bash
# Clone and install
git clone https://github.com/MahmoudAssaf47/notifyx.git
cd notifyx
npm install

# Copy environment variables
cp .env.example .env

# Start in development mode
npm run dev
```

## Pull Request Guidelines

- Keep changes focused. One feature per PR.
- Write clear commit messages.
- Update documentation for any changed behavior.
- Ensure all secrets are in environment variables, never hardcoded.
- Add tests for new functionality.

## Project Structure

```
apps/          # Microservices
packages/      # Shared libraries
docker/        # Dockerfiles
docs/          # Documentation
.github/       # CI and templates
```

## Code Style

- TypeScript with strict mode
- 2-space indentation
- No unused variables or imports
- Clear function and variable names
- JSDoc comments for public APIs

## Questions?

Open an issue or reach out to [Mahmoud Assaf](https://github.com/MahmoudAssaf47).
