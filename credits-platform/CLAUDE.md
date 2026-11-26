# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

`credits-platform` (in the `credits-platform-manager` repo) is the **admin/back-office front end** for Credits Brasil. It's a React 19 + Vite SPA where internal admins manage companies, company users (operators) and admins, and inspect credit-consultation orders and platform logs. The back end is a separate service reached through `VITE_API_URL`, and it's the same back end the client app (`../../credits-platform`) uses; see `../../CLAUDE.md`. UI text, error messages and route paths are in **Portuguese (pt-BR)**.

It lives inside a pnpm workspace scaffolded on Replit; the repo root is the parent directory. The sibling `lib/*` packages (`db`, `api-spec`, `api-zod`, `api-client-react`) and `scripts/` are template leftovers. The app does **not** use them, apart from a tsconfig reference and a devDependency on `@workspace/api-client-react`. The root `replit.md` describes an `api-server` package that does not exist here.

## Commands

pnpm is required: the root `preinstall` rejects npm and yarn. Many dependency versions resolve from the `catalog:` in `../pnpm-workspace.yaml`, which also enforces `minimumReleaseAge: 1440` (packages published less than a day ago won't install).

From this folder (or `pnpm --filter credits-platform <script>` from the repo root):

- `pnpm dev`: Vite dev server on `0.0.0.0:$PORT` (`PORT` comes from `.env`, default 5174, `strictPort`)
- `pnpm build`: production build into `dist/public`
- `pnpm serve`: preview the production build
- `pnpm typecheck`: `tsc --noEmit` (test files excluded)
- `pnpm test`: Vitest, run once. `pnpm test:watch` runs it in watch mode.
- Single test: `pnpm vitest run src/utils/formatCPF/formatCPF.test.ts` or `pnpm vitest run -t "formats numeric CPF"`

There is no lint script or ESLint config. Prettier is installed at the workspace root, but running it reformats whole files (CRLF noise on Windows), so don't run `--write` on files you didn't change.

Env (`.env`): `PORT` and `VITE_API_URL`. `BASE_PATH` is optional and sets the Vite `base` and the wouter router base. Deployment target is Vercel (`vercel.json` rewrites everything to `index.html`).

## Architecture

- **Routing and auth gate (`src/App.tsx`):** uses `wouter`. Auth state is a boolean in `localStorage` (`credits-platform-authenticated`). Unauthenticated users only get the Login page at `/`. Authenticated routes render inside `Layout` (Sidebar + Header):
  - `/home`
  - `/configuracoes/{empresas,users,admins}`
  - `/operacoes/{list,logs}`

  To add a page, register its route here **and** add a menu entry to `menuItems` in `src/components/layout/Sidebar.tsx`.
- **Session storage:** login (`src/lib/auth.ts` → `POST /api/auth/admin/login`, refresh at `/api/auth/admin/refresh`) stores the access token, refresh token and admin JSON under the `credits-platform-*` keys in `localStorage`. These key strings are duplicated as constants across `App.tsx`, `Header.tsx` and several pages, so keep them in sync.
- **API layer (`src/lib/*.ts`):** one module per resource (`company`, `user`, `admin`, `operator`). Each defines its entity types, its own `API_URL`, and a local `handleResponse` that throws `Error(data.message)` with a pt-BR fallback. Calls use plain `fetch`.
  - **Most of these calls send no Authorization header.** Only `Orders.tsx` sends a Bearer token, with its own inline 401 → `refreshAdminSession` → retry.
  - `Logs.tsx` and the first-access/password-reset steps in `Login.tsx` call the API directly, outside `src/lib`.
  - `src/lib/cnpj.ts` is the exception: a React Query hook that calls the public `open.cnpja.com` API with axios.
- **Pages (`src/pages/*.tsx`):** large self-contained files holding the table, filters and create/edit dialogs. They use TanStack Query (`useQuery`/`useMutation` + `invalidateQueries`) against the `src/lib` functions. `Logs.tsx` fetches in a `useEffect` instead.
- **Orders (`src/pages/Orders.tsx`, "Consultas", `/operacoes/list`):** pages through `/api/orders` (20 per page) with search, status (`PROCESS`/`SUCCESS`/`FAILED` → Processando/Sucesso/Falhou) and company filters.
  - **Columns:** they come from a single `ORDER_COLUMNS` list shared by the screen header and the export. The cells are still written by hand, so a column change has to be made in both places. Current headers: "CNPJ" (company document), "Razão Social" (company name), "Documento consultado". Duração, IP and Host were removed from both the screen and the export.
  - **Row actions:** "Ver inputs" (insumos consulted) and "Ver SPC" (the stored SPC snapshot) both use `variant="outline"`.
- **XLSX export (`src/lib/ordersExport.ts`):** the "Exportar XLS" button (`bg-emerald-600`) loads `exceljs` lazily and exports **all** orders matching the current filters, paging the API 100 at a time.
  - **Layout (decided with the user):** a flat table built for Excel formulas. Each order gets one `Tipo = Produto` row, then **one duplicated row per insumo** with `Tipo = Insumo` and `Código Insumo` / `Insumo` filled in.
  - **Formatting:** no title row, header in row 1, autofilter, frozen header.
- **UI:** shadcn/ui ("new-york", `components.json`) in `src/components/ui`. App components are in `src/components` (barrel `index.ts`). Path alias `@/` → `src/`.
- **Styling and theming:** Tailwind v4 configured in CSS only. `src/index.css` maps HSL variables to Tailwind colors via `@theme inline`.
  - **Light theme only.** Dark mode was rolled back. A `dark` variant is declared but there is no `.dark` block, and the `.manager-app` wrapper in `App.tsx` no longer has any effect.
  - **Colors:** primary is `rgb(15, 29, 50)` (`216 54% 12.7%`). `--sidebar` points at `var(--primary)`, and `Sidebar.tsx`, `Header.tsx` and `Login.tsx` use the theme tokens. The orange accent (`#ED884A`, active menu item and buttons) is still hardcoded. Prefer tokens over hex.
- **Utils (`src/utils/<name>/index.ts`):** Brazilian-format helpers (CPF/CNPJ/CEP/phone/currency/date formatting and validation). Each has a colocated `<name>.test.ts` and is re-exported from `src/utils/index.ts`. Vitest only picks up `src/**/*.test.ts`.
