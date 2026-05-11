# Code Enforcement Hub — Migration Plan
## Expo / React Native + AsyncStorage → Next.js + Supabase

**Document Date:** May 2026  
**Source Artifact:** `artifacts/code-enforcement-hub`  
**Target Stack:** Next.js 14 (App Router) + Supabase (Postgres + Auth + Storage)

---

## Table of Contents

1. [Current Architecture](#1-current-architecture)
2. [Target Architecture](#2-target-architecture)
3. [Data Models → Database Schema](#3-data-models--database-schema)
4. [Screen / Route Inventory](#4-screen--route-inventory)
5. [Authentication & Session Migration](#5-authentication--session-migration)
6. [Role & Permission System](#6-role--permission-system)
7. [State Management → API Layer](#7-state-management--api-layer)
8. [File & Image Storage](#8-file--image-storage)
9. [Notice Generator](#9-notice-generator)
10. [Design Tokens & Component System](#10-design-tokens--component-system)
11. [Known Limitations in Current App](#11-known-limitations-in-current-app)
12. [Migration Phases](#12-migration-phases)
13. [Decision Log](#13-decision-log)

---

## 1. Current Architecture

### Runtime & Framework

| Layer | Current |
|---|---|
| Framework | Expo SDK 54 / React Native 0.81.5 (iOS / Android / Web via react-native-web) |
| Routing | `expo-router` v6 (file-based, App Router style) |
| Language | TypeScript 5.9 |
| Package manager | pnpm workspaces monorepo |
| Styling | React Native StyleSheet + `constants/colors.ts` design tokens |
| Icons | `lucide-react-native` SVG (mapped through `components/Icon.tsx`) |
| Fonts | `@expo-google-fonts/inter` (Inter 400/500/600/700) |

### Folder Structure

```
artifacts/code-enforcement-hub/
├── app/                          # expo-router file-based routes
│   ├── _layout.tsx               # Root layout: font loading, providers, session gate
│   ├── login.tsx                 # Login screen (username + PIN)
│   ├── +not-found.tsx            # 404 fallback
│   ├── (tabs)/                   # Bottom-tab navigator group
│   │   ├── _layout.tsx           # Tab bar config
│   │   ├── index.tsx             # Dashboard
│   │   ├── cases/index.tsx       # Cases list (filterable)
│   │   ├── ordinances/index.tsx  # Ordinance library
│   │   ├── reports.tsx           # Reports / charts
│   │   └── settings.tsx          # Settings + admin links
│   ├── cases/
│   │   ├── [id].tsx              # Case detail (8 tabs, 1230 lines)
│   │   └── new.tsx               # New case form
│   ├── violations/
│   │   ├── add.tsx               # Add violation (ordinance picker)
│   │   └── edit.tsx              # Edit violation (pre-populated)
│   ├── notes/add.tsx             # Add note
│   ├── ordinances/[id].tsx       # Ordinance detail
│   ├── notices/
│   │   ├── generate.tsx          # Notice generator wizard
│   │   ├── preview.tsx           # Notice letter preview
│   │   └── [id].tsx              # Existing notice viewer
│   ├── photos/add.tsx            # Evidence upload (standard + drone)
│   └── admin/
│       ├── users.tsx             # User management
│       ├── roles.tsx             # Role/permission editor
│       ├── audit.tsx             # Audit log viewer
│       └── tenants.tsx           # Tenant management (PSA only)
├── components/
│   ├── CaseCard.tsx              # Case summary card (address, party, violation count)
│   ├── EmptyState.tsx            # Empty list placeholder
│   ├── ErrorBoundary.tsx         # React error boundary
│   ├── ErrorFallback.tsx         # Fallback UI for error boundary
│   ├── Icon.tsx                  # lucide-react-native SVG wrapper (all icon names mapped here)
│   ├── KeyboardAwareScrollViewCompat.tsx  # Cross-platform keyboard avoidance
│   ├── SectionHeader.tsx         # Labelled section divider
│   └── StatusBadge.tsx           # Colored status pill
├── constants/
│   └── colors.ts                 # Design token palette (light mode)
├── context/
│   ├── AppContext.tsx            # All case/property/party/ordinance state + mutations
│   ├── SessionContext.tsx        # Login/logout, session persistence
│   ├── SettingsContext.tsx       # Inspector profile + notice template settings
│   └── UserManagementContext.tsx # Users, roles, audit log, permission engine
├── data/
│   ├── defaultUsers.ts           # 5 seed users + 6 default role definitions
│   └── mockData.ts               # 4 cases, 4 properties, 4 parties, 6 ordinances
├── hooks/
│   └── useColors.ts              # Returns current color tokens (light mode only)
└── types/
    └── models.ts                 # All TypeScript interfaces and union types
```

### Storage

All persistence is **local-only** via `@react-native-async-storage/async-storage`.

| Key | Contents |
|---|---|
| `@ceh:session` | Active `TenantSession` (userId, role, tenantId, etc.) |
| `@ceh:users` | Array of `PlatformUser` (merged with seed on load) |
| `@ceh:roles` | Array of `RoleDefinition` (6 fixed roles + custom permissions) |
| `@ceh:auditLog` | Array of `AuditLogEntry` |
| `@ceh:cases` | Array of `EnforcementCase` (with nested violations, notes, attachments, notices) |
| `@ceh:properties` | Array of `Property` |
| `@ceh:responsibleParties` | Array of `ResponsibleParty` |
| `@ceh:settings` | `AppSettings` (inspector profile, notice templates, approved pilots) |
| `@ceh:dataVersion` | String version tag (`v5-tenant-aware`) for seed cache-busting |

### Context Providers (State Management)

```
_layout.tsx
└── SessionProvider          (SessionContext.tsx)
    └── UserManagementProvider (UserManagementContext.tsx)
        └── AppProvider        (AppContext.tsx)
            └── SettingsProvider (SettingsContext.tsx)
```

- **SessionContext** — login/logout, active `TenantSession`, PIN auth
- **UserManagementContext** — CRUD for `PlatformUser`, `RoleDefinition`, `AuditLogEntry`; RBAC `hasPermission()`
- **AppContext** — CRUD for cases, properties, responsible parties, ordinances; tenant-filtered `cases` view
- **SettingsContext** — inspector profile, municipality settings, notice templates, approved pilot list

### Seed Data

- **`data/defaultUsers.ts`** — 5 `PlatformUser` records (jmartinez, dkim, mreed, schen, atorres) used as the canonical source for both `SessionContext` and `UserManagementContext`.
- **`data/mockData.ts`** — 4 cases, 4 properties, 4 responsible parties, 6 ordinances. All cases belong to `springfield-tx` (atorres at `riverside-ca` has no cases).

---

## 2. Target Architecture

| Layer | Target |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5 |
| Database | Supabase Postgres |
| Auth | Supabase Auth (email + magic link or email + password; remove PIN) |
| File storage | Supabase Storage (replace base64 URIs) |
| ORM | Drizzle ORM (already used in `lib/db`) |
| API validation | Zod (already used across the monorepo) |
| Styling | Tailwind CSS + shadcn/ui (adapts design tokens) |
| Icons | Lucide React (mirrors Feather set used in current app) |
| Fonts | `next/font` (Inter) |
| Deployment | Replit deployments (or Vercel for Next.js artifact) |

### Monorepo placement

Create a new artifact `artifacts/web-app` alongside the existing Expo artifact. Share types via a new `lib/shared-types` package that both artifacts import.

---

## 3. Data Models → Database Schema

### 3.1 Denormalization decision

The current app stores `violations`, `notes`, `attachments`, `notices`, and `statusHistory` as **nested arrays inside `EnforcementCase`**. In Postgres these become separate tables with foreign keys.

### 3.2 Tables

```sql
-- Tenants / municipalities
tenants (
  id            text PRIMARY KEY,        -- e.g. 'springfield-tx'
  name          text NOT NULL,
  department_name text,
  created_at    timestamptz DEFAULT now()
)

-- Users (maps to PlatformUser)
users (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id                uuid REFERENCES auth.users,  -- Supabase Auth link
  first_name                  text,
  last_name                   text,
  display_name                text NOT NULL,
  email                       text UNIQUE NOT NULL,
  phone                       text,
  username                    text UNIQUE,
  municipality                text,
  municipality_id             text REFERENCES tenants(id),
  department                  text,
  title                       text,
  role                        text NOT NULL,               -- SystemRole enum
  permission_overrides        jsonb,                       -- Partial<RolePermissions>
  is_active                   boolean DEFAULT true,
  tdlr_ce_number              text,
  pilot_certification_status  text DEFAULT 'Not Applicable',
  certification_id            text,
  certification_expiration_date date,
  training_completion_date    date,
  created_at                  timestamptz DEFAULT now(),
  updated_at                  timestamptz DEFAULT now(),
  created_by_user_id          uuid REFERENCES users(id),
  updated_by_user_id          uuid REFERENCES users(id)
)

-- Role definitions (6 fixed roles with editable permission levels)
role_definitions (
  role                text PRIMARY KEY,  -- SystemRole
  description         text,
  permissions         jsonb NOT NULL,    -- RolePermissions
  updated_at          timestamptz,
  updated_by_user_id  uuid REFERENCES users(id)
)

-- Audit log
audit_log (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action              text NOT NULL,
  target_type         text NOT NULL,    -- 'user' | 'role'
  target_id           text NOT NULL,
  target_display_name text,
  actor_user_id       uuid REFERENCES users(id),
  actor_display_name  text,
  details             text,
  created_at          timestamptz DEFAULT now()
)

-- Properties
properties (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  address        text NOT NULL,
  city           text,
  state          text,
  zip            text,
  parcel_number  text,
  lot_number     text,
  subdivision    text,
  property_type  text,
  zoning_code    text,
  created_at     timestamptz DEFAULT now()
)

-- Responsible parties
responsible_parties (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL,
  phone        text,
  email        text,
  address      text,
  city         text,
  state        text,
  zip          text,
  relationship text
)

-- Enforcement cases (maps to EnforcementCase)
cases (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_number             text UNIQUE NOT NULL,  -- CE-YYYY-####
  municipality_id         text NOT NULL REFERENCES tenants(id),
  property_id             uuid REFERENCES properties(id),
  responsible_party_id    uuid REFERENCES responsible_parties(id),
  inspector_id            uuid REFERENCES users(id),
  status                  text NOT NULL DEFAULT 'Open',  -- CaseStatus
  general_notes           text,
  opened_date             date NOT NULL,
  closed_date             date,
  created_at              timestamptz DEFAULT now(),
  updated_at              timestamptz DEFAULT now(),
  created_by_user_id      uuid REFERENCES users(id),
  updated_by_user_id      uuid REFERENCES users(id)
)

-- Ordinances (currently static seed data — promote to DB)
ordinances (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  municipality_id text REFERENCES tenants(id),  -- NULL = global / all tenants
  section_number text NOT NULL,
  title          text NOT NULL,
  category       text,
  summary        text,
  full_text      text
)

-- Case violations
violations (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id                  uuid NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  ordinance_id             uuid REFERENCES ordinances(id),
  ordinance_section_number text,
  violation_title          text NOT NULL,
  violation_description    text,
  compliance_deadline      date,
  notice_stage             text,  -- NoticeStage
  inspector_notes          text,
  created_at               timestamptz DEFAULT now(),
  created_by_user_id       uuid REFERENCES users(id),
  updated_by_user_id       uuid REFERENCES users(id)
)

-- Case notes
case_notes (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id              uuid NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  text                 text NOT NULL,
  author_name          text,
  created_at           timestamptz DEFAULT now(),
  created_by_user_id   uuid REFERENCES users(id)
)

-- Attachments / evidence (photos, documents)
attachments (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id                 uuid NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  storage_path            text NOT NULL,  -- Supabase Storage object path (replaces base64 uri)
  filename                text,
  type                    text DEFAULT 'photo',  -- 'photo' | 'document'
  caption                 text,
  capture_method          text,           -- 'standard' | 'drone'
  date_captured           date,
  area_observed           text,
  observation_notes       text,
  linked_violation_ids    uuid[],
  use_in_notice           boolean DEFAULT false,
  -- Evidence snapshots (denormalized for audit trail)
  uploaded_by             jsonb,          -- EvidencePersonSnapshot
  record_created_by       jsonb,
  flight_conducted_by     jsonb,          -- populated for drone capture
  flight_attribution_mode text,           -- 'self' | 'authorized_pilot'
  flight_date             date,
  mission_notes           text,
  created_at              timestamptz DEFAULT now(),
  created_by_user_id      uuid REFERENCES users(id)
)

-- Notices (generated letters)
notices (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id              uuid NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  stage                text NOT NULL,  -- NoticeStage
  due_date             date,
  content              text,           -- plain-text letter body (future: add pdf_storage_path)
  violation_ids        uuid[],
  sent_at              timestamptz,
  created_at           timestamptz DEFAULT now(),
  created_by_user_id   uuid REFERENCES users(id)
)

-- Case status history
case_status_history (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id                 uuid NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  status                  text NOT NULL,
  note                    text,
  changed_at              timestamptz DEFAULT now(),
  changed_by_user_id      uuid REFERENCES users(id),
  changed_by_display_name text
)

-- Municipality settings (maps to AppSettings, per-tenant)
municipality_settings (
  municipality_id        text PRIMARY KEY REFERENCES tenants(id),
  inspector_name         text,
  inspector_badge        text,
  inspector_role         text,
  inspector_phone        text,
  inspector_email        text,
  inspector_department   text,
  city_name              text,
  department_name        text,
  city_address           text,
  city_phone             text,
  first_notice_days      int DEFAULT 14,
  second_notice_days     int DEFAULT 7,
  final_notice_days      int DEFAULT 5,
  opening_first          text,
  opening_second         text,
  opening_final          text,
  closing_default        text,
  closing_final          text,
  updated_at             timestamptz DEFAULT now()
)
```

### 3.3 Notable schema decisions

- **`violations`, `case_notes`, `attachments`, `notices`, `case_status_history`** break out of the nested-array pattern. Each is a proper child table with `ON DELETE CASCADE`.
- **Evidence person snapshots** (`uploaded_by`, `flight_conducted_by`, etc.) are stored as `jsonb` columns to preserve the immutable audit-trail snapshot semantics of the current app.
- **`permission_overrides`** on `users` is `jsonb` — same shape as current `Partial<RolePermissions>`.
- **`ordinances`** move from static seed to a DB table with an optional `municipality_id` (NULL = available to all tenants).
- **`role_definitions`** are seeded on first run; `permissions` column is `jsonb` matching `RolePermissions`.
- **`linked_violation_ids`** on attachments uses a Postgres `uuid[]` array; a join table is the normalized alternative but the current usage is simple enough that an array column suffices initially.

### 3.4 Row-Level Security (RLS) strategy

| Table | Policy |
|---|---|
| `cases`, `violations`, `case_notes`, `attachments`, `notices`, `case_status_history` | Users can only SELECT/INSERT/UPDATE/DELETE rows where `municipality_id` matches their `users.municipality_id`, OR they have role `Platform Super Admin`. |
| `users` | Municipal Admins can only see/modify users in their own tenant. PSA sees all. |
| `role_definitions` | Read: all authenticated users. Write: PSA + Municipal Admin. |
| `audit_log` | Read: Municipal Admin (own tenant) + PSA. Insert: service role only. |
| `attachments` (Storage bucket) | Bucket policy: read requires authenticated user in same tenant; write requires `aerialEvidence` >= `edit` permission. |

---

## 4. Screen / Route Inventory

### 4.1 Current expo-router routes → Next.js App Router routes

| Current path | Screen description | Next.js path |
|---|---|---|
| `app/login.tsx` | PIN login + demo quick-select | `app/(auth)/login/page.tsx` |
| `app/(tabs)/index.tsx` | Dashboard (stats, quick actions) | `app/(app)/dashboard/page.tsx` |
| `app/(tabs)/cases/index.tsx` | Cases list (filter + search) | `app/(app)/cases/page.tsx` |
| `app/cases/[id].tsx` | Case detail (8-tab layout) | `app/(app)/cases/[id]/page.tsx` |
| `app/cases/new.tsx` | New case form | `app/(app)/cases/new/page.tsx` |
| `app/violations/add.tsx` | Add violation (ordinance picker + fields) | `app/(app)/cases/[id]/violations/new/page.tsx` |
| `app/violations/edit.tsx` | Edit violation | `app/(app)/cases/[id]/violations/[vid]/edit/page.tsx` |
| `app/notes/add.tsx` | Add note | `app/(app)/cases/[id]/notes/new/page.tsx` |
| `app/photos/add.tsx` | Add photo / drone evidence | `app/(app)/cases/[id]/evidence/new/page.tsx` |
| `app/notices/generate.tsx` | Notice generator (auto-fill + violation picker) | `app/(app)/cases/[id]/notices/new/page.tsx` |
| `app/notices/[id].tsx` | Notice detail | `app/(app)/cases/[id]/notices/[nid]/page.tsx` |
| `app/notices/preview.tsx` | Notice letter preview | `app/(app)/cases/[id]/notices/[nid]/preview/page.tsx` |
| `app/(tabs)/ordinances/index.tsx` | Ordinance library (search + categories) | `app/(app)/ordinances/page.tsx` |
| `app/ordinances/[id].tsx` | Ordinance detail | `app/(app)/ordinances/[id]/page.tsx` |
| `app/(tabs)/reports.tsx` | Reports (stats, bar charts, notice due table) | `app/(app)/reports/page.tsx` |
| `app/(tabs)/settings.tsx` | Settings (profile, admin links, sign-out) | `app/(app)/settings/page.tsx` |
| `app/admin/users.tsx` | User management | `app/(app)/admin/users/page.tsx` |
| `app/admin/roles.tsx` | Role management | `app/(app)/admin/roles/page.tsx` |
| `app/admin/audit.tsx` | Audit log | `app/(app)/admin/audit/page.tsx` |
| `app/admin/tenants.tsx` | Tenant management (PSA only) | `app/(app)/admin/tenants/page.tsx` |

### 4.2 Case Detail Tabs (`app/cases/[id].tsx`)

The single most complex screen in the app. Tabs are rendered inline (not as separate routes) with badge counts on Violations, Notes, Photos, and Notices.

| Tab key | Label | Content |
|---|---|---|
| `info` | Case Info | Status quick-change chips, general notes (inline edit), close/reopen button, officer/opened-date metadata |
| `property` | Property | Address and parcel fields with Edit/Save/Cancel inline editing |
| `party` | Party | Responsible party name, phone, email, mailing address — inline edit |
| `violations` | Violations | List with per-violation Edit (→ `violations/edit`) and Delete with confirmation |
| `photos` | Photos | Evidence grid; delete with confirmation per item |
| `notes` | Notes | Chronological notes with delete confirmation |
| `notices` | Notices | All generated notices for this case; mark-as-sent action |
| `history` | History | Status change timeline with actor display-name snapshots |

Navigation into sub-screens passes `caseId` as a query param:
- `violations/add?caseId=…`
- `violations/edit?caseId=…&violationId=…`
- `notes/add?caseId=…`
- `photos/add?caseId=…`
- `notices/generate?caseId=…`
- `notices/preview?caseId=…&noticeId=…&stage=…`

### 4.3 Route groups

- `(auth)` — public, unauthenticated routes (login, future signup)
- `(app)` — protected by Supabase session middleware; redirect to login if no session

---

## 5. Authentication & Session Migration

### 5.1 Current auth

- **Login:** username (text) + numeric PIN (default `0000` for all seed users)
- **Session:** JSON object stored in AsyncStorage under `@ceh:session` (`TenantSession`)
- **No tokens / no server-side auth** — purely client-side identity
- **Switch user:** via User Management admin screen (calls `setCurrentUserId`)

### 5.2 Target auth (Supabase Auth)

- **Login method:** Email + password (or magic link). Supabase handles token issuance, refresh, and revocation.
- **PIN removal:** PINs are not migrated. On first production deploy, trigger password-reset emails.
- **Session:** Supabase client holds the JWT. `TenantSession`-equivalent data (`role`, `tenantId`, `municipalityName`, etc.) is fetched from the `users` table after sign-in and stored in a React context (server component friendly: use cookies via `@supabase/ssr`).
- **"View as tenant" (PSA):** Remain a runtime UI state (React context / URL param `?viewAs=riverside-ca`); no separate Supabase user needed.
- **"Switch user" (admin):** Remove in production. Each user authenticates as themselves. For demo/testing, keep an impersonation flag in a server action gated by PSA role.

### 5.3 TenantSession shape in Next.js

```ts
// lib/shared-types/src/session.ts
export interface AppSession {
  supabaseUserId: string;   // auth.users.id
  appUserId: string;        // users.id (our table)
  displayName: string;
  role: SystemRole;
  tenantId: string;
  municipalityName: string;
  departmentName: string;
  enabledModules: string[];
  viewAsTenantId?: string;  // PSA support-view override
}
```

---

## 6. Role & Permission System

### 6.1 Current model (unchanged in target)

| Fixed role | Notes |
|---|---|
| Platform Super Admin | Sees all tenants; manages tenants; all permissions |
| Municipal Admin | Full access within own tenant; can manage users |
| Code Enforcement Officer | Default officer; `caseManagement/edit`, `violations/edit` |
| Authorized Pilot | `aerialEvidence/edit` permission |
| Supervisor / Reviewer | `caseManagement/admin`, `violations/admin` |
| Read-Only Staff | All categories at `view` level |

Permission categories: `caseManagement`, `violations`, `notices`, `ordinanceLibrary`, `aerialEvidence`, `userAdminManagement`  
Permission levels: `none` < `view` < `edit` < `admin`

`permissionOverrides` on a user record can only **raise** the level above the fixed-role default; they can never lower it.

### 6.2 Migration notes

- **Seed `role_definitions` table** with the 6 default role definitions on first deploy.
- **`hasPermission()` utility** moves from `UserManagementContext` into a shared `lib/permissions` package usable on both server (middleware, Server Actions) and client.
- **Server-side enforcement:** All API routes / Server Actions check permissions via the `hasPermission` utility using the session pulled from the Supabase JWT claims or the `users` table — not just the React context.
- **RLS in Supabase** provides a second layer of enforcement (see §3.4).

---

## 7. State Management → API Layer

### 7.1 Context → Server Actions / React Query mapping

| Context method | Next.js equivalent |
|---|---|
| `addCase()` | `POST /api/cases` Server Action |
| `updateCase()` | `PATCH /api/cases/[id]` Server Action |
| `updateCaseStatus()` | `PATCH /api/cases/[id]/status` Server Action (appends `case_status_history` row) |
| `addViolation()` | `POST /api/cases/[id]/violations` |
| `updateViolation()` | `PATCH /api/cases/[id]/violations/[vid]` |
| `deleteViolation()` | `DELETE /api/cases/[id]/violations/[vid]` |
| `addNote()` | `POST /api/cases/[id]/notes` |
| `deleteNote()` | `DELETE /api/cases/[id]/notes/[nid]` |
| `addAttachment()` | `POST /api/cases/[id]/attachments` (upload to Supabase Storage first, then record row) |
| `deleteAttachment()` | `DELETE /api/cases/[id]/attachments/[aid]` (also deletes Storage object) |
| `addNotice()` / `markNoticeSent()` | `POST` / `PATCH /api/cases/[id]/notices` |
| `addProperty()` / `updateProperty()` | `POST` / `PATCH /api/properties` |
| `addResponsibleParty()` / `updateResponsibleParty()` | `POST` / `PATCH /api/responsible-parties` |
| `getDashboardStats()` | Derived server-side in dashboard Server Component (single SQL query) |
| `UserManagementContext` CRUD | `/api/admin/users`, `/api/admin/roles`, `/api/admin/audit-log` |
| `SettingsContext` | `/api/settings` (reads/writes `municipality_settings` for current tenant) |

### 7.2 Case number generation

Current: `CE-YYYY-####` generated client-side by counting existing year-cases in AsyncStorage.

Target: Generate server-side in a transaction:
```sql
SELECT COALESCE(MAX(CAST(SPLIT_PART(case_number, '-', 3) AS int)), 0) + 1
FROM cases
WHERE municipality_id = $1 AND case_number LIKE $2
FOR UPDATE;
```

### 7.3 Tenant filtering

Current: Client-side filter on the `cases` array by `municipalityId`.  
Target: All queries include `WHERE municipality_id = :tenantId` (or all for PSA). RLS enforces this at the DB layer as well.

---

## 8. File & Image Storage

### 8.1 Current approach (limitation)

Photos and documents are stored as **base64 data URIs** directly in the `attachments` array inside the `EnforcementCase` AsyncStorage blob. This causes:
- Very large AsyncStorage payloads (images can be hundreds of KB each as base64)
- No URL-based sharing or PDF embedding
- No thumbnails / progressive loading

### 8.2 Target approach (Supabase Storage)

- **Bucket:** `evidence` (private, per-tenant path prefix: `{tenantId}/{caseId}/{filename}`)
- **Upload flow:**
  1. Client requests a signed upload URL via Server Action.
  2. Client uploads directly to Supabase Storage.
  3. Client calls `POST /api/cases/[id]/attachments` with the resulting `storage_path`.
- **Download flow:** Generate a short-lived signed URL server-side when rendering evidence tab or notice previews.
- **Existing base64 data in AsyncStorage:** Write a one-time migration script that reads all attachments, decodes base64, uploads to Supabase Storage, and updates the `storage_path` field.

---

## 9. Notice Generator

### 9.1 Current approach

`app/notices/generate.tsx` builds a plain-text letter string in memory using template literals. The string is saved as `notice.content` (a plain-text field in AsyncStorage). The preview screen renders it in a monospace `<Text>` block.

Key template data sources:
- `AppSettings` (inspector profile, city info, per-stage opening/closing paragraphs, deadline days)
- Selected `CaseViolation` records (section number, title, description, deadline)
- Current date

### 9.2 Target approach

- **Keep plain-text generation** as a shared utility in `lib/notice-templates`. Input/output types move to `lib/shared-types`.
- **Add PDF export:** Use `@react-pdf/renderer` (React-based, works in Next.js) or Puppeteer (server-side) to render a styled PDF. Store the PDF in Supabase Storage alongside the text content.
- `notice.pdf_storage_path` column (add to `notices` table as nullable).
- **Notice preview:** Render as a styled HTML page (`app/(app)/cases/[id]/notices/[nid]/preview`) with a "Download PDF" button.

---

## 10. Design Tokens & Component System

### 10.1 Current tokens (`constants/colors.ts`)

```
primary:   #1a3a5c  (navy blue)
accent:    #c9a227  (gold)
background:#f4f6f9
card:      #ffffff
border:    #d1d9e2
muted:     #e8edf3  / mutedForeground: #6b7a8d
success:   #1e7e34
warning:   #e67e22
destructive:#c0392b
radius:    8px
```

Status colors: Open → navy, Pending → orange, Notice Sent → purple, Reinspection → red, Closed → green

### 10.2 Target (Tailwind CSS variables)

Map directly to Tailwind CSS custom properties in `globals.css`:

```css
:root {
  --primary: 210 54% 23%;          /* #1a3a5c */
  --accent: 42 68% 48%;            /* #c9a227 */
  --background: 216 25% 96%;       /* #f4f6f9 */
  --card: 0 0% 100%;
  --border: 213 24% 86%;           /* #d1d9e2 */
  --muted: 213 24% 93%;            /* #e8edf3 */
  --muted-foreground: 212 14% 49%; /* #6b7a8d */
  --radius: 0.5rem;
}
```

shadcn/ui components provide the base component library; override the default color variables with the municipal navy/gold palette.

---

## 11. Known Limitations in Current App

These are pain points the migration should resolve.

| # | Limitation | Current workaround | Target solution |
|---|---|---|---|
| 1 | Images stored as base64 strings in AsyncStorage | None — can cause storage quota issues | Supabase Storage bucket with signed URLs |
| 2 | No real authentication (PIN only, client-side) | PIN `0000` bypass in code | Supabase Auth (email + password / magic link) |
| 3 | No multi-device sync — data lives in device AsyncStorage | None | Supabase Postgres shared across all sessions |
| 4 | Notice content is plain text only, no PDF | Users copy-paste from preview | `@react-pdf/renderer` export, stored in Supabase Storage |
| 5 | Case number generated client-side with race condition risk | Acceptable for single-device demo | Server-side `SELECT ... FOR UPDATE` in a transaction |
| 6 | Ordinances are static seed data — no admin UI | Hardcoded in `data/mockData.ts` | DB table with future admin CRUD |
| 7 | `User` interface in `types/models.ts` is an unused legacy stub | Unused but not removed | Remove entirely; `PlatformUser` is the canonical type |
| 8 | Settings are per-device, not per-municipality | Each device has independent settings | `municipality_settings` table, synced per tenant |
| 9 | Audit log is AsyncStorage-only, survives only on the originating device | None | `audit_log` table, visible to all admins in the tenant |
| 10 | `DATA_VERSION` cache-busting erases all local data on model changes | Acceptable for demo; dangerous in prod | Schema migrations via Drizzle; no destructive wipes |

---

## 12. Migration Phases

### Phase 0 — Foundation (pre-migration prep)

- [ ] Create `lib/shared-types` package with all interfaces from `types/models.ts` (remove legacy `User` stub)
- [ ] Create `lib/permissions` package with `hasPermission()` and role/level enums
- [ ] Create `lib/notice-templates` package with the notice generation logic extracted from `notices/generate.tsx`
- [ ] Set up Supabase project and configure environment secrets in Replit

### Phase 1 — Database & Auth

- [ ] Write Drizzle schema files for all tables (§3.2)
- [ ] Run `drizzle-kit push` to initialize schema
- [ ] Seed `tenants`, `role_definitions`, and initial `users` from `defaultUsers.ts`
- [ ] Seed `ordinances` from `mockData.ts`
- [ ] Configure Supabase Auth (email+password, disable sign-up — invite only for municipal deployments)
- [ ] Implement RLS policies (§3.4)
- [ ] Write the `lib/permissions` `hasPermission()` function and validate against existing test cases

### Phase 2 — Next.js App Shell

- [ ] Scaffold `artifacts/web-app` with Next.js 14 (App Router)
- [ ] Implement `(auth)/login` page using Supabase Auth client
- [ ] Implement middleware (`middleware.ts`) to protect `(app)/*` routes
- [ ] Implement `AppSession` context (server + client boundary)
- [ ] Implement main navigation layout (sidebar or top nav matching current tab bar)
- [ ] Apply design tokens (§10.2) via Tailwind

### Phase 3 — Core Case Management

- [ ] Dashboard page with server-rendered stats
- [ ] Cases list with filter/search (React Query or server-fetched with URL params)
- [ ] Case detail page with 8-tab layout: Info, Property, Party, Violations, Photos, Notes, Notices, History
- [ ] New case form
- [ ] Close/Reopen case action

### Phase 4 — Child Record CRUD

- [ ] Add/Edit/Delete violations (with ordinance picker)
- [ ] Add/Delete notes
- [ ] Add/Delete attachments (Supabase Storage upload flow, §8.2)
- [ ] Notice generator + preview + PDF export (§9.2)
- [ ] Mark notice sent

### Phase 5 — Admin Screens

- [ ] User management (create, edit, deactivate, role assignment)
- [ ] Role management (edit permission levels)
- [ ] Audit log viewer
- [ ] Tenant management (PSA-only: list municipalities, view-as toggle)

### Phase 6 — Reports & Settings

- [ ] Reports page (case stats, bar charts, notice due table)
- [ ] Settings page (municipality settings editor, per-tenant)
- [ ] Ordinance library (search + detail)

### Phase 7 — Data Migration (AsyncStorage → Supabase)

- [ ] Write a one-time migration CLI script (`scripts/src/migrate-local-data.ts`):
  1. Accept a JSON export of the device's AsyncStorage blobs as input
  2. Decode base64 attachment URIs, upload to Supabase Storage
  3. Insert all cases, properties, parties, violations, notes, notices, status history
  4. Map old string IDs to new UUIDs
- [ ] Run migration for each municipality/device
- [ ] Validate record counts and spot-check case data

---

## 13. Decision Log

| Decision | Rationale |
|---|---|
| Keep `lib/shared-types` as a separate package | Both the Expo app (if kept in parallel) and the Next.js app share type definitions without duplication |
| Use Drizzle ORM (already in monorepo) | Already configured with `lib/db`; consistent with existing API server patterns |
| Store evidence snapshots as `jsonb` | Preserves the immutable audit-trail snapshot semantics of the current app — the name/role at time of capture must not change if the user's record is later edited |
| `linked_violation_ids` as `uuid[]` array | Current usage is append/remove on a small list; a join table adds a migration step with no material query benefit at expected data volumes |
| Plain-text notice content retained alongside PDF | Existing data has text-only content; the PDF path is additive (nullable column), avoiding a breaking schema change |
| Remove PIN auth entirely | PINs are client-side only and provide no real security; Supabase Auth provides proper token-based auth with revocation and password reset |
| `viewAsTenantId` stays in runtime state (not DB) | It is a transient UI/support operation, not a persistent privilege; storing it in the DB would create confusing audit footprints |
| Ordinances move to DB table | Municipality-specific ordinance customisation is a near-term feature request; a static seed array makes that impossible |
| Invitation-only Supabase Auth | Code enforcement is a closed, credentialed workflow; self-signup is inappropriate |
