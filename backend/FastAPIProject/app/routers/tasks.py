from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..dependencies import get_db
from ..models import CrawlerTask

router = APIRouter()

@router.get("/history")
async def get_task_history(db: Session = Depends(get_db)):
    tasks = db.query(CrawlerTask).order_by(CrawlerTask.created_at.desc()).limit(20).all()
    return {"tasks": [{"id": t.id, "user_name": t.user_name, "action": t.action} for t in tasks]}
