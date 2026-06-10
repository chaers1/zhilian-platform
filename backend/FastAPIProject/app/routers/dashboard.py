import io

import redis
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, date
from ..dependencies import get_db
from ..models import SsrOneMovies, CrawlerTask, User
from ..auth import get_current_user
from ..redis_config import get_redis_client
from sqlalchemy import func, distinct
from typing import Optional
import csv
from fastapi.responses import StreamingResponse
import asyncio

router = APIRouter()
# ========================================================= Pydantic 设定 ==============================================

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
    total_data = db.query(func.sum(CrawlerTask.items_count)).scalar() or 0

    # 今日新增
    today = datetime.now().date()
    today_new = db.query(func.sum(CrawlerTask.items_count)).filter(
        func.date(CrawlerTask.created_at) == today
    ).scalar() or 0

    # 日均抓取（最近30天）
    thirty_days_ago = datetime.now() - timedelta(days=30)
    total_30d = db.query(func.sum(CrawlerTask.items_count)).filter(
        CrawlerTask.created_at >= thirty_days_ago
    ).scalar() or 0
    avg_daily = total_30d // 30 if total_30d > 0 else 0

    # 成功率（最近30天）
    # 已完成任务
    success_tasks = db.query(CrawlerTask).filter(
        CrawlerTask.created_at >= thirty_days_ago,
        CrawlerTask.status == 'completed'
    ).count()

    # 失败的任务
    failed_tasks = db.query(CrawlerTask).filter(
        CrawlerTask.created_at >= thirty_days_ago,
        CrawlerTask.status == 'failed'
    ).count()
    # 总有效任务 = 成功 + 失败
    total_valid = success_tasks + failed_tasks

    # 成功率 = 成功 / (成功 + 失败)
    success_rate = round(success_tasks / total_valid * 100, 1) if total_valid > 0 else 0

    return {
        'data': {"total_data": total_data,
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
    """获取爬虫实时日志（需要登录）"""
    print(f"当前登录用户: {current_user.first_name} - {current_user.email}")

    try:
        redis_client = await get_redis_client()
        logs_key = f"spider:{spider_name}:logs"

        logs = await redis_client.lrange(logs_key, 0, limit - 1)

        # 直接返回日志数组
        return logs
    except Exception as e:
        return {"error": f"获取日志失败: {str(e)}"}

# 爬虫运行状态接口
@router.get("/{spider_name}/status")
async def spider_status(
        spider_name: str,
        current_user: User = Depends(get_current_user),
):
    """
    获取爬虫实时状态
    需要登录认证
    """
    print(f"当前登录用户: {current_user.first_name} - {current_user.email}")
    try:
        # 验证爬虫
        spider_names = ['movie', 'news', 'novel']
        if spider_name not in spider_names:
            raise HTTPException(status_code=404, detail="不支持的爬虫类型")

        # 链接redis
        redis_client = await get_redis_client()
        status_key = f"spider:{spider_name}:status"

        # 获取redis数据库
        status = await redis_client.hget(status_key, "status") or "stopped"
        start_time = await redis_client.hget(status_key, "start_time")

        current_count_raw = await redis_client.hget(status_key, "current_count")
        current_count = int(current_count_raw) if current_count_raw is not None else 0

        total_expected_raw = await redis_client.hget(status_key, "total_expected") or 0
        total_expected = int(total_expected_raw) if total_expected_raw is not None else 0

        # 数据拼接
        response_data = {
            "success": True,
            "code": 200,
            "message": "success",
            "data": {
                "spider_name": spider_name,
                "status": status,
                "start_time": start_time,
                "current_count": current_count,
                "total_expected": total_expected,
            }
        }
        return response_data

    except redis.exceptions.ConnectionError:
        raise HTTPException(status_code=503, detail="Redis 服务不可用")
    except asyncio.TimeoutError:
        raise HTTPException(status_code=504, detail="请求超时")
    except ValueError as e:
        raise HTTPException(status_code=422, detail=f"数据格式错误: {str(e)}")


# ================================================== 爬虫数据分析标签页面 ==============================================
@router.get('/{spiderType}/analysis')
async def get_spider_analysis(
        spiderType: str,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    today = date.today()
    tomorrow = today + timedelta(days=1)

    # 根据爬虫类型选择对应的表
    if spiderType == 'movie':
        data_table = SsrOneMovies
    else:
        raise HTTPException(status_code=400, detail="不支持的爬虫类型")

    # 总数据量
    total_items = db.query(func.count(data_table.id)).scalar() or 0

    # 今日新增
    today_items = db.query(func.count(data_table.id)).filter(
        data_table.created_at >= today,
        data_table.created_at < tomorrow
    ).scalar() or 0
    # 获取今日任务（用于计算今日运行时间）
    today_tasks = db.query(CrawlerTask).filter(
        CrawlerTask.spider_type == spiderType,
        CrawlerTask.user_id == current_user.id,
        CrawlerTask.created_at >= today,
        CrawlerTask.created_at < tomorrow
    )

    # 计算今日总时长（秒）
    today_seconds = 0
    for task in today_tasks:
        end_time = task.completed_time or task.stop_time
        if task.start_time and end_time:
            today_seconds += (end_time - task.start_time).total_seconds()

    # 今日抓取频率
    if today_seconds > 0:
        today_hours = today_seconds / 3600
        today_minutes = today_seconds / 60
        items_per_hour = today_items / today_hours
        items_per_minute = today_items / today_minutes
    else:
        items_per_hour = 0
        items_per_minute = 0

    # 成功率

    # 成功率（历史）
    tasks = db.query(CrawlerTask).filter(
        CrawlerTask.spider_type == spiderType,
        CrawlerTask.user_id == current_user.id
    )

    completed = tasks.filter(CrawlerTask.status == 'completed').count()
    failed = tasks.filter(CrawlerTask.status == 'failed').count()
    total_valid = completed + failed
    success_rate = round(completed / total_valid * 100, 1) if total_valid > 0 else 0

    return {
        "code": 200,
        "message": "success",
        "data": {
            "total_items": total_items,
            "today_items": today_items,
            "speed": f"{round(items_per_hour, 1)}条/h | {round(items_per_minute, 1)}条/m",
            "success_rate": success_rate,
        }

    }


# ================================================== 爬虫数据分析标签页面-折线图 ============================================
@router.get("/{spiderType}/trend")
def get_spider_trend(
        spiderType: str,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """获取仅七天抓取趋势
        return：返回仅七天抓取总量，七天抓取成功率，和每日明细
    """

    today = date.today()
    print(today)

    # 根据爬虫类型选择对应的表
    if spiderType == 'movie':
        data_table = SsrOneMovies
    else:
        raise HTTPException(status_code=400, detail="不支持的爬虫类型")

    trend = []  # 七天运行数据折线图数据容器

    for i in range(6, -1, -1):
        target_date = today - timedelta(days=i)
        next_date = target_date + timedelta(days=1)

        # 1. 每日抓取数量
        daily_total = db.query(func.count(data_table.id)).filter(
            data_table.created_at >= target_date,
            data_table.created_at < next_date
        ).scalar() or 0

        # 2. 每日总运行时间（秒）

        tasks = db.query(CrawlerTask).filter(
            CrawlerTask.spider_type == spiderType,
            CrawlerTask.created_at >= target_date,
            CrawlerTask.created_at < next_date
        )

        daily_seconds = 0
        for task in tasks:
            end_time = task.completed_time or task.stop_time
            if task.start_time and end_time:
                daily_seconds += (end_time - task.start_time).total_seconds()

        # 每日抓取频率（条/分钟）

        if daily_seconds > 0:
            daily_speed = daily_total / (daily_seconds / 60)
        else:
            daily_speed = 0

        # 3. 每日成功率
        completed = tasks.filter(CrawlerTask.status == 'completed').count()
        failed = tasks.filter(CrawlerTask.status == 'failed').count()
        total_valid = completed + failed
        daily_success_rate = round(completed / total_valid * 100, 1) if total_valid > 0 else 0

        trend.append({
            "date": target_date.strftime("%m/%d"),
            "total": daily_total,  # 每日总量
            "speed": round(daily_speed, 1),  # 每日抓取频率（条/分钟）
            "success_rate": daily_success_rate,  # 每日成功率（%）
        })

    return {
        "code": 200,
        "message": "success",
        "data": trend
    }


# ================================================== 电影爬虫数据显示页面-搜索框+条件筛选 =====================================

@router.get("/movie/data")
async def get_movie_data(
        keyword: str = Query(default="", description="搜索关键词"),
        categories_str: str = Query(default="", description="类型筛选"),
        region: str = Query(default="", description="地区筛选"),
        year: str = Query(default="", description="年份筛选"),
        rating: str = Query(default="", description="评分筛选"),
        db: Session = Depends(get_db),
):
    """获取电影数据（支持搜索和筛选）"""

    from datetime import datetime

    query = db.query(SsrOneMovies)

    try:
        # 关键词搜索
        if keyword:
            query = query.filter(SsrOneMovies.name.like(f"%{keyword}%"))

        # 类型筛选
        if categories_str and categories_str != "全部":
            query = query.filter(SsrOneMovies.categories_str.like(f"%{categories_str}%"))

        # 地区筛选
        if region and region != "全部":
            query = query.filter(SsrOneMovies.region.like(f"%{region}%"))

        # 年份筛选
        if year and year != "全部":
            if year == "2020年后":
                query = query.filter(SsrOneMovies.release_date >= datetime(2020, 1, 1))
            elif year == "2010-2020":
                query = query.filter(
                    SsrOneMovies.release_date >= datetime(2010, 1, 1),
                    SsrOneMovies.release_date < datetime(2020, 1, 1)
                )
            elif year == "2000-2010":
                query = query.filter(
                    SsrOneMovies.release_date >= datetime(2000, 1, 1),
                    SsrOneMovies.release_date < datetime(2010, 1, 1)
                )
            elif year == "2000年前":
                query = query.filter(SsrOneMovies.release_date < datetime(2000, 1, 1))

        # 评分筛选
        if rating and rating != "全部":
            if rating == "9分以上":
                query = query.filter(SsrOneMovies.score >= 9.0)
            elif rating == "8-9分":
                query = query.filter(SsrOneMovies.score >= 8.0, SsrOneMovies.score < 9.0)
            elif rating == "7-8分":
                query = query.filter(SsrOneMovies.score >= 7.0, SsrOneMovies.score < 8.0)
            elif rating == "7分以下":
                query = query.filter(SsrOneMovies.score < 7.0)

        # 获取数据
        items = query.all()

        # 数据转换
        data = []
        for item in items:
            data.append({
                "id": item.id,
                "movies_type": item.movies_type,
                "name": item.name,
                "categories_str": item.categories_str,
                "region": item.region,
                "duration": item.duration,
                "score": item.score,
                "release_date": item.release_date.strftime('%Y-%m-%d') if item.release_date else None,  # 添加这个字段
            })

        return {
            'code': 200,
            "message": "success",
            "data": data,
            "total": len(data)
        }

    except Exception as e:
        return {
            "code": 400,
            "message": str(e),
            "success": False,
            "data": None
        }


# ================================================== 筛选条件后端同步接口 =====================================
@router.get("/cascadefilters")
def cascadefilters(db: Session = Depends(get_db),
                   current_user: User = Depends(get_current_user)):
    """
    不需要请求参数
    点击数据查看页面就会自动get请求，需要返回数据的类型
    电影数据返回
        data{
            ‘mover’：[
               categories_str.region
            ]
        }
    """

    # 1. 获取所有分类（categories_str 是逗号分隔的字符串)后拆分并去重
    try:
        all_categories = db.query(SsrOneMovies.categories_str).filter(
            SsrOneMovies.categories_str.isnot(None),
            SsrOneMovies.categories_str != ''
        ).all()

        # 拆分分类字符串，收集所有唯一分类
        categories_set = set()
        categories_set.add('全部')

        for row in all_categories:

            if row[0]:
                cats = row[0].split(',')
                for cat in cats:
                    cat = cat.strip()

                    if cat:
                        categories_set.add(cat)

        # 2. 获取所有地区
        regions = db.query(distinct(SsrOneMovies.region)).filter(
            SsrOneMovies.region.isnot(None),
            SsrOneMovies.region != '未知'
        ).all()

        # 拆分自取字符串，收集唯一国家
        regions_set = set()
        regions_set.add('全部')
        for row in regions:
            if row[0]:
                region_str = row[0]

                for sep in ['、', ',，', '，']:
                    region_str = region_str.replace(sep, ',')

                # 按逗号拆分

                countries = region_str.split(',')
                for country in countries:
                    country = country.strip()
                    if country:
                        regions_set.add(country)

        datas = {
            'movie': [
                {
                    'key': 'categories_str',
                    'label': '类型',
                    'options': list(categories_set)
                },
                {
                    'key': 'region',
                    'label': '拍摄国家',
                    'options': regions_set
                }
            ]
        }

        return {
            "code": 200,
            "message": "success",
            "data": datas
        }


    # 数据库查询和处理
    except Exception as e:  # 或者 except HTTPException as e
        return {
            "code": 400,
            "message": str(e),
            "success": False,
            "data": None
        }


# ================================================== 数据详情接口 =====================================

@router.get("/detail")
async def get_data_detail(
        type: str = Query(..., description="数据类型：movie, news, novel"),
        id: Optional[int] = Query(None, description="数据ID"),
        name: Optional[str] = Query("", description="数据名称"),
        db: Session = Depends(get_db),
):
    """ 查看数据详情接口，同时服务多种数据 根据type 进行判断
        返回：详情，数据地址链接，抓取时间
    """

    if type == "movie":
        try:
            query = db.query(SsrOneMovies)

            if id:
                query = query.filter(SsrOneMovies.id == id)
            elif name:
                query = query.filter(SsrOneMovies.name == name)
            else:
                return {
                    "code": 400,
                    "message": "请提供 id 或 name 参数",
                    "success": False,
                    "data": None
                }

            # 获取数据

            item = query.first()

            if not item:
                return {
                    "code": 404,
                    "message": f"未找到 {type} 数据",
                    "success": False,
                    "data": None
                }

            # 返回三个字段

            data = {
                "drama": item.drama,
                "url": item.url,
                "created_at": item.created_at.isoformat() if item.created_at else None,
            }

            return {
                "code": 200,
                "message": "success",
                "success": True,
                "data": data
            }

        except Exception as e:
            return {
                "code": 400,
                "message": str(e),
                "success": False,
                "data": None
            }

    # news 和 novel 类型暂未实现
    else:
        return {
            "code": 404,
            "message": f"{type} 详情接口暂未实现",
            "success": False,
            "data": None
        }


@router.post("/exportcsv")
async def export_csv(
        request: Request,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """导出数据为 CSV"""

    try:
        body = await request.json()
    except:
        raise HTTPException(status_code=400, detail="请求体不是有效的 JSON")

    # 获取参数

    spider_type = body.get('type')
    keyword = body.get('keyword', '')  # 搜索关键词
    filters = body.get('cascadeFilters', {})
    print(f"导出参数: type={spider_type}, keyword={keyword}, filters={filters}")

    # 验证 spider_type
    y_type = ['movie', 'news', 'novel']
    if spider_type not in y_type:
        raise HTTPException(status_code=400, detail="spider_type 必须是 movie、news 或 novel")

    # 根据类型选择表和文件名
    if spider_type == 'movie':
        table = SsrOneMovies
        filename = "movie_data.csv"
        headers = ['ID', '类型', '名称', '分类', '地区', '时长', '评分', '剧情简介', '抓取时间']

    elif spider_type == 'news':
        # table = News
        filename = "news_data.csv"
        headers = ['ID', '标题', '作者', '来源', '发布时间', '内容']
    else:
        # table = Novel
        filename = "novel_data.csv"
        headers = ['ID', '书名', '作者', '分类', '状态', '字数', '简介']

    # 数据查询
    query = db.query(table)

    # 根据 keyword 过滤
    if keyword:
        query = query.filter(table.name.like(f"%{keyword}%"))

    # 根据 filters 过滤
    if spider_type == 'movie':
        # 年份筛选
        if filters.get('year') and filters['year'] != '全部':
            from datetime import date
            year = filters['year']
            if year == '2020年后':
                query = query.filter(SsrOneMovies.release_date >= date(2020, 1, 1))
            elif year == '2010-2020':
                query = query.filter(SsrOneMovies.release_date >= date(2010, 1, 1),
                                     SsrOneMovies.release_date <= date(2019, 12, 31))
            elif year == '2000-2010':
                query = query.filter(SsrOneMovies.release_date >= date(2000, 1, 1),
                                     SsrOneMovies.release_date <= date(2009, 12, 31))
            elif year == '2000年前':
                query = query.filter(SsrOneMovies.release_date < date(2000, 1, 1))

        # 地区筛选
        if filters.get('region') and filters['region'] != '全部':
            query = query.filter(SsrOneMovies.region == filters['region'])

    # 查询全部数据（不分页）
    items = query.all()  # 直接查全部，不用分页

    # 创建csv
    output = io.StringIO()
    writer = csv.writer(output)

    # 写入表头
    writer.writerow(headers)

    # 写入数据
    for item in items:
        if spider_type == "movie":
            writer.writerow([
                item.id,
                item.movies_type,
                item.name,
                item.categories_str,
                item.region,
                item.duration,
                item.score,
                (item.drama[:200] + "..." if len(item.drama) > 200 else item.drama) if item.drama else '',
                item.created_at.strftime('%Y-%m-%d %H:%M:%S') if item.created_at else ''
            ])
            # 后期写入其他数据

    # 8. 返回 CSV 文件
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue().encode('utf-8-sig')]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
