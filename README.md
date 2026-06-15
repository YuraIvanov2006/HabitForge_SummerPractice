# 🔥 HabitForge

> **Build the habit. Forge the future.**

HabitForge is a gamified personal habit tracker that combines behavioral psychology with an interactive visual ecosystem. As you complete habits, your personal "Progress Tree" grows through 6 stages — from a tiny seed to a blooming ecosystem with butterflies and flowers.

---

## ✨ Features

- **Habit Management** — Create, edit, and delete daily or weekly habits across 5 categories (Study, Sport, Sleep, Nutrition, Other)
- **Habit Completion Logging** — Mark habits complete with XP animations; toggle for any date
- **XP & Levels** — Earn XP for every completion; level up as you progress
- **Streak Tracking** — Current and longest streaks tracked automatically
- **Ecosystem Tree** — A living SVG tree that evolves through 6 stages based on your XP
- **Heatmap** — GitHub-style activity heatmap showing your consistency over time
- **Analytics** — Time-series charts, category breakdowns, and weekly comparisons
- **Weekly Reports** — In-app summary of your week with growth rate and upcoming due dates
- **Focus Modes** — Filter by category with matching color themes (Study=Blue, Sport=Orange, etc.)
- **JWT Auth** — Secure login with access + refresh token pair; auto-refresh on expiry

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19 + TypeScript + Vite |
| **Styling** | Vanilla CSS (glassmorphism design system) |
| **Backend** | FastAPI (Python 3.12) |
| **Database** | PostgreSQL 15 |
| **ORM** | SQLAlchemy 2.0 (async) |
| **Migrations** | Alembic |
| **Auth** | JWT (access + refresh tokens via python-jose) |
| **Rate Limiting** | slowapi |
| **Testing (BE)** | pytest + pytest-asyncio + httpx + aiosqlite |
| **Testing (FE)** | Vitest + React Testing Library |
| **CI/CD** | GitHub Actions |
| **Dev DB** | Docker Compose (PostgreSQL) |

---

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Python 3.12+
- Node.js 20+ / npm

### 1. Start the Database

```bash
docker-compose up -d
```

This starts PostgreSQL on port **5433** (to avoid conflicts with local installs).

### 2. Configure the Backend

```bash
cd backend

# Copy and edit environment variables
cp .env.example .env
# ⚠️  Edit JWT_SECRET_KEY — generate with: openssl rand -hex 32
```

Key variables in `backend/.env`:
| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgresql+asyncpg://...` | Async DB URL for the app |
| `SYNC_DATABASE_URL` | `postgresql+psycopg2://...` | Sync URL for Alembic |
| `JWT_SECRET_KEY` | *(change this!)* | Secret for signing JWTs |
| `ALLOW_DATE_OVERRIDE` | `false` | Enable virtual date for testing |

### 3. Install Backend Dependencies & Run Migrations

```bash
# Create and activate virtualenv
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt

# Run database migrations
alembic upgrade head
```

### 4. Start the Backend Server

```bash
uvicorn app.main:app --reload --port 8000
```

API docs available at: **http://localhost:8000/docs**

### 5. Configure and Start the Frontend

```bash
cd frontend

# Copy and edit environment variables
cp .env.example .env.local
# Edit VITE_API_BASE_URL if your backend runs on a different port

npm install
npm run dev
```

Frontend available at: **http://localhost:5173**

---

## 🧪 Running Tests

### Backend

```bash
cd backend
# Install test dependencies (included in requirements.txt)
pytest tests/ -v
```

Uses an in-memory SQLite database — no PostgreSQL needed for tests.

### Frontend

```bash
cd frontend
npm run test        # run once
npm run test:ui     # open Vitest UI in browser
```

---

## 📁 Project Structure

```
HabitForge/
├── docker-compose.yml          # PostgreSQL dev database
├── README.md                   # This file
│
├── backend/
│   ├── .env.example            # Environment variable template
│   ├── requirements.txt        # Python dependencies
│   ├── alembic/                # Database migration scripts
│   ├── alembic.ini             # Alembic configuration
│   ├── tests/                  # pytest test suite (SQLite in-memory)
│   └── app/
│       ├── main.py             # FastAPI app factory + middleware
│       ├── api/                # Route handlers (auth, habits, stats, users, reports, util)
│       ├── core/               # Config, security (JWT/bcrypt), dependencies
│       ├── crud/               # Database query functions
│       ├── db/                 # SQLAlchemy engine and session
│       ├── middleware/         # Rate limiting (slowapi)
│       ├── models/             # SQLAlchemy ORM models
│       ├── schemas/            # Pydantic request/response schemas
│       ├── services/           # Business logic (auth, stats, reports)
│       └── utils/              # Shared utilities
│
└── frontend/
    ├── .env.example            # Frontend env template
    ├── package.json            # npm dependencies + scripts
    ├── vite.config.ts          # Vite + Vitest configuration
    └── src/
        ├── App.tsx             # Root component, routing, auth state
        ├── index.css           # Global design system (CSS variables, animations)
        ├── components/         # React components
        │   ├── AuthScreen.tsx
        │   ├── DashboardTab.tsx
        │   ├── AnalyticsTab.tsx
        │   ├── EcosystemTree.tsx
        │   ├── HabitModal.tsx
        │   ├── Heatmap.tsx
        │   ├── WeeklyReportModal.tsx
        │   ├── ProfileSettingsModal.tsx
        │   ├── EmptyState.tsx
        │   └── Skeleton.tsx
        └── test/               # Vitest test suite
```

---

## 📖 API Reference

Full interactive API documentation (Swagger UI): **http://localhost:8000/docs**
ReDoc alternative: **http://localhost:8000/redoc**

### Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Create account |
| `POST` | `/api/auth/login` | Login → get access + refresh tokens |
| `POST` | `/api/auth/refresh` | Refresh access token |
| `POST` | `/api/auth/logout` | Logout (client-side token clear) |
| `GET` | `/api/users/me` | Get current user profile |
| `PATCH` | `/api/users/me` | Update username/email |
| `POST` | `/api/users/me/change-password` | Change password |
| `DELETE` | `/api/users/me` | Delete account |
| `GET` | `/api/habits/` | List all habits |
| `POST` | `/api/habits/` | Create habit |
| `PUT` | `/api/habits/{id}` | Update habit |
| `DELETE` | `/api/habits/{id}` | Delete habit |
| `GET` | `/api/habits/{id}/logs` | Get completion logs |
| `POST` | `/api/habits/{id}/logs` | Log a completion |
| `GET` | `/api/stats/` | Get XP, level, streaks, chart data |
| `GET` | `/api/reports/weekly` | Get weekly summary report |
| `GET` | `/health` | Health check |

---

## 🔒 Security Notes

- **JWT Secret**: Always generate a strong secret before deploying. Use `openssl rand -hex 32`.
- **Rate Limiting**: Login and register are limited to 10 requests/minute per IP.
- **Date Override**: The `/api/util/date` endpoint (for time-travel testing) is disabled by default in production (`ALLOW_DATE_OVERRIDE=false`).
- **Password Hashing**: bcrypt with automatic salting.
- **Cascade Deletes**: Deleting a user removes all their habits and completion logs.

---

## 📜 License

This project was created as a summer practice project. All rights reserved.
