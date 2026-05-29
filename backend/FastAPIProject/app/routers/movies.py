from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..dependencies import get_db
from ..models import SsrOneMovies

router = APIRouter()

@router.get("/list")
async def get_movies(db: Session = Depends(get_db)):
    movies = db.query(SsrOneMovies).limit(20).all()
    return {"movies": [{"id": m.id, "name": m.name} for m in movies]}
