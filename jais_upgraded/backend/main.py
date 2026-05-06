"""JAIS v4.0 — Judgment to Action Intelligence System"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from routers import judgment, actions, dashboard, audit, ccms
from services.database import init_db

app = FastAPI(title="JAIS API v4.0", version="4.0.0",
    description="AI layer for CCMS/CIS platforms across India — self-hostable on NIC infrastructure")

app.add_middleware(CORSMiddleware, allow_origins=["*"],
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

app.include_router(judgment.router, prefix="/api/judgment", tags=["Judgment"])
app.include_router(actions.router,  prefix="/api/actions",  tags=["Actions"])
app.include_router(dashboard.router,prefix="/api/dashboard",tags=["Dashboard"])
app.include_router(audit.router,    prefix="/api/audit",    tags=["Audit"])
app.include_router(ccms.router,     prefix="/api/ccms",     tags=["CCMS Integration"])

@app.on_event("startup")
async def startup():
    await init_db()
    print("🚀 JAIS v4.0 — Backend ready. CCMS webhook active at /api/ccms/webhook")
    print("   Roles: Reviewer · Secretary · Admin")
    print("   AI: Claude API (dev) / Llama 3 NIC (production)")

@app.get("/")
def root():
    return {
        "status": "JAIS v4.0 Online",
        "roles": ["Reviewer", "Secretary", "Admin"],
        "ccms_webhook": "/api/ccms/webhook",
        "data_privacy": "Production: Llama 3 self-hosted on NIC servers. No data leaves govt infra.",
        "features": ["Voice Q&A","Anomaly Detection","Compliance Prediction",
                     "Gantt Timeline","Dept Heat Map","DNA Fingerprint",
                     "CCMS Webhook Integration","Role-Based Access","Cryptographic Audit Trail"]
    }

@app.get("/api/health")
def health():
    return {"status":"healthy","version":"4.0.0","ccms_integration":True,"roles":3}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
