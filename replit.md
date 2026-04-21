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
- **Storage**: AsyncStorage with in-memory mock data (no backend sync)

#### Screens
- Dashboard (home stats, quick actions)
- Cases list (filterable by status + search)
- Case Detail (tabs: Info, Violations, Notes, Notices, History)
  - Case Info tab: Close/Reopen case button; inline-editable general notes
  - Property tab: inline edit all address and parcel fields (Edit/Save/Cancel)
  - Party tab: inline edit all contact and mailing address fields
  - Violations tab: Edit button (→ edit screen) and Delete with confirmation per violation
  - Notes tab: Delete with confirmation per note
  - Photos tab: Delete with confirmation per photo
- New Case form
- Add Violation form (with ordinance picker)
- Edit Violation form (pre-populated, keeps or replaces deadline, all fields editable)
- Media/evidence workflow starts with a required capture method. Standard Photo/Video captures normal evidence fields only; Drone Flight Evidence additionally requires flight attribution, pilot selection/self attribution, flight date, and mission notes.
- Add Note
- Ordinance Library (searchable, categorized)
- Ordinance Detail
- Notice Generator (auto-fill, violation picker, stages)
- Notice Preview (letter format)
- Reports (stats, bar charts by status and ordinance)
- Settings (current user profile summary, administration links, legacy profile/preferences)
- Administration
  - User Management: create/edit/deactivate users, switch current user, assign fixed roles, manage profile/certification fields, and grant optional per-user permission overrides
  - Role Management: edit permission levels for fixed system roles across enforcement categories
  - Audit Log: persistent user and role change history with actor ID/display name snapshots

#### User and Role Management
- User management is stored locally in AsyncStorage keys `@ceh:users`, `@ceh:roles`, `@ceh:auditLog`, and `@ceh:currentUserId`.
- Fixed roles: Platform Super Admin, Municipal Admin, Code Enforcement Officer, Authorized Pilot, Supervisor / Reviewer, Read-Only Staff.
- Permission categories: caseManagement, violations, notices, ordinanceLibrary, aerialEvidence, userAdminManagement.
- Permission levels: none, view, edit, admin.
- Per-user `permissionOverrides` can raise access above the user's fixed role for special cases; overrides do not lower inherited role permissions.
- Inactive users have no effective permissions.
- Municipal Admins can administer users only inside their own municipality and cannot assign Platform Super Admin.
- UI actions and context-level mutations enforce permissions for cases, property/party edits, violations, evidence, notes, notices, role changes, and user administration.
- Default users: James Martinez (Municipal Admin), Dana Kim (Authorized Pilot), Marcus Reed (Supervisor / Reviewer).
- Cases, violations, notes, attachments, notices, and case status changes stamp user ID and display name snapshots from the current user.
- Approved drone pilots are derived from active certified users in the same municipality with Authorized Pilot, Municipal Admin, or Supervisor / Reviewer roles.

#### Data Models
- `User`, `PlatformUser`, `RoleDefinition`, `AuditLogEntry`, `Property`, `ResponsibleParty`, `EnforcementCase`
- `CaseViolation`, `Ordinance`, `Notice`, `CaseNote`, `Attachment`
- Evidence attachments support capture method, date captured, uploader, area observed, observation notes, linked violations, use-in-notice flag, and drone-only pilot attribution snapshots for municipal audit trails.

#### Case Number Format
- `CE-YYYY-####` (e.g., CE-2026-0001)

#### Case Statuses
- Open, Pending, Notice Sent, Reinspection Needed, Closed

#### UI/Responsiveness
- All screens use `maxWidth: 720` centered content on web — header bars span full-width, list/form content is column-centered
- Admin push screens use centered web content up to roughly 760px and normal full-width mobile layouts
- Dashboard stats grid: 2×2 on screens < 580px, 4-in-a-row on wider screens (uses `useWindowDimensions`)
- Mobile layouts are unaffected by web centering (all guards use `Platform.OS === 'web'` or `screenWidth >= 580`)

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
