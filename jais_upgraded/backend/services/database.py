"""Database setup — SQLite with aiosqlite — v4.0 schema"""
import aiosqlite, os

DB_PATH = os.environ.get("DB_PATH", "jais.db")

async def init_db():
    async with aiosqlite.connect(DB_PATH) as db:
        await db.executescript("""
            CREATE TABLE IF NOT EXISTS judgments (
                id            TEXT PRIMARY KEY,
                filename      TEXT NOT NULL,
                case_number   TEXT,
                case_title    TEXT,
                court         TEXT,
                date_of_order TEXT,
                petitioner    TEXT,
                respondent    TEXT,
                judge         TEXT,
                raw_text      TEXT,
                pdf_hash      TEXT,
                pdf_method    TEXT,
                page_count    INTEGER DEFAULT 0,
                ocr_used      INTEGER DEFAULT 0,
                status        TEXT DEFAULT 'completed',
                created_at    TEXT DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS directives (
                id               TEXT PRIMARY KEY,
                judgment_id      TEXT NOT NULL,
                directive_text   TEXT NOT NULL,
                source_paragraph INTEGER,
                source_sentence  TEXT,
                confidence       REAL,
                directive_type   TEXT,
                deadline_days    INTEGER DEFAULT 30,
                created_at       TEXT DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS action_plans (
                id                   TEXT PRIMARY KEY,
                judgment_id          TEXT NOT NULL,
                directive_id         TEXT,
                title                TEXT NOT NULL,
                decision_type        TEXT,
                action_type          TEXT,
                department           TEXT,
                responsible_officer  TEXT,
                role_for             TEXT,
                deadline_days        INTEGER,
                deadline_date        TEXT,
                priority             TEXT,
                risk_score           REAL DEFAULT 0,
                risk_level           TEXT DEFAULT 'medium',
                nature_of_action     TEXT,
                reason               TEXT,
                confidence           REAL DEFAULT 0.85,
                confidence_scores    TEXT,
                source_paragraph     INTEGER,
                source_sentence      TEXT,
                conditions           TEXT,
                status               TEXT DEFAULT 'pending',
                verified_by          TEXT,
                verified_at          TEXT,
                notes                TEXT,
                created_at           TEXT DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS audit_trail (
                id                TEXT PRIMARY KEY,
                judgment_id       TEXT NOT NULL,
                action_plan_id    TEXT,
                event_type        TEXT NOT NULL,
                event_description TEXT NOT NULL,
                user_email        TEXT,
                user_role         TEXT,
                crypto_hash       TEXT,
                created_at        TEXT DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS similar_cases (
                id                  TEXT PRIMARY KEY,
                judgment_id         TEXT NOT NULL,
                similar_case_number TEXT,
                similar_case_title  TEXT,
                similarity_score    REAL,
                outcome             TEXT,
                compliance_days     INTEGER,
                warning_message     TEXT,
                created_at          TEXT DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS cascade_nodes (
                id          TEXT PRIMARY KEY,
                judgment_id TEXT NOT NULL,
                department  TEXT NOT NULL,
                action      TEXT NOT NULL,
                start_day   INTEGER,
                end_day     INTEGER,
                depends_on  TEXT,
                node_level  INTEGER DEFAULT 0
            );
        """)
        await db.commit()
    print("[JAIS v4.0] Database ready:", DB_PATH)
