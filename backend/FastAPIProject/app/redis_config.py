'''

app/redis_config.py
redis链接配置

'''

import redis.asyncio as redis
from typing import Optional
from .config import settings

_redis_client: Optional[redis.Redis] = None


async def get_redis_client() -> redis.Redis:
    """
    获取异步 Redis 客户端实例（单例模式）
    """
    global _redis_client
    if _redis_client is None:
        _redis_client = await redis.from_url(
            f"redis://{settings.REDIS_HOST}:{settings.REDIS_PORT}/{settings.REDIS_DB}",
            decode_responses=True,  # 自动解码为字符串
            max_connections=10,  # 连接池大小
            socket_timeout=5,  # 超时时间
            socket_connect_timeout=5
        )
        # 测试连接
        await _redis_client.ping()
        print(f"Redis 连接成功: {settings.REDIS_HOST}:{settings.REDIS_PORT}")

    return _redis_client


async def close_redis_client():
    """关闭 Redis 连接（用于应用关闭时清理）"""
    global _redis_client
    if _redis_client:
        await _redis_client.close()
        _redis_client = None
        print("Redis 连接已关闭")