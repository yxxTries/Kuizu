from fastapi import APIRouter

from controllers import shared_controller
from schemas.game import SharedQuizResponse

router = APIRouter(prefix="/shared", tags=["shared"])


@router.get("/{code}", response_model=SharedQuizResponse)
def get_shared_quiz(code: str):
    return shared_controller.lookup_shared_quiz(code)
