# Wikipedia Editor Dashboard

A dynamic, React-based dashboard for Wikipedia editors to track drafts, contributions, tasks, and focus areas.

![Dashboard Preview](docs/preview.png)

## Features

- 📊 **Live Statistics** - Real-time edit counts via Wikipedia API and XTools
- 📝 **Draft Management** - Track AfC submissions with status, COI disclosures
- ✅ **Task Tracking** - Prioritized to-do list with filtering and search
- 🎯 **Focus Areas** - Organize articles by project/topic clusters
- 🔗 **Quick Links** - One-click access to contributions, watchlist, XTools
- 🌙 **Dark Mode** - Easy on the eyes for late-night editing
- 📱 **Responsive** - Works on laptop and mobile

## Tech Stack

- **Frontend**: React 18, TypeScript, Material UI 5
- **State**: Zustand, React Query
- **Build**: Vite 5
- **Testing**: Vitest (unit), Playwright (e2e)
- **Deployment**: Docker, Nginx

## Architecture

```
src/
├── domain/           # Business entities, value objects, repository interfaces
├── application/      # Business logic services
├── infrastructure/   # API clients, repository implementations
├── presentation/     # React components, hooks, theme
│   ├── components/
│   ├── hooks/
│   ├── pages/
│   └── theme/
└── __tests__/        # Unit and e2e tests
```

Follows **Domain-Driven Design (DDD)** with clean architecture layers.

## Quick Start

### Prerequisites

- Node.js 20+
- npm 10+

### Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Open http://localhost:3000
```

### Testing

```bash
# Unit tests
npm run test

# Unit tests with UI
npm run test:ui

# E2E tests
npm run test:e2e

# E2E tests with UI
npm run test:e2e:ui

# Coverage
npm run test:coverage
```

### Docker

```bash
# Development
docker-compose up dev

# Production build
docker-compose up app

# Run all tests
docker-compose up test e2e
```

## Configuration

Edit `src/domain/repositories/index.ts` to customize:

```typescript
export const DEFAULT_CONFIG: DashboardConfig = {
  username: 'YourWikipediaUsername',  // Your username
  refreshIntervalMs: 300_000,         // 5 minutes
  maxRecentContributions: 50,
  activityDays: 30,
};
```

## API Integration

The dashboard integrates with:

- **Wikipedia MediaWiki API** - User info, contributions, page data
- **XTools API** - Extended edit statistics

No authentication required for public data.

## Project Structure

| Directory | Purpose |
|-----------|---------|
| `src/domain/` | Pure business logic, no dependencies |
| `src/application/` | Use cases, orchestration |
| `src/infrastructure/` | External services, API calls |
| `src/presentation/` | UI components, React hooks |
| `docker/` | Container configuration |

## Design Principles

- **SOLID** - Single responsibility, open/closed, etc.
- **DRY** - Don't repeat yourself
- **Defensive Programming** - Validate inputs, handle errors
- **Idiomatic TypeScript** - Strict mode, readonly, const assertions
- **Material Design 3** - Google's design guidelines
- **Laptop Optimized** - Compact spacing, efficient use of screen space

## License

MIT License - see [LICENSE](LICENSE)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Write tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## Author

Built for Wikipedia editor productivity.
