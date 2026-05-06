# JAIS — Judgment Action Intelligence System
### v4.0 · AI Bharat Hackathon

> An AI layer that sits on top of India's **CCMS** (Court Case Monitoring System) and **CIS** (Court Information System). It reads court judgment PDFs, extracts every government directive automatically, maps them to responsible departments, predicts compliance probability before failure, and presents human-verified action plans to officers — with a full cryptographic audit trail.

---

## Table of Contents

1. [What This Does](#what-this-does)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [How to Run](#how-to-run)
5. [Login Credentials](#login-credentials)
6. [All API Endpoints](#all-api-endpoints)
7. [AI Features](#ai-features)
8. [CCMS Webhook Integration](#ccms-webhook-integration)
9. [Data Privacy](#data-privacy)
10. [Demo Flow for Judges](#demo-flow-for-judges)
11. [Troubleshooting](#troubleshooting)

---

## What This Does

Indian government departments receive hundreds of court judgments every month. Each judgment contains specific legal directives — "Urban Development Department must restore permit within 30 days" — that must be acted upon. Currently officers read the full PDF manually, extract action items by hand, and track them in spreadsheets.

**JAIS automates this entire workflow:**

```
Court Judgment PDF
        ↓
   AI Extraction (Claude API or Rule-based)
        ↓
   Structured Action Plans with deadlines, departments, risk scores
        ↓
   Human Reviewer approves / rejects each action
        ↓
   Approved actions visible to Secretary on Dashboard
        ↓
   Compliance status posted back to CCMS
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, React Router v6, Axios, React Dropzone |
| Backend | Python 3.10+, FastAPI, Uvicorn |
| Database | SQLite via aiosqlite (swappable to PostgreSQL) |
| AI (Dev) | Claude API (Anthropic) |
| AI (Production) | Llama 3 self-hosted on NIC servers |
| PDF Extraction | PyMuPDF (digital PDFs + scanned OCR fallback) |
| Fonts | Crimson Pro (serif) · Nunito Sans · IBM Plex Mono |

---

## Project Structure

```
jais_upgraded/
│
├── backend/
│   ├── main.py                    ← FastAPI app entry point
│   ├── requirements.txt           ← All Python dependencies
│   ├── jais.db                    ← SQLite database (auto-created on first run)
│   │
│   ├── routers/
│   │   ├── judgment.py            ← Upload PDF, demo load, voice Q&A, anomalies
│   │   ├── actions.py             ← Approve / Reject / Reset action plans
│   │   ├── dashboard.py           ← Approved-only view, urgent actions, tasks
│   │   ├── audit.py               ← Cryptographic audit trail
│   │   └── ccms.py                ← CCMS webhook integration endpoint
│   │
│   └── services/
│       ├── database.py            ← SQLite schema (all tables + columns)
│       └── nlp_service.py         ← Full AI pipeline:
│                                      PDF extraction → case details → directives
│                                      → action plans → risk scores → anomalies
│                                      → compliance predictions
│
└── frontend/
    ├── package.json
    └── src/
        ├── App.js                 ← Routes + auth + role-based access
        ├── index.css              ← Court-themed light design (parchment + maroon)
        │
        ├── pages/
        │   ├── LoginPage.js       ← 3 login roles with demo credentials
        │   ├── UploadPage.js      ← PDF upload + pipeline explainer
        │   ├── AnalysisPage.js    ← Split view: PDF text + action verification
        │   ├── InsightsPage.js    ← 6 AI features (Voice Q&A, Anomaly, etc.)
        │   ├── DashboardPage.js   ← Overview, Gantt, Heat Map, Audit Trail
        │   └── CCMSPage.js        ← Webhook demo + national rollout + privacy
        │
        ├── components/
        │   └── Navbar.js          ← Navigation + user role badge
        │
        └── services/
            └── api.js             ← All API calls in one place
```

---

## How to Run

You need two terminals open at the same time — one for backend, one for frontend.

### Requirements

- Python 3.10 or higher → https://python.org
- Node.js 16 or higher → https://nodejs.org

---

### Terminal 1 — Backend

```bash
# Step 1: Go into the backend folder
cd jais_upgraded/backend

# Step 2: Install Python dependencies (only needed once)
pip install -r requirements.txt

# Step 3: (Optional) Add your Claude API key for real AI extraction
# Without this, the system uses rule-based extraction — still works fine
export ANTHROPIC_API_KEY=sk-ant-your-key-here     # Mac / Linux
set ANTHROPIC_API_KEY=sk-ant-your-key-here         # Windows CMD
$env:ANTHROPIC_API_KEY="sk-ant-your-key-here"      # Windows PowerShell

# Step 4: Start the backend
python main.py
```

You should see:
```
🚀 JAIS v4.0 — Backend ready. CCMS webhook active at /api/ccms/webhook
   Roles: Reviewer · Secretary · Admin
   AI: Claude API (dev) / Llama 3 NIC (production)
INFO:     Uvicorn running on http://0.0.0.0:8000
```

Backend is now live at → **http://localhost:8000**
API documentation at → **http://localhost:8000/docs**

---

### Terminal 2 — Frontend

```bash
# Step 1: Go into the frontend folder
cd jais_upgraded/frontend

# Step 2: Install Node dependencies (only needed once — takes ~1 minute)
npm install

# Step 3: Start the frontend
npm start
```

Browser opens automatically at → **http://localhost:3000**

---

## Login Credentials

The login page shows these automatically. For demo, any password works or use the ones below:

| Role | Name | Email | Password | What they can do |
|---|---|---|---|---|
| **Reviewer** | Amit Kumar Sharma | amit.sharma@bihar.gov.in | `reviewer123` | Upload PDFs, view analysis, **approve/reject** actions |
| **Secretary** | Dr. Priya Singh (IAS) | priya.singh@bihar.gov.in | `secretary123` | Upload PDFs, view everything, **cannot approve/reject** |
| **Admin** | Rajesh Tiwari (NIC) | rajesh.tiwari@nic.in | `admin123` | Full access including **CCMS Integration** page |

> **Note:** Secretary role is view-only on the Analysis page — they can see all AI extractions but cannot modify action plan status. This matches real government workflow where IAS officers review but designated reviewers verify.

---

## All API Endpoints

### Judgment

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/judgment/upload` | Upload a court judgment PDF |
| `POST` | `/api/judgment/demo/load` | Load the built-in demo judgment |
| `GET` | `/api/judgment/` | List all processed judgments |
| `GET` | `/api/judgment/{id}` | Get full judgment with directives, actions, audit |
| `POST` | `/api/judgment/{id}/ask` | Ask a question about the judgment (Voice Q&A) |
| `GET` | `/api/judgment/{id}/anomalies` | Get contradiction and anomaly scan results |
| `GET` | `/api/judgment/{id}/compliance-predictions` | Get per-department compliance probability |

### Actions

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/actions/judgment/{id}` | List all action plans for a judgment |
| `POST` | `/api/actions/{id}/verify` | Approve / Reject / Reset an action plan |
| `GET` | `/api/actions/{id}` | Get a single action plan |

**Verify body example:**
```json
{
  "action": "approve",
  "user_email": "reviewer@bihar.gov.in",
  "user_role": "Senior Reviewer",
  "notes": "Verified against original order"
}
```
`action` must be one of: `approve` | `reject` | `reset`

### Dashboard

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/dashboard/summary` | Stats, department breakdown, urgent actions |
| `GET` | `/api/dashboard/tasks` | All approved actions (decision-maker view) |
| `GET` | `/api/dashboard/pending` | Actions awaiting human review |

### Audit

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/audit/{judgment_id}` | Full audit trail for a judgment |
| `GET` | `/api/audit/export/{judgment_id}` | Export audit trail with judgment metadata |

### CCMS Integration

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/ccms/webhook` | Receive judgment from CCMS automatically |
| `GET` | `/api/ccms/status` | Health check for CCMS to verify JAIS is reachable |
| `GET` | `/api/ccms/demo-flow` | Full integration flow explanation (for judges) |

---

## AI Features

### 1. 🎙️ Voice Q&A
Officers can type or **speak questions in Hindi or English** about any uploaded judgment. Powered by Claude API with rule-based fallback.

Example questions:
- "What is the appeal deadline?"
- "अपील की समय सीमा क्या है?"
- "Who is responsible for compliance?"
- "What happens if we miss the deadline?"

### 2. ⚠️ Contradiction & Anomaly Detector
Automatically scans for:
- Conflicting deadlines for the same department
- Missing judge signatures
- Case number detection failures
- Extremely short deadlines requiring immediate escalation
- Appeal limitation windows

### 3. 📊 Compliance Prediction Engine
Predicts probability of on-time compliance **before** failure using:
- Department historical compliance rates
- Deadline urgency factor
- Task complexity factor

Formula: `score = base_rate × urgency_factor × complexity_factor × 100`

### 4. 📅 Gantt Timeline
Visual compliance roadmap showing all department action windows from Day 0 to Day 90, with deadline markers and dependency chains.

### 5. 🔥 Department Heat Map
Cross-department compliance health grid — designed for the Chief Secretary's morning briefing. Shows every department ranked by compliance risk.

### 6. 🧬 DNA Fingerprint
Semantic case matching against CCMS precedent database. Calculates legal domain weights (Administrative Law, Due Process, Mandamus, etc.) from actual word frequencies in the uploaded document.

---

## CCMS Webhook Integration

When a court officer uploads a judgment to CCMS, CCMS fires a webhook to JAIS automatically. The officer does nothing extra.

**Test it live from the CCMS Integration page (Admin login required), or via curl:**

```bash
curl -X POST http://localhost:8000/api/ccms/webhook \
  -H "Content-Type: application/json" \
  -H "x-ccms-api-key: demo" \
  -d '{
    "case_number": "WP/5001/2025",
    "court_name": "High Court of Judicature at Patna",
    "judgment_date": "2025-01-20",
    "state_code": "BR",
    "judge_name": "Justice A.K. Singh",
    "petitioner": "Ram Kumar vs State of Bihar",
    "respondent": "State of Bihar",
    "source_system": "CCMS"
  }'
```

**Expected response:**
```json
{
  "success": true,
  "judgment_id": "uuid-here",
  "message": "Judgment WP/5001/2025 auto-processed. 4 action plans generated. Pending human verification.",
  "actions_count": 4,
  "processing_time_ms": 312,
  "jais_url": "http://jais.nic.in/analysis/uuid-here"
}
```

### Integration Flow

```
1. Court Officer    → Uploads PDF to CCMS (existing workflow, zero change)
2. CCMS            → POST /api/ccms/webhook (case metadata + secure PDF link)
3. JAIS AI         → Downloads PDF, runs OCR if scanned
4. JAIS AI         → Extracts directives, generates action plans in <8 seconds
5. Senior Reviewer → Logs in, approves / rejects each action
6. Dashboard       → Approved actions visible to Secretary and Department Heads
7. CCMS Callback   → JAIS posts compliance status back to CCMS
```

---

## Data Privacy

**This is the most important thing to tell government officials:**

> In production deployment, the Claude API is replaced by a **self-hosted Llama 3 model running on NIC (National Informatics Centre) servers**. No court data leaves government infrastructure. All AI inference runs on-premise within NIC's secure data centre.

| Component | Development | Production |
|---|---|---|
| AI Model | Claude API (Anthropic) | Llama 3 — NIC On-Premise |
| PDF Storage | Local disk | NIC Secure Object Store |
| Database | SQLite | PostgreSQL — NIC Data Centre |
| Authentication | Hardcoded demo | NIC PKI / SSO |
| Data Residency | Developer machine | 100% within India |
| Network | Open | NIC private network only |

---

## Demo Flow for Judges

Follow this exact order for a clean 5-minute demo:

**Step 1 — Login (30 seconds)**
- Open http://localhost:3000
- Select **Reviewer** role → password `reviewer123` → Login

**Step 2 — Upload (30 seconds)**
- Click any sample judgment on the upload page
- Watch the processing pipeline animation complete

**Step 3 — Analysis Page (90 seconds)**
- Show the split view — PDF text on left, action plans on right
- Point out: Source paragraph references, confidence scores, "Why This Action" reasoning
- Approve 2 actions, reject 1 — show the audit trail updating

**Step 4 — AI Insights (90 seconds)**
- Type or speak: **"अपील की deadline क्या है?"** into Voice Q&A
- Show the Anomaly Detector — explain the contradiction flagged
- Show Compliance Prediction — Revenue at 34% is the key insight

**Step 5 — Dashboard (60 seconds)**
- Switch to **Gantt Timeline** tab — show the visual dependency chain
- Switch to **Heat Map** tab — "This is what the Chief Secretary sees every morning"
- Switch to **Audit Trail** — "Every action cryptographically logged"
- Click Export CSV

**Step 6 — CCMS Integration (30 seconds)**
- Logout → Login as **Admin** → Go to CCMS Integration page
- Click **"Fire Test Webhook"** — show the live processing response
- Point to the data privacy section

---

## Troubleshooting

**"Backend not running" error in frontend**
```bash
# Make sure you're in the backend folder and it's running
cd jais_upgraded/backend
python main.py
# Check: http://localhost:8000/api/health should return {"status":"healthy"}
```

**npm install fails**
```bash
# Try clearing npm cache
npm cache clean --force
npm install
```

**PDF upload shows same demo data every time**
- This happens if PyMuPDF failed to extract text from your PDF
- Install PyMuPDF properly: `pip install pymupdf`
- Check backend terminal for error messages during upload
- Try a different PDF — some heavily scanned PDFs need Tesseract OCR

**pip install fails for PyMuPDF**
```bash
# Try this instead
pip install --upgrade pip
pip install pymupdf
# Or on some systems:
pip install PyMuPDF==1.25.5
```

**Port already in use**
```bash
# Kill whatever is using port 8000
lsof -ti:8000 | xargs kill -9    # Mac/Linux
netstat -ano | findstr :8000      # Windows — then Task Manager to kill PID
```

**Voice Q&A microphone not working**
- Must use **Google Chrome** browser — Firefox does not support Web Speech API
- Allow microphone permission when browser asks
- If still failing, type the question instead — same backend processes it

**Hindi text not displaying correctly**
- Install the fonts — they load from Google Fonts automatically
- If offline: download Crimson Pro and Nunito Sans from fonts.google.com

---

## Built With

- **Backend:** Python 3.10 · FastAPI · aiosqlite · httpx · PyMuPDF
- **Frontend:** React 18 · React Router v6 · Axios · React Dropzone
- **AI:** Anthropic Claude API (dev) · Llama 3 NIC self-hosted (production)
- **Design:** Crimson Pro · Nunito Sans · IBM Plex Mono · Court parchment theme

---

*JAIS v4.0 — Making court judgments actionable for government departments across India.*
*Designed to scale from Bihar CCMS to all Indian states via CIS integration.*
