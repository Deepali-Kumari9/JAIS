"""Audit Trail Router v4.0"""
import aiosqlite
from fastapi import APIRouter, HTTPException
from services.database import DB_PATH

router = APIRouter()

@router.get("/{judgment_id}")
async def get_audit(judgment_id: str):
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cur = await db.execute(
            "SELECT * FROM audit_trail WHERE judgment_id=? ORDER BY created_at DESC", (judgment_id,)
        )
        return [dict(r) for r in await cur.fetchall()]

@router.get("/export/{judgment_id}")
async def export_audit(judgment_id: str):
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cur = await db.execute("SELECT * FROM judgments WHERE id=?", (judgment_id,))
        row = await cur.fetchone()
        if not row:
            raise HTTPException(404, "Judgment not found")
        cur = await db.execute(
            "SELECT * FROM audit_trail WHERE judgment_id=? ORDER BY created_at", (judgment_id,)
        )
        trail = [dict(r) for r in await cur.fetchall()]
        return {"judgment": dict(row), "audit_trail": trail, "total_events": len(trail)}
