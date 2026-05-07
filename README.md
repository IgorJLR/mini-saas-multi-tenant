# Mini SaaS Platform — Fullstack Challenge

A multi-tenant SaaS platform where companies manage their product catalogs and an AI agent answers customer questions by querying real database data.

## Stack

| Layer | Tech |
|---|---|
| Backend | Node.js, Express, TypeScript, MongoDB (Mongoose) |
| Frontend | React, TypeScript, Vite, Tailwind CSS |
| Auth | JWT (jsonwebtoken + bcryptjs) |
| AI | Google Gemini (`@google/genai`) with tool calling |
| Database | MongoDB Atlas |

---

## Setup — under 5 minutes

### Prerequisites
- Node.js v18+
- A [MongoDB Atlas](https://cloud.mongodb.com) free cluster
- A [Google AI Studio](https://aistudio.google.com/apikey) API key (free)

### 1. Clone and install

```bash
git clone <repo-url>
cd <repo>

cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure environment

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:

```env
PORT=3001
MONGODB_URI=mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/saas_platform?retryWrites=true&w=majority
JWT_SECRET=any_long_random_string
GEMINI_API_KEY=your_gemini_api_key
```

### 3. Seed the database

```bash
cd backend
npm run seed
```

This creates 2 companies, 4 users, and 24 products ready to use.

### 4. Run

Open two terminals:

```bash
# Terminal 1 — backend
cd backend && npm run dev

# Terminal 2 — frontend
cd frontend && npm run dev
```

Open **http://localhost:5173**

### Test accounts

| Email | Password | Role | Company |
|---|---|---|---|
| admin@techmart.com | password123 | admin | TechMart |
| user@techmart.com | password123 | user | TechMart |
| admin@fashionhub.com | password123 | admin | FashionHub |
| user@fashionhub.com | password123 | user | FashionHub |

---

## API Endpoints

```
POST   /api/auth/register        — create account (requires companySlug)
POST   /api/auth/login           — returns JWT

GET    /api/products             — list company products (auth required)
GET    /api/products/:id         — single product
POST   /api/products             — create product (admin only)
PUT    /api/products/:id         — update product (admin only)
DELETE /api/products/:id         — delete product (admin only)

POST   /api/chat                 — AI chat with tool calling (auth required)
GET    /health                   — health check
```

---

## Architectural Decisions

### Multi-tenancy via JWT — not request params

Every authenticated request carries `companyId` inside the JWT payload. The product routes and the AI service always receive `companyId` from `req.user` (decoded token), never from the request body or query string. This means a user from Company A physically cannot request Company B's data — even if they craft a malicious request — because the filter is injected server-side before any query reaches MongoDB.

```typescript
// chat.routes.ts — companyId comes from the verified token
const reply = await runChatAgent(req.user!.companyId, message);

// ai.service.ts — always the first condition in every query
const filter = { companyId, ...otherFilters };
```

### AI agent with real tool calling — not a wrapper

The AI does not receive product data in its system prompt (that would be expensive and stale). Instead, Gemini is given a `search_products` tool definition and decides autonomously when and how to call it based on what the user asked. The backend executes the real MongoDB query and returns live data. This is the correct agentic pattern — the model reasons about which tool arguments to use, we just execute and return results.

### Role-based permissions as middleware

Admin-only routes (`POST`, `PUT`, `DELETE` on products) use a `requireAdmin` middleware that checks `req.user.role`. It is composed on top of `authenticate`, so the enforcement chain is: parse token → verify role → execute handler. Roles are set at registration and stored in the JWT — no extra DB call per request.

### TypeScript end-to-end

Both backend and frontend are fully typed with zero `tsc` errors. On the backend this catches schema mismatches at compile time; on the frontend it ensures the API response shapes match what the components consume.

### Vite proxy

The frontend proxies `/api` → `http://localhost:3001` via Vite's dev server config. This avoids CORS entirely in development and mirrors the pattern used in production (reverse proxy in front of the API).

---

## What I Would Do Differently in Production

### Security
- Rotate JWT secrets automatically; use short-lived access tokens (15 min) + refresh tokens stored in httpOnly cookies
- Add rate limiting per user (`express-rate-limit`) on auth and chat endpoints
- Validate and sanitize all inputs with `zod` schemas at the route layer
- Move file uploads to a CDN (S3 + CloudFront) instead of serving from the app server
- Enable MongoDB field-level encryption for sensitive data

### Scalability
- Extract the AI chat into a dedicated microservice — it has different scaling needs (slow, CPU-light, but long-held connections) vs the CRUD API
- Use a message queue (BullMQ / SQS) for chat requests to handle bursts and retries without blocking the HTTP process
- Add database indexes reviewed by `explain()` on the most common query patterns
- Cache product listings in Redis with a short TTL — most users read more than they write

### Observability
- Structured JSON logging (Pino) with correlation IDs per request
- Distributed tracing (OpenTelemetry) to track how long each step of the AI tool-calling loop takes
- Alerts on p95 latency of the `/chat` endpoint and on Gemini quota usage

### Multi-tenancy at scale
- Shard MongoDB by `companyId` so tenant data is physically co-located
- Consider per-tenant database isolation for enterprise clients (stronger compliance boundary)
- Add a `Company` settings collection to configure per-tenant features (AI on/off, product limits, etc.)

### CI/CD
- GitHub Actions pipeline: lint → type-check → test → build → deploy
- Docker Compose for local development parity with production
- Environment-specific configs managed via a secrets manager (Vault / AWS Secrets Manager), not `.env` files

---

## Project Structure

```
├── backend/
│   ├── scripts/
│   │   └── seed.ts              # Populates DB with demo data
│   └── src/
│       ├── config/db.ts         # MongoDB connection
│       ├── middleware/
│       │   ├── auth.middleware.ts   # JWT verification
│       │   └── role.middleware.ts   # requireAdmin guard
│       ├── models/              # Mongoose schemas
│       ├── routes/              # Express route handlers
│       └── services/
│           └── ai.service.ts    # Gemini tool-calling agent
└── frontend/
    └── src/
        ├── components/          # Layout, ProductModal, ProtectedRoute
        ├── context/             # AuthContext (JWT state)
        ├── pages/               # Login, Register, Dashboard, Chat
        ├── services/api.ts      # Axios instance with auth interceptor
        └── types/               # Shared TypeScript interfaces
```