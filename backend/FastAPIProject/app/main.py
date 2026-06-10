import json
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import dashboard
from .dependencies import engine, Base
from .config import settings
import os
# 创建数据库表
Base.metadata.create_all(bind=engine)

# 创建 FastAPI 应用，使用配置
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    debug=settings.DEBUG
)

# CORS 跨域配置 - 从环境变量读取
origins_json = os.getenv("BACKEND_CORS_ORIGINS", '["http://localhost:5173", "http://127.0.0.1:5173"]')
try:
    origins = json.loads(origins_json)
except Exception as e:
    print(f"CORS origins parse error: {e}, using default")
    origins = ["http://localhost:5173"]

# CORS 跨域配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # 或者开发环境用 ["*"]
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)
# 注册路由
# =============================== 爬虫功能路由 ============================================================
app.include_router(dashboard.router, prefix="/api/crawler/dashboard", tags=["Dashboard"])

@app.get("/")
async def root():
    return {
        "message": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running"
    }

@app.get("/health")
async def health():
    return {"status": "ok"}

# 添加 OPTIONS 预检请求处理
@app.options("/{rest_of_path:path}")
async def options_handler():
    return {}