TradeFlow — Build Specification

Purpose of this document: This is a complete implementation spec meant to be handed directly to an AI coding tool (Claude Code, Cursor, etc.) as project context. It defines scope, architecture, data models, API contracts, and build order so the tool can execute without re-deriving decisions. Feed this whole file in as context, then work phase by phase — don't ask the tool to build everything in one shot.

1. Project Summary
TradeFlow is a trading & workflow management platform for financial orders. A trader places an order, it passes through risk validation, gets executed (simulated matching engine), generates double-entry ledger records, updates portfolio holdings, and notifies the user — all state changes are recorded in an immutable audit log.

MVP scope (build this first):
- 3 roles: TRADER, RISK_ANALYST, ADMIN
- Hardcoded order pipeline: CREATED → RISK_CHECK → EXECUTION → LEDGER → NOTIFICATION
- Simulated execution (no real matching engine, no external market data)
- Postgres + Redis only — no Kafka in MVP

Explicitly deferred to Phase 2+ (do not build in MVP):
- Configurable workflow builder (admin-defined pipelines)
- Kafka event bus
- Compliance Officer / Auditor / Portfolio Manager as separate roles
- Real order matching engine
- Multi-currency, multi-tenant, AI insights

2. Tech Stack (exact choices — do not substitute without asking)
Backend
- Node.js 20 LTS
- NestJS 10 (TypeScript)
- Prisma ORM
- PostgreSQL 16
- Redis 7 (via ioredis)
- JWT auth (@nestjs/jwt) + Argon2 for password hashing (argon2 npm package, not bcrypt)
- class-validator / class-transformer for DTO validation
- Socket.IO via @nestjs/websockets for live push
- Swagger via @nestjs/swagger
- Jest for testing

Frontend
- React 18 + Vite + TypeScript
- Tailwind CSS
- TanStack Query (server state)
- Zustand (client/UI state — auth token, theme, etc.)
- React Router v6
- Recharts (charts)
- Axios (API client) with an interceptor for JWT refresh
- socket.io-client

Infra
- Docker Compose for local Postgres + Redis
- GitHub Actions: lint + test on PR
- .env based config via @nestjs/config

3. Monorepo Structure
tradeflow/
├── apps/
│   ├── api/
│   │   ├── src/
│   │   │   ├── auth/
│   │   │   ├── users/
│   │   │   ├── markets/
│   │   │   ├── orders/
│   │   │   ├── risk/
│   │   │   ├── execution/
│   │   │   ├── ledger/
│   │   │   ├── portfolio/
│   │   │   ├── notifications/
│   │   │   ├── audit/
│   │   │   ├── admin/
│   │   │   ├── websocket/
│   │   │   ├── common/          # guards, decorators, filters, pipes
│   │   │   ├── prisma/          # PrismaService + schema.prisma
│   │   │   ├── app.module.ts
│   │   │   └── main.ts
│   │   └── test/
│   └── web/
│       ├── src/
│       │   ├── pages/
│       │   │   ├── trader/      # Dashboard, Markets, Orders, Portfolio
│       │   │   └── admin/       # Users, RiskRules, AuditLogs
│       │   ├── features/        # feature-sliced: orders/, portfolio/, auth/, markets/
│       │   ├── components/ui/   # shared primitives (Button, Table, Modal…)
│       │   ├── hooks/
│       │   ├── store/
│       │   ├── api/             # one file per module, TanStack Query hooks
│       │   ├── lib/
│       │   └── main.tsx
├── packages/
│   └── shared-types/            # DTOs shared between api & web (enums, interfaces)
├── docker-compose.yml
├── .github/workflows/ci.yml
└── docs/

Each NestJS module (orders, risk, etc.) follows: *.module.ts, *.controller.ts, *.service.ts, dto/, entities/ (if not using Prisma types directly).

4. Database Schema (Prisma)
See apps/api/prisma/schema.prisma

Rule: AuditLog and LedgerEntry rows are never updated or deleted — enforce this at the service layer (no update/delete methods exposed for these two models, anywhere).

5. Core Business Logic Specs
5.1 Order Lifecycle (hardcoded pipeline for MVP)
1. POST /orders → status = PENDING
2. Risk module validates synchronously:
   - if any active RiskRule is violated → status = RISK_REJECTED, write rejectionReason, notify user, STOP
   - else → status = RISK_APPROVED
3. Deduct/reserve funds (BUY) or shares (SELL) — reject if insufficient
4. status = OPEN
5. Execution worker (see 5.2) picks up OPEN orders on an interval
6. On fill: status = EXECUTED, write LedgerEntry rows, update Holding, push notification + websocket event

Every status transition must write an AuditLog row.

5.2 Simulated Execution Engine
- A NestJS scheduled task (@nestjs/schedule, @Cron or @Interval(2000)) scans OPEN orders.
- For MARKET orders: fill immediately at stock.currentPrice.
- For LIMIT orders: fill only if stock.currentPrice has crossed the limit price (BUY: price ≤ limit; SELL: price ≥ limit).
- Randomly decide partial vs full fill (weighted ~80% full, 20% partial) to make the demo realistic.
- STOP_LOSS orders: trigger into a MARKET order once currentPrice crosses the stop level.

5.3 Risk Rule Engine
Simple synchronous rule evaluation — no separate rules engine library needed:
async function checkRiskRules(order: OrderInput, user: User): Promise<RiskResult> { ... }

5.4 Double-Entry Ledger
On execution of a BUY order for qty×price = V:
DEBIT  SECURITIES   V
CREDIT CASH         V

On SELL:
DEBIT  CASH         V
CREDIT SECURITIES   V

Every trade produces exactly 2 LedgerEntry rows (or more if fees are modeled) whose debits and credits sum to zero across the pair. Add a service-level invariant check in tests: sum(debits) === sum(credits) per orderId.

5.5 Portfolio Recalculation
On fill, upsert Holding:
- New avg price = ((existingQty * existingAvgPrice) + (filledQty * fillPrice)) / (existingQty + filledQty) for BUY
- On SELL, reduce quantity; avg price unchanged; realize P&L = (fillPrice - avgBuyPrice) * filledQty

6. API Endpoints (MVP)
Auth
- POST /auth/register — trader self-signup (role forced to TRADER)
- POST /auth/login → { accessToken, refreshToken }
- POST /auth/refresh

Markets
- GET /markets — list stocks with live prices
- GET /markets/:symbol

Orders
- POST /orders
- GET /orders (filter by status, query params)
- GET /orders/:id
- PATCH /orders/:id/cancel
- PATCH /orders/:id — modify (only if still PENDING/OPEN)

Portfolio
- GET /portfolio/holdings
- GET /portfolio/summary — total value, cash, P&L

Notifications
- GET /notifications
- PATCH /notifications/:id/read

Admin (guarded by RolesGuard, role = ADMIN)
- GET /admin/users, POST /admin/users, PATCH /admin/users/:id/disable
- GET /admin/risk-rules, POST /admin/risk-rules, PATCH /admin/risk-rules/:id
- GET /admin/audit-logs (paginated, filterable by actor/entityType/date)
- GET /admin/stats — total users, today's trades, pending orders, failed orders

WebSocket events (Socket.IO namespace /live)
- order:status_changed → { orderId, status }
- price:update → { symbol, price }
- notification:new → { notification }

All endpoints except /auth/* require Authorization: Bearer <JWT>. Use a RolesGuard + @Roles(Role.ADMIN) decorator pattern for role restriction.

7. Auth & Security Requirements
- Argon2id for password hashing (not bcrypt)
- Access token: 15 min expiry. Refresh token: 7 days, stored hashed in DB, rotated on use.
- Rate limit /auth/login (@nestjs/throttler, e.g. 5 attempts / 5 min per IP)
- All DTOs validated via class-validator with a global ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })
- Passwords, tokens never logged
- helmet middleware enabled

8. Frontend Page Specs (MVP)
Trader
- Dashboard: portfolio value card, cash, today's P&L, open/executed order counts, market summary strip (mock indices), Recharts line chart for portfolio growth
- Markets: searchable/sortable table of stocks → click row → Stock Detail page (price, mock chart, Buy/Sell buttons)
- Buy/Sell modal: qty, price, order type (market/limit/stop-loss), validity, submit → optimistic UI update, toast on risk rejection
- Orders: tabs for Pending/Open/Executed/Cancelled/Rejected, cancel/modify actions
- Portfolio: holdings table (qty, avg price, current price, P&L), sector allocation pie chart
- Notifications: dropdown/list, mark-as-read

Admin
- Dashboard: stat cards (total users, today's trades, pending orders, revenue, failed orders)
- Users: table with create/disable/reset-password/assign-role actions
- Risk Rules: CRUD table for RiskRule
- Audit Logs: paginated, filterable, read-only table

Use TanStack Query for all server data (useQuery/useMutation), Zustand only for auth state + UI-local state (theme, modal open/closed). Wire the WebSocket client to invalidate relevant queries on order:status_changed and price:update.

9. Build Phases (give the AI tool one phase at a time)
Phase 1 — Foundation
1-2 Docker Compose (postgres, redis) + .env.example
3 Prisma schema (section 4) + initial migration + seed script (create 1 admin, 1 trader, 1 risk_analyst, ~10 stocks)
... (more phases deferred)

10. Coding Conventions (put this at the top of the AI tool's context every session)
- TypeScript strict mode on, no any unless justified with a comment
- NestJS: one module per domain, constructor-injected services, DTOs for every request body, no logic in controllers beyond calling the service
- Prisma: no raw SQL unless a query genuinely can't be expressed cleanly in Prisma; wrap multi-table writes in prisma.$transaction
- Never bypass the risk/ledger/audit invariants described in section 5 "to make a demo work" — if a test needs to fake data, seed it properly instead
- Every module ships with at least one Jest test covering its core business rule (risk rejection, ledger balance invariant, portfolio recalculation)
- Commit in small, phase-aligned chunks matching section 9
