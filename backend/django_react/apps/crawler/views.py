from django.shortcuts import render
import redis
from django.http import JsonResponse
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.views import View
import json
from .models import Crawler

# API 基础视图类
@method_decorator(csrf_exempt, name='dispatch')
class APIViewBase(View):
    """API 基础视图类，已禁用 CSRF"""

    # 类属性：Redis 连接（只初始化一次，所有子类共享）
    _redis = redis.Redis(
        host='localhost',
        port=6379,
        decode_responses=True
    )

    @classmethod
    def get_redis(cls):
        """获取 Redis 连接"""
        return cls._redis

    def json_response(self, data, status=200):
        """统一返回 JSON 格式"""
        return JsonResponse(data, status=status)

# 启动爬虫

class SpiderOperationView(APIViewBase):
    '''
    爬虫启动和停止操作，通过参数来区分操作
    接口功能：通过 token 验证用户权限，执行爬虫运行操作
    数据：存储用户、操作类型、操作时间
    return：爬虫运行状态码
    '''
    def post(self,request):
        try:
            # ✅ 简化解析请求数据
            data = json.loads(request.body)
            spider_type = data.get('spider_type')
            action = data.get('action')
            source = data.get('source', 'ssr2')  # 设置默认值

            # 验证必填字段
            if not spider_type or not action:
                return self.json_response({
                    'status': 'error',
                    'message': 'spider_type 和 action 参数不能为空'
                }, status=400)

            # 记录操作到数据库（使用当前登录用户）
            task = Crawler.objects.create(
                user_id=request.user_id,
                user_name=request.user_name,
                email=request.user_email,
                spider_type=spider_type,
                source=source,
                action=action,
                is_success=True
            )

            # ✅ 使用基类的 Redis 连接发送指令
            command = f'{spider_type}:{action}'
            redis_client = self.get_redis()
            redis_client.rpush('spider:commands', command)

            return self.json_response({
                'status': 'success',
                'message': f'{action} 指令已发送',
                'task_id': task.user_id,
                'command': command
            })

        except json.JSONDecodeError:
            return self.json_response({
                'status': 'error',
                'message': '无效的 JSON 数据'
            }, status=400)
        except Exception as e:
            return self.json_response({
                'status': 'error',
                'message': str(e)
            }, status=500)

# 爬虫状态接口

class SpiderStatusView(APIViewBase):
    """
    获取爬虫状态接口
    链接redis数据库
    查看status内的状态
    """

    def get(self, request, spider_name):
        """
        :param request:获取指定爬虫的状态
        :param spider_name:爬虫名字
        :return:
        """

        try:
            redis_client = self.get_redis()
            status_key = f"spider:{spider_name}:status"

            # 从redis中读取状态
            status = redis_client.hget(status_key, "status") or "stopped"
            start_time = redis_client.hget(status_key, "start_time")
            current_count = redis_client.hget(status_key, "current_count") or 0 # 抓取的数量
            total_expected = redis_client.hget(status_key, "total_expected") or 0 # 需要抓取的总数
            progress_percent = redis_client.hget(status_key, "progress_percent") or "0%"# 爬取百分比

            return JsonResponse({
                "success": True,
                "data": {
                    "spider_name": spider_name,
                    "status": status,
                    "start_time": start_time,
                    "current_count": int(current_count),
                    "total_expected": int(total_expected),
                    "progress_percent": progress_percent,
                }
            })

        except Exception as e:
            return JsonResponse({
                "success": False,
                "message": f"获取状态失败: {str(e)}"
            }, status=500)









































