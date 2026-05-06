"""Dashboard Router v4.0 — decision-oriented, approved-only, urgency-ranked"""
import aiosqlite
from fastapi import APIRouter
from services.database import DB_PATH

router = APIRouter()

@router.get("/summary")
async def summary():
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cur = await db.execute("SELECT COUNT(*) total, SUM(status='completed') processed FROM judgments")
        j = dict(await cur.fetchone())
        cur = await db.execute("""
            SELECT COUNT(*) total, SUM(status='approved') approved,
                   SUM(status='pending') pending, SUM(status='rejected') rejected,
                   SUM(priority='critical') critical, SUM(priority='high') high_p,
                   AVG(risk_score) avg_risk
            FROM action_plans
        """)
        a = dict(await cur.fetchone())
        cur = await db.execute("""
            SELECT department, COUNT(*) count, SUM(status='approved') approved,
                   SUM(status='pending') pending, AVG(risk_score) avg_risk,
                   MIN(deadline_days) nearest_deadline
            FROM action_plans GROUP BY department ORDER BY avg_risk DESC
        """)
        dept = [dict(r) for r in await cur.fetchall()]
        # Urgent: approved actions with deadline <= 30 days
        cur = await db.execute("""
            SELECT a.*, j.case_number FROM action_plans a
            JOIN judgments j ON a.judgment_id=j.id
            WHERE a.status='approved' AND a.deadline_days <= 30
            ORDER BY a.deadline_days ASC LIMIT 5
        """)
        urgent = [dict(r) for r in await cur.fetchall()]
        return {"judgment_stats": j, "action_stats": a, "by_department": dept, "urgent_actions": urgent}

@router.get("/tasks")
async def tasks():
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        # Gap #5: only approved actions in dashboard — decision-oriented
        cur = await db.execute("""
            SELECT a.*, j.case_number, j.case_title, j.court
            FROM action_plans a JOIN judgments j ON a.judgment_id=j.id
            WHERE a.status='approved'
            ORDER BY a.risk_score DESC, a.deadline_days ASC
        """)
        return [dict(r) for r in await cur.fetchall()]

@router.get("/pending")
async def pending_review():
    """Returns pending actions needing human review — for the reviewer"""
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cur = await db.execute("""
            SELECT a.*, j.case_number, j.case_title
            FROM action_plans a JOIN judgments j ON a.judgment_id=j.id
            WHERE a.status='pending'
            ORDER BY a.risk_score DESC
        """)
        return [dict(r) for r in await cur.fetchall()]
