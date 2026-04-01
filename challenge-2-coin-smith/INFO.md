# Coin Smith — Quick Reference

## Commands

```bash
# Setup (install all dependencies)
./setup.sh

# Run CLI on a single fixture
./cli.sh fixtures/basic_change_p2wpkh.json
# → Output: out/basic_change_p2wpkh.json

# Run grader (all 24 public fixtures)
bash grade.sh

# Run unit tests (68 tests)
npx vitest run

# Start web dev server (default port 3000)
./web.sh
# Custom port:
PORT=4000 ./web.sh
```

## Web UI

- **URL:** http://127.0.0.1:3000
- **Health:** GET /api/health → `{ "ok": true }`
- **Build:** POST /api/build → send fixture JSON, get build result
- **Fixtures:** GET /api/fixtures → list example fixtures

## Project Structure

```
src/           Core library (shared between CLI + Web)
tests/         68 unit tests (vitest)
fixtures/      24 public test fixtures (DO NOT MODIFY)
web/           Next.js web app (dark theme, shadcn/ui)
out/           CLI output directory (gitignored)
```

## Key Files

| File | Purpose |
|------|---------|
| `cli.sh` | CLI entry point |
| `web.sh` | Web server entry point |
| `setup.sh` | Install dependencies |
| `grade.sh` | Grading script (DO NOT MODIFY) |
| `demo.md` | Demo video link |
