"""Generate quiz questions from slide chunks using Claude."""
import asyncio
import json
import anthropic
from app.models import SlideChunk, QuizQuestion
from app.core.config import settings

PROMPT = """\
You are a quiz author. Given the slide content below, generate one quiz question.

Rules:
- Base the question ONLY on the provided content
- The correct answer must be explicitly supported by the content
- Generate exactly 3 distractors that are plausible but clearly wrong
- Keep all answer choices similar in length and style
- Rate difficulty: 1 (recall), 2 (understanding), 3 (application/inference)

Respond with JSON ONLY — no markdown, no explanation:
{{"question": "...", "correct_answer": "...", "distractors": ["...", "...", "..."], "difficulty": 1}}

--- SLIDE {num}: {title} ---
{content}
"""

client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

async def generate_question(chunk: SlideChunk) -> QuizQuestion | None:
    prompt = PROMPT.format(
        num=chunk.slide_number,
        title=chunk.title,
        content=chunk.content[:1500],
    )
    try:
        response = await asyncio.to_thread(
            client.messages.create,
            model="claude-sonnet-4-20250514",
            max_tokens=400,
            messages=[{"role": "user", "content": prompt}],
        )
        data = json.loads(response.content[0].text)
        return QuizQuestion(slide_number=chunk.slide_number, **data)
    except Exception:
        return None

async def generate_quiz(chunks: list[SlideChunk]) -> list[QuizQuestion]:
    tasks = [generate_question(c) for c in chunks]
    results = await asyncio.gather(*tasks)
    return [q for q in results if q is not None]
