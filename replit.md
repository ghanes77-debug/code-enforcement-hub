# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Contains a Code Enforcement Hub mobile app (Expo/React Native) and API server.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Artifacts

### Code Enforcement Hub (`artifacts/code-enforcement-hub`)
- **Type**: Expo/React Native (cross-platform: iOS, Android, Web)
- **Purpose**: Case management app for code enforcement officers
- **Color scheme**: Navy blue (#1a3a5c) primary, gold (#c9a227) accent
- **Storage**: AsyncStorage with in-memory mock data (no backend yet)

#### Screens
- Dashboard (home stats, quick actions)
- Cases list (filterable by status + search)
- Case Detail (tabs: Info, Violations, Notes, Notices, History)
- New Case form
- Add Violation form (with ordinance picker)
- Add Note
- Ordinance Library (searchable, categorized)
- Ordinance Detail
- Notice Generator (auto-fill, violation picker, stages)
- Notice Preview (letter format)
- Reports (stats, bar charts by status and ordinance)
- Settings (profile, preferences)

#### Data Models
- `User`, `Property`, `ResponsibleParty`, `EnforcementCase`
- `CaseViolation`, `Ordinance`, `Notice`, `CaseNote`, `Attachment`

#### Case Number Format
- `CE-YYYY-####` (e.g., CE-2026-0001)

#### Case Statuses
- Open, Pending, Notice Sent, Reinspection Needed, Closed

#### Sample Ordinances
- Sec. 18-55 Height of Grass and Weeds
- Sec. 36-23 Other Accumulations
- Sec. 28-388 Junked Vehicles
- Sec. 10-297 Substandard Buildings
- Sec. 18-53 Stagnant Water
- Sec. 34-54 Sign Maintenance

### API Server (`artifacts/api-server`)
- Express 5, TypeScript, Pino logger

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
