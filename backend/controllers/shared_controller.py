import json

from fastapi import HTTPException

from schemas.game import SharedQuizResponse
from services.game_service import _DB_LOCK, _connect


def lookup_shared_quiz(code: str) -> SharedQuizResponse:
    with _DB_LOCK:
        conn = _connect()
        try:
            row = conn.execute(
                "SELECT g.title, g.category, g.questions_count, g.share_code, g.quiz_json, u.username AS author FROM games g JOIN users u ON u.id = g.user_id WHERE g.share_code = ?",
                (code.upper().strip(),),
            ).fetchone()
            if row:
                quiz = json.loads(row["quiz_json"])
                quiz.pop("discoverMeta", None)
                return SharedQuizResponse(
                    title=row["title"],
                    category=row["category"],
                    author=row["author"],
                    questions_count=row["questions_count"],
                    share_code=row["share_code"],
                    quiz=quiz,
                )

            row = conn.execute(
                "SELECT dp.title, dp.category, dp.questions_count, dp.share_code, dp.quiz_json, u.username AS author FROM discover_posts dp JOIN users u ON u.id = dp.user_id WHERE dp.share_code = ?",
                (code.upper().strip(),),
            ).fetchone()
            if row:
                quiz = json.loads(row["quiz_json"])
                quiz.pop("discoverMeta", None)
                return SharedQuizResponse(
                    title=row["title"],
                    category=row["category"],
                    author=row["author"],
                    questions_count=row["questions_count"],
                    share_code=row["share_code"],
                    quiz=quiz,
                )

            raise HTTPException(status_code=404, detail="Quiz not found with that share code.")
        finally:
            conn.close()
