"""Actions Router v4.0 — verify/approve/reject/reset with full audit trail"""
import uuid, hashlib, json
from datetime import datetime
import aiosqlite
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from services.database import DB_PATH

router = APIRouter()

class VerifyBody(BaseModel):
    action: str        # approve | reject | reset
    user_email: str  = "reviewer@jais.gov.in"
    user_role: str   = "Senior Reviewer"
    notes: Optional[str] = None

@router.post("/{action_id}/verify")
async def verify_action(action_id: str, body: VerifyBody):
    if body.action not in {"approve","reject","reset"}:
        raise HTTPException(400, "action must be one of: approve, reject, reset")
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cur = await db.execute("SELECT * FROM action_plans WHERE id=?", (action_id,))
        row = await cur.fetchone()
        if not row:
            raise HTTPException(404, "Action plan not found.")
        new_status = {"approve":"approved","reject":"rejected","reset":"pending"}[body.action]
        now = datetime.utcnow().isoformat()
        await db.execute(
            "UPDATE action_plans SET status=?,verified_by=?,verified_at=?,notes=? WHERE id=?",
            (new_status, body.user_email, now, body.notes, action_id)
        )
        event_label = {"approve":"approved","reject":"rejected","reset":"reset_to_pending"}[body.action]
        crypto = hashlib.sha256(f"{action_id}{body.action}{now}{body.user_email}".encode()).hexdigest()[:16]
        desc = (f"Action '{dict(row)['title'][:60]}' {event_label} by {body.user_email} "
                f"(Role: {body.user_role}). Notes: {body.notes or 'None'}.")
        await db.execute(
            """INSERT INTO audit_trail
               (id,judgment_id,action_plan_id,event_type,event_description,user_email,user_role,crypto_hash)
               VALUES (?,?,?,?,?,?,?,?)""",
            (str(uuid.uuid4()), dict(row)["judgment_id"], action_id,
             event_label, desc, body.user_email, body.user_role, crypto)
        )
        await db.commit()
    return {"success": True, "action_id": action_id, "new_status": new_status}

@router.get("/judgment/{judgment_id}")
async def get_actions(judgment_id: str):
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cur = await db.execute(
            "SELECT * FROM action_plans WHERE judgment_id=? ORDER BY risk_score DESC", (judgment_id,)
        )
        rows = [dict(r) for r in await cur.fetchall()]
        # Parse confidence_scores JSON string back to dict
        for r in rows:
            if isinstance(r.get("confidence_scores"), str):
                try: r["confidence_scores"] = json.loads(r["confidence_scores"])
                except: r["confidence_scores"] = {}
        return rows

@router.get("/{action_id}")
async def get_action(action_id: str):
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cur = await db.execute("SELECT * FROM action_plans WHERE id=?", (action_id,))
        row = await cur.fetchone()
        if not row:
            raise HTTPException(404, "Action plan not found.")
        r = dict(row)
        if isinstance(r.get("confidence_scores"), str):
            try: r["confidence_scores"] = json.loads(r["confidence_scores"])
            except: r["confidence_scores"] = {}
        return r
