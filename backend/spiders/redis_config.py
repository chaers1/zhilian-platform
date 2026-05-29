# redis_config.py
import redis
from datetime import datetime


class RedisClient:
    """Redis 客户端单例"""
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance.client = redis.Redis(
                host='localhost',
                port=6379,
                decode_responses=True
            )
        return cls._instance

    def get_client(self):
        return self.client

    def hset_status(self, spider_name, **kwargs):
        """设置爬虫状态"""
        for key, value in kwargs.items():
            self.client.hset(f"spider:{spider_name}:status", key, value)

    def hget_status(self, spider_name, key):
        """获取爬虫状态"""
        return self.client.hget(f"spider:{spider_name}:status", key)

    def set_stop_flag(self, spider_name):
        """设置停止信号"""
        self.client.set(f"spider:{spider_name}:stop_flag", "1")

    def clear_stop_flag(self, spider_name):
        """清除停止信号"""
        self.client.delete(f"spider:{spider_name}:stop_flag")

    def get_stop_flag(self, spider_name):
        """获取停止信号"""
        return self.client.get(f"spider:{spider_name}:stop_flag")


# 全局实例
redis_client = RedisClient().get_client()
redis_helper = RedisClient()