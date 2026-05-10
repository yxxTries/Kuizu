import sqlite3
import re
from datetime import UTC, datetime
from threading import Lock
from typing import Any

from core.config import DB_PATH

_DB_LOCK = Lock()
USERNAME_PATTERN = re.compile(r"^[A-Za-z0-9_]{3,24}$")


def _generate_unique_username(email: str, existing_usernames: set[str]) -> str:
    local_part = email.split("@", 1)[0]
    normalized = re.sub(r"[^A-Za-z0-9_]", "", local_part)
    base = (normalized or "quizuser")[:24]
    if len(base) < 3:
        base = f"{base}user"[:24]

    candidate = base
    suffix = 1
    while candidate.lower() in existing_usernames:
        suffix_text = str(suffix)
        trimmed = base[: max(3, 24 - len(suffix_text))]
        candidate = f"{trimmed}{suffix_text}"
        suffix += 1
    return candidate


def _ensure_username_column(conn: sqlite3.Connection) -> None:
    conn.row_factory = sqlite3.Row
    columns = {
        row["name"]
        for row in conn.execute("PRAGMA table_info(users)").fetchall()
    }

    if "username" not in columns:
        conn.execute("ALTER TABLE users ADD COLUMN username TEXT")

    if "auto_reveal" not in columns:
        conn.execute("ALTER TABLE users ADD COLUMN auto_reveal INTEGER NOT NULL DEFAULT 1")

    existing_rows = conn.execute(
        "SELECT username FROM users WHERE username IS NOT NULL AND TRIM(username) <> ''"
    ).fetchall()
    existing_usernames = {str(row["username"]).lower() for row in existing_rows}

    rows_missing_username = conn.execute(
        "SELECT id, email FROM users WHERE username IS NULL OR TRIM(username) = ''"
    ).fetchall()
    for row in rows_missing_username:
        username = _generate_unique_username(str(row["email"]), existing_usernames)
        conn.execute("UPDATE users SET username = ? WHERE id = ?", (username, row["id"]))
        existing_usernames.add(username.lower())

    conn.execute(
        "CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_unique ON users(username COLLATE NOCASE)"
    )


def _ensure_share_code_column(conn: sqlite3.Connection) -> None:
    for table in ("games", "discover_posts"):
        try:
            conn.execute(f"ALTER TABLE {table} ADD COLUMN share_code TEXT")
        except sqlite3.OperationalError:
            pass

    conn.execute(
        "CREATE UNIQUE INDEX IF NOT EXISTS idx_games_share_code ON games(share_code) WHERE share_code IS NOT NULL"
    )
    conn.execute(
        "CREATE UNIQUE INDEX IF NOT EXISTS idx_discover_posts_share_code ON discover_posts(share_code) WHERE share_code IS NOT NULL"
    )

    _backfill_share_codes(conn)


def _backfill_share_codes(conn: sqlite3.Connection) -> None:
    for table in ("games", "discover_posts"):
        rows = conn.execute(
            f"SELECT id FROM {table} WHERE share_code IS NULL"
        ).fetchall()
        for row in rows:
            code = _generate_share_code(conn)
            conn.execute(
                f"UPDATE {table} SET share_code = ? WHERE id = ?",
                (code, row["id"]),
            )


def _generate_share_code(conn: sqlite3.Connection) -> str:
    import secrets
    alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"
    for _ in range(20):
        code = "".join(secrets.choice(alphabet) for _ in range(8))
        exists = conn.execute(
            "SELECT 1 FROM games WHERE share_code = ? UNION ALL SELECT 1 FROM discover_posts WHERE share_code = ? LIMIT 1",
            (code, code),
        ).fetchone()
        if not exists:
            return code
    raise RuntimeError("Failed to generate unique share code after 20 attempts")


def _seed_discover_posts(conn: sqlite3.Connection) -> None:
    existing = conn.execute(
        "SELECT COUNT(*) AS c FROM discover_posts WHERE title = ? AND user_id = 1",
        ("Human Anatomy 101",),
    ).fetchone()
    if existing and existing["c"] > 0:
        return

    import json
    import hashlib
    from datetime import UTC, datetime

    question_pool = [
        {"question": "What year did the Berlin Wall fall?", "choices": ["1987","1988","1989","1990"], "correct_index": 2},
        {"question": "Which planet is closest to the Sun?", "choices": ["Venus","Earth","Mercury","Mars"], "correct_index": 2},
        {"question": "What is the capital of Japan?", "choices": ["Seoul","Beijing","Bangkok","Tokyo"], "correct_index": 3},
        {"question": "How many continents are there?", "choices": ["5","6","7","8"], "correct_index": 2},
        {"question": "Which element has symbol 'O'?", "choices": ["Osmium","Oxygen","Gold","Oganesson"], "correct_index": 1},
        {"question": "Who painted the Mona Lisa?", "choices": ["Michelangelo","Raphael","Donatello","Leonardo da Vinci"], "correct_index": 3},
        {"question": "What is the speed of light (~km/s)?", "choices": ["150,000","300,000","450,000","600,000"], "correct_index": 1},
        {"question": "Which ocean is largest?", "choices": ["Atlantic","Indian","Arctic","Pacific"], "correct_index": 3},
        {"question": "How many hearts does an octopus have?", "choices": ["1","2","3","4"], "correct_index": 2},
        {"question": "What does HTTP stand for?", "choices": ["HyperText Transfer Protocol","High Tech Transfer Platform","Hyper Transfer Text Protocol","Home Tool Transfer Page"], "correct_index": 0},
        {"question": "Which vitamin is produced by sunlight?", "choices": ["Vitamin A","Vitamin B","Vitamin C","Vitamin D"], "correct_index": 3},
        {"question": "What year did WWII end?", "choices": ["1943","1944","1945","1946"], "correct_index": 2},
        {"question": "Currency of the UK?", "choices": ["Euro","Dollar","Pound Sterling","Yen"], "correct_index": 2},
        {"question": "Hardest natural substance?", "choices": ["Quartz","Topaz","Diamond","Corundum"], "correct_index": 2},
        {"question": "What gas is most in Earth's atmosphere?", "choices": ["Oxygen","Hydrogen","Nitrogen","CO2"], "correct_index": 2},
        {"question": "Largest planet in solar system?", "choices": ["Earth","Jupiter","Saturn","Mars"], "correct_index": 1},
        {"question": "Capital of France?", "choices": ["London","Berlin","Paris","Madrid"], "correct_index": 2},
        {"question": "Language with most native speakers?", "choices": ["English","Spanish","Mandarin Chinese","Hindi"], "correct_index": 2},
        {"question": "Boiling point of water (°C)?", "choices": ["90","100","110","120"], "correct_index": 1},
        {"question": "Smallest bone in human body?", "choices": ["Femur","Stapes","Radius","Phalanx"], "correct_index": 1},
    ]

    seeds = [
        {"title": "The Solar System", "category": "Science", "difficulty": "Easy", "estimated_time": "8 min", "questionCount": 8, "timer": 15},
        {"title": "Human Anatomy 101", "category": "Science", "difficulty": "Medium", "estimated_time": "12 min", "questionCount": 12, "timer": 20},
        {"title": "World War II", "category": "History", "difficulty": "Medium", "estimated_time": "10 min", "questionCount": 10, "timer": 20},
        {"title": "Ancient Civilizations", "category": "History", "difficulty": "Hard", "estimated_time": "15 min", "questionCount": 15, "timer": 25},
        {"title": "Algebra Fundamentals", "category": "Math", "difficulty": "Medium", "estimated_time": "10 min", "questionCount": 10, "timer": 20},
        {"title": "Calculus Concepts", "category": "Math", "difficulty": "Hard", "estimated_time": "8 min", "questionCount": 8, "timer": 30},
        {"title": "Gaming Trivia", "category": "Gaming", "difficulty": "Easy", "estimated_time": "15 min", "questionCount": 15, "timer": 10},
        {"title": "Retro Games", "category": "Gaming", "difficulty": "Medium", "estimated_time": "10 min", "questionCount": 10, "timer": 15},
        {"title": "Spanish Vocabulary", "category": "Language", "difficulty": "Easy", "estimated_time": "20 min", "questionCount": 20, "timer": 15},
        {"title": "French Phrases", "category": "Language", "difficulty": "Medium", "estimated_time": "12 min", "questionCount": 12, "timer": 15},
        {"title": "Marketing 101", "category": "Business", "difficulty": "Medium", "estimated_time": "10 min", "questionCount": 10, "timer": 20},
        {"title": "Startup Basics", "category": "Business", "difficulty": "Easy", "estimated_time": "8 min", "questionCount": 8, "timer": 15},
        {"title": "General Knowledge", "category": "General", "difficulty": "Easy", "estimated_time": "15 min", "questionCount": 15, "timer": 15},
        {"title": "Fun Facts", "category": "General", "difficulty": "Easy", "estimated_time": "10 min", "questionCount": 10, "timer": 10},
        {"title": "Philosophy Basics", "category": "Other", "difficulty": "Hard", "estimated_time": "10 min", "questionCount": 10, "timer": 25},
    ]

    now = datetime.now(UTC).isoformat()

    for seed in seeds:
        h = abs(hash(seed["title"])) % 100000
        shuffled = list(question_pool)
        import random
        rng = random.Random(h)
        rng.shuffle(shuffled)
        questions = shuffled[:seed["questionCount"]]

        quiz = {
            "questions": questions,
            "timeControl": {"enabled": True, "mode": "per_question", "secondsPerQuestion": seed["timer"]},
            "discoverMeta": {
                "title": seed["title"],
                "author": "Made By Kuizu",
                "category": seed["category"],
                "difficulty": seed["difficulty"],
                "plays": rng.randint(1, 15),
                "estimatedTime": seed["estimated_time"],
                "questionCount": seed["questionCount"],
                "rating": round(rng.uniform(3, 5), 1),
            },
        }

        code = _generate_share_code(conn)
        conn.execute(
            """INSERT INTO discover_posts (
                user_id, title, category, quiz_json, questions_count,
                plays, rating, difficulty, estimated_time, share_code,
                created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                1,
                seed["title"],
                seed["category"],
                json.dumps(quiz),
                seed["questionCount"],
                quiz["discoverMeta"]["plays"],
                quiz["discoverMeta"]["rating"],
                seed["difficulty"],
                seed["estimated_time"],
                code,
                now,
                now,
            ),
        )


def init_user_db() -> None:
    with _DB_LOCK:
        conn = sqlite3.connect(DB_PATH)
        try:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    email TEXT UNIQUE NOT NULL,
                    username TEXT,
                    password_hash TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    reset_token_hash TEXT,
                    reset_token_expires_at TEXT
                )
                """
            )
            _ensure_username_column(conn)
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS games (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    title TEXT NOT NULL,
                    category TEXT NOT NULL,
                    quiz_json TEXT NOT NULL,
                    questions_count INTEGER NOT NULL,
                    plays INTEGER NOT NULL DEFAULT 0,
                    pinned INTEGER NOT NULL DEFAULT 0,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    FOREIGN KEY (user_id) REFERENCES users(id)
                )
                """
            )
            conn.execute("CREATE INDEX IF NOT EXISTS idx_games_user_id ON games(user_id)")
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS discover_posts (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    title TEXT NOT NULL,
                    category TEXT NOT NULL,
                    quiz_json TEXT NOT NULL,
                    questions_count INTEGER NOT NULL,
                    plays INTEGER NOT NULL DEFAULT 0,
                    rating REAL NOT NULL DEFAULT 0,
                    difficulty TEXT NOT NULL DEFAULT 'Medium',
                    estimated_time TEXT NOT NULL DEFAULT '5 min',
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    FOREIGN KEY (user_id) REFERENCES users(id)
                )
                """
            )
            conn.execute("CREATE INDEX IF NOT EXISTS idx_discover_posts_created_at ON discover_posts(created_at DESC)")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_discover_posts_category ON discover_posts(category)")
            _ensure_share_code_column(conn)
            _seed_discover_posts(conn)
            conn.commit()
        finally:
            conn.close()


def create_user(email: str, password_hash: str) -> dict[str, Any]:
    now = datetime.now(UTC).isoformat()
    with _DB_LOCK:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        try:
            existing_rows = conn.execute(
                "SELECT username FROM users WHERE username IS NOT NULL AND TRIM(username) <> ''"
            ).fetchall()
            existing_usernames = {str(row["username"]).lower() for row in existing_rows}
            username = _generate_unique_username(email, existing_usernames)
            cursor = conn.execute(
                "INSERT INTO users (email, username, password_hash, created_at) VALUES (?, ?, ?, ?)",
                (email.lower(), username, password_hash, now),
            )
            conn.commit()
            user_id = cursor.lastrowid
            row = conn.execute("SELECT id, email, username FROM users WHERE id = ?", (user_id,)).fetchone()
            if row is None:
                raise RuntimeError("User insert failed.")
            return dict(row)
        finally:
            conn.close()


def get_user_by_email(email: str) -> dict[str, Any] | None:
    with _DB_LOCK:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        try:
            row = conn.execute(
                """
                SELECT id, email, username, password_hash, reset_token_hash, reset_token_expires_at
                FROM users
                WHERE email = ?
                """,
                (email.lower(),),
            ).fetchone()
            return dict(row) if row else None
        finally:
            conn.close()


def get_user_by_id(user_id: int) -> dict[str, Any] | None:
    with _DB_LOCK:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        try:
            row = conn.execute("SELECT id, email, username, auto_reveal FROM users WHERE id = ?", (user_id,)).fetchone()
            return dict(row) if row else None
        finally:
            conn.close()


def get_user_preferences(user_id: int) -> dict[str, Any] | None:
    with _DB_LOCK:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        try:
            row = conn.execute("SELECT auto_reveal FROM users WHERE id = ?", (user_id,)).fetchone()
            if row is None:
                return None
            return {"auto_reveal": bool(row["auto_reveal"])}
        finally:
            conn.close()


def update_user_preferences(user_id: int, auto_reveal: bool) -> dict[str, Any]:
    with _DB_LOCK:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        try:
            conn.execute(
                "UPDATE users SET auto_reveal = ? WHERE id = ?",
                (1 if auto_reveal else 0, user_id),
            )
            conn.commit()
            row = conn.execute("SELECT auto_reveal FROM users WHERE id = ?", (user_id,)).fetchone()
            if row is None:
                raise RuntimeError("User not found.")
            return {"auto_reveal": bool(row["auto_reveal"])}
        finally:
            conn.close()


def get_user_auth_by_id(user_id: int) -> dict[str, Any] | None:
    with _DB_LOCK:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        try:
            row = conn.execute(
                """
                SELECT id, email, username, password_hash, reset_token_hash, reset_token_expires_at
                FROM users
                WHERE id = ?
                """,
                (user_id,),
            ).fetchone()
            return dict(row) if row else None
        finally:
            conn.close()


def save_password_reset_token(email: str, token_hash: str, expires_at: datetime) -> None:
    with _DB_LOCK:
        conn = sqlite3.connect(DB_PATH)
        try:
            conn.execute(
                """
                UPDATE users
                SET reset_token_hash = ?, reset_token_expires_at = ?
                WHERE email = ?
                """,
                (token_hash, expires_at.isoformat(), email.lower()),
            )
            conn.commit()
        finally:
            conn.close()


def get_user_by_reset_token_hash(token_hash: str) -> dict[str, Any] | None:
    with _DB_LOCK:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        try:
            row = conn.execute(
                """
                SELECT id, email, username, reset_token_hash, reset_token_expires_at
                FROM users
                WHERE reset_token_hash = ?
                """,
                (token_hash,),
            ).fetchone()
            return dict(row) if row else None
        finally:
            conn.close()


def update_user_profile(user_id: int, email: str, username: str) -> dict[str, Any]:
    normalized_email = email.lower().strip()
    normalized_username = username.strip()
    if not USERNAME_PATTERN.fullmatch(normalized_username):
        raise ValueError("Username must be 3-24 characters and use only letters, numbers, or underscores.")

    with _DB_LOCK:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        try:
            email_conflict = conn.execute(
                "SELECT id FROM users WHERE email = ? AND id != ?",
                (normalized_email, user_id),
            ).fetchone()
            if email_conflict is not None:
                raise ValueError("An account with this email already exists.")

            username_conflict = conn.execute(
                "SELECT id FROM users WHERE username = ? COLLATE NOCASE AND id != ?",
                (normalized_username, user_id),
            ).fetchone()
            if username_conflict is not None:
                raise ValueError("That username is already taken.")

            conn.execute(
                """
                UPDATE users
                SET email = ?, username = ?
                WHERE id = ?
                """,
                (normalized_email, normalized_username, user_id),
            )
            conn.commit()

            row = conn.execute("SELECT id, email, username FROM users WHERE id = ?", (user_id,)).fetchone()
            if row is None:
                raise RuntimeError("Failed to load updated user.")
            return dict(row)
        finally:
            conn.close()


def update_user_password(user_id: int, password_hash: str) -> None:
    with _DB_LOCK:
        conn = sqlite3.connect(DB_PATH)
        try:
            conn.execute(
                """
                UPDATE users
                SET password_hash = ?, reset_token_hash = NULL, reset_token_expires_at = NULL
                WHERE id = ?
                """,
                (password_hash, user_id),
            )
            conn.commit()
        finally:
            conn.close()
