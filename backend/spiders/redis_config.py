# redis_config.py
import os
import redis


class RedisClient:
    """Redis 客户端单例"""
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)

            # ✅ 从环境变量读取 Redis 配置
            redis_host = os.getenv('REDIS_HOST', 'localhost')
            redis_port = int(os.getenv('REDIS_PORT', 6379))
            redis_password = os.getenv('REDIS_PASSWORD', None)
            redis_db = int(os.getenv('REDIS_DB', 0))
            decode_responses = os.getenv('REDIS_DECODE_RESPONSES', 'true').lower() == 'true'

            # 构建 Redis 连接参数（不加 protocol）
            redis_kwargs = {
                'host': redis_host,
                'port': redis_port,
                'db': redis_db,
                'decode_responses': decode_responses,
            }

            # 只有设置了密码才添加 password 参数
            if redis_password:
                redis_kwargs['password'] = redis_password

            cls._instance.client = redis.Redis(**redis_kwargs)

            # 测试连接
            try:
                # ✅ 关键：手动切换到 RESP2 协议
                cls._instance.client.execute_command('HELLO', 2)
                cls._instance.client.ping()
                print(f"✅ Redis 连接成功: {redis_host}:{redis_port}")
                print(f"   Redis 版本: {cls._instance.client.info('server')['redis_version']}")
            except Exception as e:
                print(f"❌ Redis 连接失败: {e}")
                print(f"   尝试不发送 HELLO 命令...")
                # 如果 HELLO 命令失败，尝试普通连接
                try:
                    cls._instance.client.ping()
                    print(f"✅ Redis 连接成功（兼容模式）: {redis_host}:{redis_port}")
                except Exception as e2:
                    print(f"❌ Redis 连接仍然失败: {e2}")

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