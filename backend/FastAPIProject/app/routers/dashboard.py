from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from ..dependencies import get_db
from ..models import SsrOneMovies, CrawlerTask, User
from ..auth import get_current_user
from ..redis_config import get_redis_client

router = APIRouter()

# ==================================== 总体概览接口页面 ================================================================
@router.get("/stats")
async def get_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)  # ✅ 获取当前用户
):
    """Dashboard 统计数据（需要登录）"""
    
    # 可以使用当前用户信息
    print(f"当前登录用户: {current_user.first_name} - {current_user.email}")
    
    # 总数据量
    total_data = db.query(func.count(SsrOneMovies.id)).scalar() or 0
    
    # 今日新增
    today = datetime.now().date()
    today_new = db.query(func.count(SsrOneMovies.id)).filter(
        today == func.date(SsrOneMovies.created_at)
    ).scalar() or 0
    
    # 日均抓取（最近30天）
    thirty_days_ago = datetime.now() - timedelta(days=30)
    total_30d = db.query(func.count(SsrOneMovies.id)).filter(
        SsrOneMovies.created_at >= thirty_days_ago
    ).scalar() or 0
    avg_daily = total_30d // 30 if total_30d > 0 else 0
    
    # 成功率（最近30天）
    tasks = db.query(CrawlerTask).filter(
        CrawlerTask.created_at >= thirty_days_ago,
        CrawlerTask.action == 'start'
    )
    total_tasks = tasks.count()
    success_tasks = tasks.filter(CrawlerTask.is_success == 1).count()
    success_rate = round(success_tasks / total_tasks * 100, 1) if total_tasks > 0 else 0
    
    return {
       'data':{ "total_data": total_data,
        "today_new": today_new,
        "avg_daily": avg_daily,
        "success_rate": success_rate,
        }
    }


# ================================================== 爬虫运行页面接口 ====================================================


@router.get("/{spider_name}/logs")
async def get_spider_logs(
        spider_name: str,
        limit: int = 50,
        current_user: User = Depends(get_current_user)
):

    print(f"当前登录用户: {current_user.first_name} - {current_user.email}")

    """获取爬虫实时日志（需要登录）"""
    redis_client = get_redis_client()

    logs_key = f"spider:{spider_name}:logs"
    logs = redis_client.lrange(logs_key, 0, limit - 1)

    # 直接返回日志数组，不包装
    return logs





