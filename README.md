# ClaimLens 🔍

> AI-powered insurance claims processing platform

**See the damage. Skip the paperwork.**

## Screenshots

### 🏠 Homepage
![Homepage](screenshots/homepage.png)

### 📝 File a Claim
![Claim Form](screenshots/claim-form.png)

### 📷 Upload Photos
![Photo Upload](screenshots/photo-upload.png)

### 🤖 AI Analysis Result
![AI Result](screenshots/result.png)

### 🏢 Agent Portal
![Agent Portal](screenshots/agent-portal.png)

## What is ClaimLens?

ClaimLens automates the insurance claims process using AI. Customers upload damage photos, and Google Gemini Vision analyzes the damage instantly — detecting vehicle make/model, damage type, severity, and estimated repair cost. Insurance agents review AI-generated reports and approve or reject claims from a dedicated portal.

## Features

- 📸 **Multi-photo damage analysis** — Upload up to 10 photos for accurate AI assessment
- 🤖 **Google Gemini Vision AI** — Detects vehicle make, model, color, damage type and severity
- 💰 **Repair cost estimation** — Automatic cost range based on damage analysis
- 🏢 **Agent Portal** — Review claims, view photos with lightbox, approve or reject
- 🔍 **Search & Filter** — Search by ID, location, or type. Filter by status
- ☁️ **Cloud Storage** — Photos stored securely in Supabase Storage

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16.4.3, TypeScript, Tailwind CSS |
| Backend | FastAPI, Python |
| AI | Google Gemini Vision |
| Database | PostgreSQL (Supabase) |
| Storage | Supabase Storage |

## Getting Started

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
source venv/bin/activate       # macOS/Linux
pip install -r requirements.txt
uvicorn app.main:app --port 8001
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Environment Variables

Create `backend/.env`:
```env
DATABASE_URL=your_supabase_connection_string
GEMINI_API_KEY=your_google_gemini_api_key
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
JWT_SECRET_KEY=your_random_secret_key
AGENT_USERNAME=admin
AGENT_PASSWORD_HASH=your_bcrypt_password_hash
```

To generate `AGENT_PASSWORD_HASH`, run this from the `backend` folder with the virtual environment activated:
```bash
python -c "from passlib.hash import bcrypt; print(bcrypt.hash('your_password'))"
```

Create `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8001
```

### Database & Storage Setup

The database schema and storage bucket are not created automatically. Before running the app, create them manually in your Supabase project:

- **Database tables:** `Claim` and `DamageReport`, matching the models in `backend/app/models/claim.py`
- **Storage bucket:** a private bucket named `claim-photos`

## Live Demo

- 🌐 Frontend: https://claim-lens-one.vercel.app
- 🔧 Backend: https://claimlens-production.up.railway.app