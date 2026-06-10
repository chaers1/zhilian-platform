from datetime import datetime

from django.shortcuts import render
import redis
from django.http import JsonResponse
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.views import View
import json
from .models import Crawler
from django.utils import timezone

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
    def post(self, request):
        try:
            # 解析数据请求
            data = json.loads(request.body)
            print('data数据：', data)
            spider_type = data.get('spider_type')
            action = data.get('action')
            source = data.get('source', 'ssr2')

            # 验证字段
            if not spider_type or not action:
                return self.json_response({
                    'code': 400,
                    'message': 'spider_type 和 action 参数不能为空'
                }, status=400)

            # 获取 Redis 连接
            redis_client = self.get_redis()

            if action == 'start':
                # 启动时创建记录
                task = Crawler.objects.create(
                    user_id=request.user_id,
                    user_name=request.user_name,
                    email=request.user_email,
                    spider_type=spider_type,
                    source=source,
                    status='running',
                    start_time=datetime.now(),
                )
                print(f"✅ 创建任务，task_id: {task.id}")
                # 写入 task_id 到 Redis
                redis_client.hset(f"spider:{spider_type}:task", "task_id", task.id)
                print(f"✅ task_id {task.id} 已写入 Redis")

            else:  # action == 'stop'
                # 停止时：更新已有记录
                task = Crawler.objects.filter(
                    spider_type=spider_type,
                    status='running'
                ).order_by('-created_at').first()

                if task:
                    task.status = 'stopped'
                    task.stop_time = datetime.now()
                    task.save()
                    print(f"✅ 更新任务 {task.id} 状态为 stopped")
                else:
                    print(f"⚠️ 没有找到运行中的任务")

            # 发送 Redis 命令（启动和停止都需要）
            command = f'{spider_type}:{action}'
            redis_client.rpush('spider:commands', command)

            return self.json_response({
                'code': 200,
                'message': f'{action} 指令已发送',
                'task_id': task.id if action == 'start' else (task.id if task else None),
                'command': command
            })

        except json.JSONDecodeError:
            return self.json_response({
                'code': 400,
                'message': '无效的 JSON 数据'
            }, status=400)
        except Exception as e:
            return self.json_response({
                'code': 500,
                'message': str(e)
            }, status=500)

# 爬虫历史运行记录接口
class TaskHistoryView(APIViewBase):
    """获取当前用户的历史运行记录"""

    def get(self, request):
        user_id = getattr(request, 'user_id', None)

        if not user_id:
            return self.json_response({
                'code': 401,
                'message': '未登录'
            }, status=401)

        # 查询该用户的任务记录
        tasks = Crawler.objects.filter(user_id=user_id)

        tasks = tasks.order_by('-start_time')[:10]

        history = []
        for task in tasks:
            # 计算运行时长
            duration = self._calculate_duration(task)

            # 错误数量
            error_count = 0
            if task.error_info and isinstance(task.error_info, list):
                error_count = len(task.error_info)

            history.append({
                'id': task.id,
                'spider_type': task.spider_type,
                'source': task.source,
                'status': task.status,
                'start_time': task.start_time.strftime('%m-%d %H:%M') if task.start_time else '-',
                'end_time': (task.completed_time or task.stop_time).strftime('%m-%d %H:%M') if (
                            task.completed_time or task.stop_time) else '-',
                'items_count': task.items_count,
                'total_expected': task.total_expected,
                'duration': duration,
                'error_count': error_count,
            })

        return self.json_response({
            'code': 200,
            'data': history,
            'total': len(history)
        })

    def _calculate_duration(self, task):

        """计算运行时长"""
        # 结束时间：完成时间 或 停止时间
        end_time = task.completed_time or task.stop_time

        if task.start_time and end_time:
            # 处理时区问题
            start = task.start_time
            end = end_time

            if timezone.is_aware(start):
                start = timezone.localtime(start)
            if timezone.is_aware(end):
                end = timezone.localtime(end)

            seconds = (end - start).total_seconds()
            hours = int(seconds // 3600)
            minutes = int((seconds % 3600) // 60)
            secs = int(seconds % 60)

            if hours > 0:
                return f"{hours}小时{minutes}分{secs}秒"
            elif minutes > 0:
                return f"{minutes}分{secs}秒"
            else:
                return f"{secs}秒"

        return "-"









































