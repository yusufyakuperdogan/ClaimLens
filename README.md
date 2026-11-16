<div align="center">

<img src="frontend/public/logo.png" alt="ClaimLens logo" width="96" />

# ClaimLens

### AI-powered auto insurance claims — from damage photos to an adjuster-ready report in one flow.

**See the damage. Skip the paperwork.**

[![Live Demo](https://img.shields.io/badge/Live_Demo-claim--lens--one.vercel.app-0ea5e9?style=for-the-badge&logo=vercel&logoColor=white)](https://claim-lens-one.vercel.app)
[![API](https://img.shields.io/badge/API-Railway-8b5cf6?style=for-the-badge&logo=railway&logoColor=white)](https://claimlens-production.up.railway.app)

![Next.js](https://img.shields.io/badge/Next.js-16.4.3-000000?logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.162-009688?logo=fastapi&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.12-3776AB?logo=python&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-4169E1?logo=postgresql&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Storage-3FCF8E?logo=supabase&logoColor=white)
![Google Gemini](https://img.shields.io/badge/Google_Gemini-2.5_Flash-8E75B2?logo=googlegemini&logoColor=white)

</div>

---

## 📋 Overview

First notice of loss (FNOL) is where every auto claim starts — and where a lot of time is lost to phone calls, forms, and manual photo review. **ClaimLens** streamlines that first step:

1. A **policyholder** files a claim online and uploads photos of the damage.
2. **Google Gemini** analyzes the photos and produces a structured damage report: vehicle details, damage description, severity, an estimated repair-cost range, and a confidence score.
3. A **claims agent** reviews every claim, its photos, and the AI report in a secure portal — and makes the final approve/reject decision.

The AI assists; a human decides. Every estimate is presented as advisory, with the final cost determined by a licensed adjuster.

---

## 📸 Screenshots

<table>
  <tr>
    <td width="50%"><img src="screenshots/homepage.png" alt="Homepage" /><p align="center"><b>🏠 Homepage</b></p></td>
    <td width="50%"><img src="screenshots/claim-form.png" alt="Claim form" /><p align="center"><b>📝 File a claim — incident details</b></p></td>
  </tr>
  <tr>
    <td width="50%"><img src="screenshots/upload-photos.png" alt="Upload damage photos" /><p align="center"><b>📷 Upload damage photos</b></p></td>
    <td width="50%"><img src="screenshots/claim-result.png" alt="AI damage report" /><p align="center"><b>🤖 AI damage report</b></p></td>
  </tr>
  <tr>
    <td width="50%"><img src="screenshots/agent-login.png" alt="Agent login" /><p align="center"><b>🔐 Agent portal login</b></p></td>
    <td width="50%"><img src="screenshots/agent-dashboard.png" alt="Agent dashboard" /><p align="center"><b>🏢 Agent dashboard — claim review</b></p></td>
  </tr>
</table>

---

## ✨ Features

### For policyholders
- 📝 **Guided two-step claim filing** — incident type, date, location, and description, then photo upload
- 📷 **Multi-photo upload** — up to 10 photos per claim (JPG, PNG, WEBP, or HEIC; 10 MB each)
- 🤖 **Instant AI damage report** — vehicle make, model, and color; damage description; severity (Low / Medium / High / Critical); estimated repair-cost range; AI confidence score; and a plain-language summary
- 🆔 **Claim ID** with one-click copy for follow-up

### For claims agents
- 🔐 **Secure agent portal** — JWT authentication with 60-minute sessions and automatic sign-out on expiry
- 🔍 **Search and filter** — find claims by ID, location, or incident type; filter by status
- 🖼️ **Photo review** — damage photos served through short-lived signed URLs, with a full-screen viewer and zoom
- ✅ **Approve or reject** — every decision records the deciding agent and a timestamp

### Under the hood
- 🛡️ **Validated AI output** — required fields, allowed severity values, confidence between 0 and 1, and a sane, non-negative cost range are enforced before anything is saved; the prompt instructs the model to ignore text and numbers inside the photos
- 📦 **Upload safety** — file types are verified from the file contents (not the browser's claim), with size and count limits
- 🚦 **Login rate limiting** — 5 attempts per minute per IP
- ⚡ **Non-blocking backend** — Gemini and storage calls run off the event loop, so one slow analysis never stalls other requests
- 🧯 **Graceful failures** — clear, user-facing messages when the AI or storage service is unavailable, with full details in the server logs

---

## 🏗️ Architecture

```mermaid
flowchart LR
    U["👤 Policyholder / 🧑‍💼 Agent<br/>(browser)"]
    V["Next.js frontend<br/>Vercel"]
    R["FastAPI backend<br/>Railway"]
    DB[("PostgreSQL<br/>Supabase")]
    ST[("Photo storage<br/>Supabase Storage")]
    G["Google Gemini<br/>2.5 Flash"]

    U -- "loads the app" --> V
    U -- "REST API · JWT for agents" --> R
    R -- "SQLAlchemy + asyncpg" --> DB
    R -- "uploads · signed URLs" --> ST
    R -- "photos + prompt → JSON report" --> G
    U -. "views photos via signed URLs" .-> ST
```

**How a claim flows through the system**

1. The customer submits incident details → `POST /claims/` stores the claim with status `PENDING`.
2. The customer uploads photos → `POST /damage/analyze/{id}` validates each file, stores it in a **private** Supabase Storage bucket, and sends the photos to Gemini.
3. Gemini returns a JSON damage report, which the backend validates and saves as a `DamageReport` linked to the claim.
4. An agent signs in, reviews the claim, photos, and report, and approves or rejects it via `PUT /claims/{id}/status`.

### Tech stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 16.4.3 (App Router), React 19, TypeScript, Tailwind CSS 4 |
| **Backend** | FastAPI, Python 3.12, Pydantic, SQLAlchemy 2 (async) with asyncpg |
| **Database** | PostgreSQL, hosted on Supabase |
| **File storage** | Supabase Storage (private bucket, signed URLs) |
| **AI** | Google Gemini 2.5 Flash (multimodal image analysis) |
| **Auth & security** | PyJWT (HS256), bcrypt via passlib, slowapi rate limiting |
| **Hosting** | Vercel (frontend), Railway (backend) |

### API overview

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `POST` | `/claims/` | Public | File a new claim |
| `POST` | `/damage/analyze/{claim_id}` | Public | Upload photos and run AI analysis |
| `POST` | `/auth/login` | Public (rate-limited) | Agent sign-in, returns a JWT |
| `GET` | `/claims/` | Agent | List all claims |
| `GET` | `/claims/{claim_id}` | Agent | Get one claim |
| `PUT` | `/claims/{claim_id}/status` | Agent | Approve or reject a claim |
| `GET` | `/damage/report/{claim_id}` | Agent | Get a claim's AI damage report |
| `GET` | `/damage/photos/{claim_id}` | Agent | Get signed URLs for a claim's photos |

Interactive API docs are available at `/docs` when running locally (disabled in production).

---

## 🔒 Security

Insurance data is sensitive, so the app is built with security in mind:

- **Authentication** — agent passwords are stored only as bcrypt hashes; sessions use signed, expiring JWTs.
- **Authorization** — every endpoint that reads claim data requires a valid agent token.
- **Least exposure** — API responses use explicit response models, so internal fields never reach the browser.
- **Input validation** — claim fields have length limits, an allowed list of incident types, and no future incident dates.
- **Browser hardening** — Content-Security-Policy, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, and `Permissions-Policy` headers on every page.
- **Restricted CORS** — only the known frontend origins, methods, and headers are allowed.
- **Fail fast** — the backend refuses to start if its database, storage, or token-signing secrets are missing.

---

## 🚀 Local development

### Prerequisites

- **Node.js** 20.9 or newer
- **Python** 3.12
- A **Supabase** project (PostgreSQL database + Storage)
- A **Google Gemini API key** ([Google AI Studio](https://aistudio.google.com/apikey))

### 1. Clone the repository

```bash
git clone <your-fork-url>
cd ClaimLens
```

### 2. Set up Supabase

**Storage:** create a **private** bucket named `claim-photos`.

**Database:** the schema is not created automatically. Run this in the Supabase SQL editor (it matches `backend/app/models/claim.py`):

```sql
CREATE TABLE "Claim" (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL,
  agent_id        TEXT,
  status          TEXT DEFAULT 'PENDING',
  incident_type   TEXT NOT NULL,
  incident_date   TIMESTAMP NOT NULL,
  location        TEXT NOT NULL,
  description     TEXT,
  priority_score  INTEGER DEFAULT 0,
  fraud_flag      BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMP,
  updated_at      TIMESTAMP
);

CREATE TABLE "DamageReport" (
  id                  TEXT PRIMARY KEY,
  claim_id            TEXT NOT NULL UNIQUE REFERENCES "Claim"(id),
  damage_type         TEXT NOT NULL,
  vehicle_make        TEXT DEFAULT 'Unknown',
  vehicle_model       TEXT DEFAULT 'Unknown',
  vehicle_color       TEXT DEFAULT 'Unknown',
  severity            TEXT NOT NULL,
  estimated_cost_min  DOUBLE PRECISION NOT NULL,
  estimated_cost_max  DOUBLE PRECISION NOT NULL,
  confidence_score    DOUBLE PRECISION NOT NULL,
  ai_summary          TEXT NOT NULL,
  created_at          TIMESTAMP
);
```

### 3. Backend (FastAPI)

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
source venv/bin/activate       # macOS / Linux
pip install -r requirements.txt
```

Create `backend/.env` (see [Environment variables](#-environment-variables)), then start the API:

```bash
uvicorn app.main:app --reload --port 8001
```

The API runs at http://localhost:8001, with interactive docs at http://localhost:8001/docs.

### 4. Frontend (Next.js)

```bash
cd frontend
npm install
```

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8001
```

Then start the dev server:

```bash
npm run dev
```

Open http://localhost:3000. Keep the frontend on port **3000** — it is the local origin the backend's CORS settings allow.

---

## 🔑 Environment variables

### Backend — `backend/.env`

| Variable | Required | Description |
|---|:---:|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string from Supabase (`postgres://` and `postgresql://` are both accepted) |
| `SUPABASE_URL` | ✅ | Your Supabase project URL |
| `SUPABASE_SERVICE_KEY` | ✅ | Supabase service-role key (server-side only — never expose it to the frontend) |
| `JWT_SECRET_KEY` | ✅ | Secret used to sign agent session tokens |
| `AGENT_USERNAME` | ✅ | Agent login username (the portal signs in as `admin`) |
| `AGENT_PASSWORD_HASH` | ✅ | bcrypt hash of the agent password |
| `GEMINI_API_KEY` | ✅ | Google Gemini API key |
| `ENVIRONMENT` | — | Set to `production` to disable the API docs pages |

```env
DATABASE_URL=postgresql://user:password@host:6543/postgres
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
JWT_SECRET_KEY=your_random_secret
AGENT_USERNAME=admin
AGENT_PASSWORD_HASH=your_bcrypt_password_hash
GEMINI_API_KEY=your_gemini_api_key
# ENVIRONMENT=production
```

Generate a strong `JWT_SECRET_KEY`:

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

Generate `AGENT_PASSWORD_HASH` (from the `backend` folder, with the virtual environment active):

```bash
python -c "from passlib.hash import bcrypt; print(bcrypt.hash('your_password'))"
```

At startup the backend checks `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `JWT_SECRET_KEY`, and `AGENT_PASSWORD_HASH`, and stops with a clear message naming any that are missing.

### Frontend — `frontend/.env.local`

| Variable | Required | Description |
|---|:---:|---|
| `NEXT_PUBLIC_API_URL` | ✅ | Base URL of the backend API, e.g. `http://localhost:8001` locally or your Railway URL in production |

---

## ☁️ Deployment

| Service | Platform | Notes |
|---|---|---|
| Frontend | **Vercel** | Root directory `frontend`; set `NEXT_PUBLIC_API_URL` to the backend URL |
| Backend | **Railway** | Root directory `backend`; started via the `Procfile` with Uvicorn; set all backend variables plus `ENVIRONMENT=production` |
| Database & storage | **Supabase** | PostgreSQL database and the private `claim-photos` bucket |

---

## 📁 Project structure

```
ClaimLens/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app, CORS, rate limiting, docs toggle
│   │   ├── auth.py              # Password hashing, JWT creation and verification
│   │   ├── database.py          # Async SQLAlchemy engine and sessions
│   │   ├── env.py               # Required environment variable checks
│   │   ├── models/claim.py      # Claim and DamageReport tables
│   │   ├── routes/
│   │   │   ├── auth_api.py      # POST /auth/login
│   │   │   ├── claims.py        # Claim endpoints
│   │   │   └── damage.py        # Photo upload, AI analysis, reports, photos
│   │   └── services/
│   │       ├── ai_service.py    # Gemini prompt and response validation
│   │       └── storage_service.py  # Supabase Storage uploads
│   ├── requirements.txt
│   ├── Procfile
│   └── runtime.txt
├── frontend/
│   ├── app/
│   │   ├── page.tsx             # Homepage
│   │   ├── customer/page.tsx    # Claim form and photo upload
│   │   ├── customer/result/     # AI damage report
│   │   ├── agent/page.tsx       # Agent portal
│   │   └── globals.css
│   ├── next.config.ts           # Security headers and CSP
│   └── package.json
└── screenshots/
```

---

## ⚠️ Disclaimer

ClaimLens is a portfolio project and is not affiliated with any insurance company. AI-generated damage assessments and cost estimates are for demonstration purposes only and are not a substitute for an inspection by a licensed adjuster.
