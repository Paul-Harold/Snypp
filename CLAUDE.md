# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # Start dev server (localhost:3000)
npm run build    # Production build
npm run lint     # ESLint check
```

No test suite exists.

## Environment

`.env.local` requires:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## Architecture

**Snypp** is a real-time collaborative workspace app. Stack: Next.js 16 App Router, React 19, Supabase (auth + PostgreSQL + realtime), Tailwind CSS v4, TypeScript strict mode.

There are **no API routes** — all data access is direct Supabase client calls from client components.

### Routing

```
app/
  page.tsx                      # Landing page
  login/page.tsx                # Auth (email/password + Google OAuth)
  dashboard/
    layout.tsx                  # Wraps all dashboard pages with <Navbar>
    page.tsx                    # Board list → <BoardDashboard>
    [boardId]/page.tsx          # Individual board → <BoardView>
    settings/page.tsx           # Account settings → <SettingsView>
```

### Board Types

A board has `board_type: 'kanban' | 'snippets'`. `BoardView` branches on this to render either `BoardCanvas` (kanban with @hello-pangea/dnd drag-drop) or `SnippetCanvas` (sticky-note grid). Both receive a `canEdit` flag derived from the user's RBAC role.

### RBAC

Roles are stored in the `board_members` table: `owner | member | viewer`. `BoardView` resolves `canEdit` and passes it down. Owners can invite/remove members; viewers are read-only.

### Real-time Sync

Every data-heavy component opens a Supabase channel with `postgres_changes` to refetch on any mutation. There is also a 5-second polling fallback. Channels are named like `board-room-${boardId}`, `snippets-${boardId}`, `nav-notifications-${userId}`. Always clean up channels in the `useEffect` return.

### Key Shared Components

- `FocusLockedInput` — inline edit that keeps a local draft while focused and only calls `onSave` on blur/Enter. Used for all in-place text editing. Supports auto-resizing textarea via an internal ref.
- `Navbar` — reads the session and notification count; lives in `dashboard/layout.tsx`.
- `proxy.ts` (root) — Next.js middleware that refreshes Supabase auth tokens on every request via `createServerClient`.

### Supabase Client

`lib/supabaseClient.ts` exports a single `supabase` browser client via `createBrowserClient` from `@supabase/ssr`. Import this everywhere — do not create new clients.

### Tailwind v4

Uses the PostCSS plugin (`@tailwindcss/postcss`), not the classic `tailwind.config.js` approach. Theme tokens live in `app/globals.css`. All utility classes must be written in full (no dynamic string construction) so the JIT scanner picks them up.
