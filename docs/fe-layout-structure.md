# Frontend Layout Structure

Design notes for MarineOps shell, pages, and responsiveness. Structure and behavior only — no color system.

---

## 1. Overall frame

The authenticated UI is a fixed **viewport shell**, not a long scrolling document.

```text
┌─────────────────────────────────────────────────────────────┐
│  App canvas (full viewport height)                          │
│                                                             │
│  ┌──────────┐   ┌───────────────────────────────────────┐  │
│  │ Sidebar  │   │ Main island                           │  │
│  │ island   │   │  ┌─────────────────────────────────┐  │  │
│  │          │   │  │ Mobile top bar (md:hidden)      │  │  │
│  │          │   │  ├─────────────────────────────────┤  │  │
│  │          │   │  │ Scrollable page content         │  │  │
│  │          │   │  │                                 │  │  │
│  └──────────┘   │  └─────────────────────────────────┘  │  │
│                 └───────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

| Piece | Role |
|-------|------|
| **App canvas** | Outer flex row; fills `100dvh`; clips overflow |
| **Sidebar island** | Persistent nav + workspace controls (desktop) |
| **Main island** | Active route content |
| **Outer padding** | Gutter around islands (`p-3` → `sm:p-4`) |
| **Gap between islands** | None on small screens; `md:mr-4` from `md` up |

Both islands share the same height token:

```text
ISLAND_HEIGHT = calc(100vh - 1.5rem)   /* p-3 */
             → calc(100vh - 2rem)      /* sm:p-4 */
```

so sidebar and main align inside the canvas padding.

Implementation: `widgets/app-shell/AppShell.tsx`.

---

## 2. Sidebar

### 2.1 Modes

| Mode | When | Behavior |
|------|------|----------|
| **Desktop** | `md` and up | Always visible beside main |
| **Drawer** | below `md` | Slide-in overlay; closed by default |

Same component (`AppSidebar`) in both modes; layout differs by `mode` prop.

### 2.2 Desktop sidebar anatomy (top → bottom)

```text
┌─────────────────────────┐
│ [Mark] HubSpot Order Sync│  brand icon + wordmark
│                           │  (icon only when collapsed)
│ MAIN MENU                 │
│   Contacts                │
│   Order syncs             │
│         …scroll…          │
├─────────────────────────┤
│ Theme (icon) │ Collapse │  minimal footer (desktop only)
└─────────────────────────┘
```

### 2.3 Collapse (desktop only)

| State | Width | Labels |
|-------|-------|--------|
| Expanded | `16rem` (`w-64`) | Visible |
| Collapsed | `4rem` (`w-16`) | Hidden; icon-only nav |

- Preference stored in `localStorage` (`sidebar_collapsed`).
- Collapse control lives in the sidebar footer.
- Drawer mode is always expanded (full labels); no collapse control.

### 2.4 Navigation rules

- Section: **MAIN MENU** (Contacts, Order syncs).
- Active route: pathname match (exact or prefix).
- Nav scrolls independently if the sidebar is short on height.

### 2.5 Mobile drawer

- Opened from the main island **hamburger**.
- Full-height panel from the left; max width ~`18rem` or `100vw − 1rem`.
- Dimmed backdrop; click backdrop or **X** to close.
- Closes on route change.
- Body scroll locked while open.

---

## 3. Main page (main island)

### 3.1 Structure

```text
┌────────────────────────────────────────┐
│ Mobile top bar          (md:hidden)    │
│  [Menu] [Page icon] Title    [Theme]   │
├────────────────────────────────────────┤
│ Content region                         │
│  - flex-1                              │
│  - overflow-y: auto                    │
│  - overflow-x: hidden                  │
│  - padding: p-5 → sm:p-6 → md:p-8      │
│                                        │
│  { children = FSD page }               │
└────────────────────────────────────────┘
```

- Main island is a column flex container with clipped outer overflow.
- Only the **content region** scrolls; chrome (mobile bar / sidebar) stays fixed.
- Desktop page titles live **inside** each page (hidden below `md` to avoid duplicating the mobile top bar title).

### 3.2 Routes mapped into main

| Route | Page composition |
|-------|------------------|
| `/` | Redirect → `/contacts` |
| `/contacts` | Contacts list + Add contact modal |
| `/contacts/[id]/edit` | Edit contact form |
| `/syncs` | Order sync status summary + table |

Thin Next.js files under `app/*/page.tsx` compose FSD views from `views/`.

### 3.3 Typical page header pattern

On `md+`:

```text
[Icon]  Title
        Short subtitle
                    [page-local controls →]
```

Below `md`: title is already in the mobile top bar, so the large page header is usually hidden; page-local controls (e.g. Kanban/List toggle, admin tabs) remain in content.

---

## 4. Responsiveness

Breakpoint reference (Tailwind defaults used in shell):

| Token | Min width | Shell behavior |
|-------|-----------|----------------|
| default | `< 768px` | Drawer sidebar; mobile top bar; tighter padding |
| `sm` | `640px` | Slightly larger canvas / content padding |
| `md` | `768px` | Persistent desktop sidebar; hide mobile top bar; show desktop page headers |
| `lg`+ | `1024px+` | Same shell; page widgets may add denser grids |

### 4.1 Shell matrix

| Concern | Mobile (`< md`) | Desktop (`≥ md`) |
|---------|-----------------|------------------|
| Sidebar | Overlay drawer | Persistent island |
| Sidebar collapse | N/A (always labeled) | Expand / collapse |
| Top chrome | Menu + title + theme | None in main (theme in sidebar footer) |
| Canvas gap | Tight / zero between islands | Gap between sidebar and main |
| Content padding | `1.25rem` → `1.5rem` | `2rem` |
| Body scroll | Locked when drawer open | Normal (island scrolls) |

### 4.2 Content-level responsiveness (pages / widgets)

Principles already used in the product:

- **Contacts / Syncs**: tables use horizontal containment (`min-w-0` / full width); status summary stacks 2×2 then 4 columns from `lg`.
- Prefer `min-w-0` on flex children so nested tables do not force page-level horizontal scroll.
- Modals: constrained height (`max-height` ~ viewport); body scrolls inside dialog when needed.
- Status cards stay quiet (surface + light border + accent cue), not full tinted fills.

### 4.3 Interaction affordances

| Affordance | Notes |
|------------|--------|
| Theme toggle | Sidebar footer (desktop); mobile top bar (mobile) |
| Sidebar collapse | Desktop footer chevron; preference in `localStorage` |

---

## 5. Layout hierarchy (code map)

```text
app/layout.tsx
  └── ThemeProvider
        └── AppShell
              ├── AppSidebar (desktop | drawer)
              │     ├── Brand mark + wordmark
              │     ├── Nav links (Contacts, Order syncs)
              │     └── Footer (theme + collapse, desktop)
              └── <main> island
                    ├── Mobile top bar
                    └── Scroll region → page children
                          ├── ContactsView
                          └── SyncDashboardView
```

---

## 6. Structural rules (keep consistent)

1. **One scrolling surface** — page content inside the main island; not the whole window.
2. **Two islands on desktop** — sidebar and main stay visually separate cards of equal height.
3. **Single nav source** — primary destinations live in the sidebar.
4. **Mobile-first chrome swap** — below `md`, move title/theme into the top bar and use a drawer instead of a persistent rail.
5. **No full-bleed page backgrounds** — routes render inside the main island; they do not replace the shell.

---

## 7. Out of scope for this doc

- Color tokens / light–dark palette  
- Typography scale details beyond layout hierarchy  
- Component-level visual styling (buttons, badges, charts)  
- Backend / Supabase / FSD folder architecture  

Those belong in separate design or architecture docs.
