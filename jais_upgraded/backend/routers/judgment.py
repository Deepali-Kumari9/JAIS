"""Judgment Router v4.0 — upload, demo, voice Q&A, anomalies, compliance predictions"""
import uuid, json, hashlib
import aiosqlite
from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from services.database import DB_PATH
from services.nlp_service import (process_judgment, answer_question,
                                   detect_anomalies, compute_compliance_predictions)

router = APIRouter()


async def _save_judgment(jid: str, filename: str, result: dict):
    ex   = result["extraction"]
    cas  = ex.get("case_details", {})
    meta = result.get("pdf_meta", {})
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            """INSERT INTO judgments
               (id,filename,case_number,case_title,court,date_of_order,
                petitioner,respondent,judge,raw_text,pdf_hash,
                pdf_method,page_count,ocr_used,status)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,'completed')""",
            (jid, filename,
             cas.get("case_number",""), cas.get("case_title",""),
             cas.get("court",""),       cas.get("date_of_order",""),
             cas.get("petitioner",""),  cas.get("respondent",""),
             cas.get("judge",""),       result["raw_text"],
             result["pdf_hash"],
             meta.get("method","unknown"), meta.get("page_count",0),
             1 if meta.get("ocr_used") else 0)
        )
        for d in ex.get("directives", []):
            await db.execute(
                """INSERT INTO directives
                   (id,judgment_id,directive_text,source_paragraph,source_sentence,
                    confidence,directive_type,deadline_days)
                   VALUES (?,?,?,?,?,?,?,?)""",
                (str(uuid.uuid4()), jid,
                 d.get("text",""), d.get("paragraph_number",0),
                 d.get("source_sentence",""), d.get("confidence",0.85),
                 d.get("directive_type","comply"), d.get("deadline_days",30))
            )
        for a in ex.get("action_plans", []):
            await db.execute(
                """INSERT INTO action_plans
                   (id,judgment_id,directive_id,title,decision_type,action_type,
                    department,responsible_officer,role_for,deadline_days,deadline_date,
                    priority,risk_score,risk_level,nature_of_action,reason,
                    confidence,confidence_scores,source_paragraph,source_sentence,
                    conditions,status)
                   VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'pending')""",
                (str(uuid.uuid4()), jid,
                 a.get("directive_id",""), a.get("title",""),
                 a.get("decision_type","Compliance"), a.get("action_type","administrative"),
                 a.get("department",""), a.get("responsible_officer",""),
                 a.get("role_for","For Department Head"),
                 a.get("deadline_days",30), a.get("deadline_date",""),
                 a.get("priority","medium"), a.get("risk_score",50),
                 a.get("risk_level","medium"), a.get("nature_of_action",""),
                 a.get("reason",""), a.get("confidence",0.85),
                 json.dumps(a.get("confidence_scores",{})),
                 a.get("source_paragraph",0), a.get("source_sentence",""),
                 a.get("conditions") or "")
            )
        for sc in result.get("similar_cases", []):
            await db.execute(
                """INSERT INTO similar_cases
                   (id,judgment_id,similar_case_number,similar_case_title,
                    similarity_score,outcome,compliance_days,warning_message)
                   VALUES (?,?,?,?,?,?,?,?)""",
                (str(uuid.uuid4()), jid,
                 sc.get("case_number",""), sc.get("case_title",""),
                 sc.get("similarity_score",0), sc.get("outcome",""),
                 sc.get("compliance_days"), sc.get("warning"))
            )
        for cn in ex.get("cascade_analysis", []):
            await db.execute(
                """INSERT INTO cascade_nodes
                   (id,judgment_id,department,action,start_day,end_day,depends_on,node_level)
                   VALUES (?,?,?,?,?,?,?,?)""",
                (str(uuid.uuid4()), jid,
                 cn.get("department",""), cn.get("action",""),
                 cn.get("start_day",0), cn.get("end_day",30),
                 cn.get("depends_on"), cn.get("level",0))
            )
        dirs_count = len(ex.get("directives",[]))
        acts_count = len(ex.get("action_plans",[]))
        await db.execute(
            """INSERT INTO audit_trail
               (id,judgment_id,event_type,event_description,user_email,user_role,crypto_hash)
               VALUES (?,?,'upload',?,?,'System',?)""",
            (str(uuid.uuid4()), jid,
             f"Judgment '{filename}' uploaded and processed. AI extracted {dirs_count} directives, {acts_count} action plans. PDF method: {meta.get('method','unknown')}.",
             "system@jais.gov.in", result["pdf_hash"][:16])
        )
        await db.commit()


@router.post("/upload")
async def upload_judgment(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(400, "Only PDF files are accepted. Please upload a valid court judgment PDF.")
    content = await file.read()
    if len(content) > 50 * 1024 * 1024:
        raise HTTPException(400, "File too large. Maximum size is 50 MB.")
    if len(content) < 100:
        raise HTTPException(400, "File appears empty or corrupted. Please check the PDF and try again.")
    jid = str(uuid.uuid4())
    try:
        result = await process_judgment(content, file.filename)
        await _save_judgment(jid, file.filename, result)
        ex = result["extraction"]
        return {
            "success": True, "judgment_id": jid, "filename": file.filename,
            "case_number": ex.get("case_details",{}).get("case_number",""),
            "directives_count": len(ex.get("directives",[])),
            "actions_count": len(ex.get("action_plans",[])),
            "pdf_method": result.get("pdf_meta",{}).get("method",""),
            "ocr_used": result.get("pdf_meta",{}).get("ocr_used", False),
        }
    except Exception as e:
        raise HTTPException(500, f"Processing failed: {str(e)}. Please check the PDF format and try again.")


@router.post("/demo/load")
async def load_demo():
    jid = str(uuid.uuid4())
    result = await process_judgment(b"DEMO", "Demo_Judgment_WP_4821_2024.pdf")
    await _save_judgment(jid, "Demo_Judgment_WP_4821_2024.pdf", result)
    ex = result["extraction"]
    return {
        "success": True, "judgment_id": jid,
        "filename": "Demo_Judgment_WP_4821_2024.pdf",
        "case_number": ex.get("case_details",{}).get("case_number","WP/4821/2024"),
        "directives_count": len(ex.get("directives",[])),
        "actions_count": len(ex.get("action_plans",[])),
    }


class VoiceQuery(BaseModel):
    question: str

@router.post("/{judgment_id}/ask")
async def ask_about_judgment(judgment_id: str, body: VoiceQuery):
    if not body.question or not body.question.strip():
        raise HTTPException(400, "Question cannot be empty.")
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cur = await db.execute("SELECT raw_text FROM judgments WHERE id=?", (judgment_id,))
        row = await cur.fetchone()
        if not row:
            raise HTTPException(404, "Judgment not found. Please check the judgment ID.")
    answer = await answer_question(body.question, row["raw_text"] or "")
    return {"question": body.question, "answer": answer}


@router.get("/{judgment_id}/anomalies")
async def get_anomalies(judgment_id: str):
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cur = await db.execute("SELECT raw_text FROM judgments WHERE id=?", (judgment_id,))
        row = await cur.fetchone()
        if not row:
            raise HTTPException(404, "Judgment not found.")
        cur2 = await db.execute("SELECT * FROM action_plans WHERE judgment_id=?", (judgment_id,))
        acts = [dict(r) for r in await cur2.fetchall()]
    return {"anomalies": detect_anomalies({"action_plans": acts}, row["raw_text"] or "")}


@router.get("/{judgment_id}/compliance-predictions")
async def get_compliance_predictions(judgment_id: str):
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cur = await db.execute("SELECT * FROM action_plans WHERE judgment_id=?", (judgment_id,))
        acts = [dict(r) for r in await cur.fetchall()]
    return {"predictions": compute_compliance_predictions(acts)}


@router.get("/")
async def list_judgments():
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cur = await db.execute("SELECT * FROM judgments ORDER BY created_at DESC")
        return [dict(r) for r in await cur.fetchall()]


@router.get("/{judgment_id}")
async def get_judgment(judgment_id: str):
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cur = await db.execute("SELECT * FROM judgments WHERE id=?", (judgment_id,))
        row = await cur.fetchone()
        if not row:
            raise HTTPException(404, "Judgment not found. It may have been deleted or the ID is incorrect.")
        cur = await db.execute("SELECT * FROM directives WHERE judgment_id=? ORDER BY source_paragraph", (judgment_id,))
        dirs = [dict(r) for r in await cur.fetchall()]
        cur = await db.execute("SELECT * FROM action_plans WHERE judgment_id=? ORDER BY risk_score DESC", (judgment_id,))
        acts = [dict(r) for r in await cur.fetchall()]
        cur = await db.execute("SELECT * FROM similar_cases WHERE judgment_id=? ORDER BY similarity_score DESC", (judgment_id,))
        sim  = [dict(r) for r in await cur.fetchall()]
        cur = await db.execute("SELECT * FROM cascade_nodes WHERE judgment_id=? ORDER BY node_level, start_day", (judgment_id,))
        cas  = [dict(r) for r in await cur.fetchall()]
        cur = await db.execute("SELECT * FROM audit_trail WHERE judgment_id=? ORDER BY created_at DESC", (judgment_id,))
        aud  = [dict(r) for r in await cur.fetchall()]
        return {
            "judgment": dict(row), "directives": dirs, "action_plans": acts,
            "similar_cases": sim, "cascade_nodes": cas, "audit_trail": aud,
        }
