'''
电影数据表，爬虫任务表
'''

from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, Float
from sqlalchemy.sql import func
from .dependencies import Base


class SsrOneMovies(Base):
    """电影数据表"""
    __tablename__ = "ssr_one_movies"

    id = Column(Integer, primary_key=True, index=True)
    movies_type = Column(String(120))
    name = Column(String(200))
    categories_str = Column(String(500))
    region = Column(String(100))
    duration = Column(String(100))
    score = Column(Float)
    drama = Column(Text)
    url = Column(String(500))
    created_at = Column(DateTime, server_default=func.now())


class CrawlerTask(Base):
    """爬虫任务表"""
    __tablename__ = "crawler_task"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer)
    user_name = Column(String(50))
    email = Column(String(254))
    spider_type = Column(String(50))
    source = Column(String(100))
    action = Column(String(10))
    created_at = Column(DateTime, server_default=func.now())
    error_msg = Column(Text, nullable=True)
    is_success = Column(Boolean, default=True)


class User(Base):
    """用户表"""
    __tablename__ = "users_user"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String(50), nullable=False)
    email = Column(String(254), unique=True, nullable=False)
    phone = Column(String(11), unique=True, nullable=False)
    password = Column(String(255), nullable=False)

    # 新增字段
    department = Column(String(100), nullable=True)
    bio = Column(Text, nullable=True)
    avatar = Column(String(255), nullable=True)

    # 时间字段
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())