import os
import tempfile
from pathlib import Path

from dotenv import load_dotenv
load_dotenv(Path(__file__).parent / ".env")

from fastapi import FastAPI, File, Form, HTTPException, UploadFile, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from extractor import extract_text
from quiz_generator import generate_quiz
from multiplayer import manager

app = FastAPI(title="Quiz AI", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all origins so Vercel and local tunnels can access it
    allow_methods=["*"],
    allow_headers=["*"],
)

ALLOWED_EXTENSIONS = {".pdf", ".pptx"}
MAX_FILE_SIZE_MB   = 20

@app.get("/health")
def health():
    return {"status": "ok"}


@app.websocket("/ws/host")
async def websocket_host(websocket: WebSocket):
    print("WebSocket connecting...")
    try:
        await websocket.accept()
        print("WebSocket accepted.")
    except Exception as e:
        print(f"Error accepting websocket: {e}")
        return
    try:
        data = await websocket.receive_json()
        if data.get("type") == "create":
            pin = manager.generate_pin()
            manager.rooms[pin] = {
                "host": websocket,
                "players": {},
                "quiz": data.get("quiz")
            }
            await websocket.send_json({"type": "created", "pin": pin})
            
            # Keep connection alive and listen for host commands
            while True:
                msg = await websocket.receive_json()
                if msg.get("type") == "start":
                    # Broadcast start and quiz to all players
                    quiz_data = manager.rooms[pin]["quiz"]
                    await manager.broadcast_to_players(pin, {
                        "type": "start",
                        "quiz": quiz_data
                    })
    except WebSocketDisconnect:
        # We need to find which room this host was running and close it
        for pin, room in list(manager.rooms.items()):
            if room["host"] == websocket:
                await manager.remove_host(pin)
                break

@app.websocket("/ws/join/{pin}/{name}")
async def websocket_join(websocket: WebSocket, pin: str, name: str):
    await websocket.accept()
    success = await manager.join_room(pin, name, websocket)
    if not success:
        await websocket.send_json({"type": "error", "message": "Room not found or game already started."})
        await websocket.close()
        return

    try:
        while True:
            data = await websocket.receive_json()
            if data.get("type") == "score_update":
                # Forward the score to the host
                room = manager.get_room(pin)
                if room and "host" in room:
                    try:
                        await room["host"].send_json({
                            "type": "score_update",
                            "name": name,
                            "score": data.get("score", 0)
                        })
                    except Exception:
                        pass
    except WebSocketDisconnect:
        await manager.remove_player(pin, name)


@app.post("/generate-quiz")
async def generate_quiz_endpoint(
    file: UploadFile = File(...),
    num_questions: int = Form(10),
):
    # ── 1. Validate file type ──────────────────────────────────────────────
    suffix = Path(file.filename).suffix.lower()
    if suffix not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{suffix}'. Please upload a .pdf or .pptx file.",
        )

    # ── 2. Read file bytes ─────────────────────────────────────────────────
    file_bytes = await file.read()
    size_mb = len(file_bytes) / (1024 * 1024)
    if size_mb > MAX_FILE_SIZE_MB:
        raise HTTPException(
            status_code=413,
            detail=f"File is {size_mb:.1f} MB. Maximum allowed size is {MAX_FILE_SIZE_MB} MB.",
        )

    # ── 3. Extract text ────────────────────────────────────────────────────
    try:
        text = extract_text(file_bytes, file.filename)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    # ── 4. Generate quiz ───────────────────────────────────────────────────
    try:
        quiz = generate_quiz(text, num_questions=num_questions)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))

    return quiz
