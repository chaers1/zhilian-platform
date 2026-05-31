from pydantic_settings import BaseSettings
from pydantic import Field
from typing import List, Optional
import os


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

    # 数据库配置（支持环境变量）
    DB_HOST: str = Field(default=os.getenv('DB_HOST', 'localhost'))
    DB_PORT: int = Field(default=int(os.getenv('DB_PORT', 3306)))
    DB_USER: str = Field(default=os.getenv('DB_USER', 'root'))
    DB_PASSWORD: str = Field(default=os.getenv('DB_PASSWORD', 'qazwsx@123'))
    DB_NAME: str = Field(default=os.getenv('DB_NAME', 'dingban_backend'))

    # Redis 配置
    REDIS_HOST: str = Field(default=os.getenv('REDIS_HOST', 'localhost'))
    REDIS_PORT: int = Field(default=int(os.getenv('REDIS_PORT', 6379)))
    REDIS_DB: int = Field(default=int(os.getenv('REDIS_DB', 0)))
    REDIS_PASSWORD: Optional[str] = Field(default=os.getenv('REDIS_PASSWORD'))

    # 跨域配置
    CORS_ORIGINS: List[str] = Field(default_factory=get_cors_origins)

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": True,
        "extra": "ignore",
    }

    @property
    def DATABASE_URL(self) -> str:
        """获取数据库连接 URL"""
        import urllib.parse
        encoded_password = urllib.parse.quote_plus(self.DB_PASSWORD)
        return f"mysql+pymysql://{self.DB_USER}:{encoded_password}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"


settings = Settings()
