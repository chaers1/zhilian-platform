from pydantic_settings import BaseSettings
from pydantic import Field
from typing import List

def get_cors_origins() -> List[str]:
    return [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://192.168.0.120:5173",
    ]

class Settings(BaseSettings):
    """应用配置"""
    
    # 应用基本信息
    APP_NAME: str = "爬虫管理系统API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    
    # JWT 配置
    SECRET_KEY: str = "django-insecure-vwtkcb-81v(9=())-12u6@^9&teke_1+m8i@fx*o_36t_*a%h+"
    ALGORITHM: str = "HS256"
    
    # 数据库配置
    DATABASE_URL: str = "mysql+pymysql://root:qazwsx%40123@localhost:3306/dingban_backend"
    
    # Redis 配置（后续使用）
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0
    
    # 跨域配置
    CORS_ORIGINS: List[str] = Field(default_factory=get_cors_origins)
    class Config:
        env_file = ".env"  # ✅ 拼写正确
        env_file_encoding = "utf-8"
        case_sensitive = True

settings = Settings()
