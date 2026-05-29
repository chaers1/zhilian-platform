import jwt
import logging
from django.http import JsonResponse
from django.utils.deprecation import MiddlewareMixin
from django.conf import settings

logger = logging.getLogger(__name__)


class JwtAuthenticationMiddleware(MiddlewareMixin):
    """JWT认证中间件 - 统一处理token验证"""

    # 白名单：不需要token验证的接口
    WHITE_LIST = [
        '/api/users/register',
        '/api/users/login',
    ]

    def process_request(self, request):
        # 1. 获取请求路径
        path = request.path
        print(f"中间件处理请求: {path}")  # 调试用

        # 2. 排除静态文件和媒体文件的认证
        if path.startswith('/media/') or path.startswith('/static/'):
            print(f"静态文件放行: {path}")
            return None  # 放行

        # 3. 检查是否在白名单中
        for white_path in self.WHITE_LIST:
            if path.startswith(white_path):
                print(f"白名单放行: {path}")
                return None  # 放行

        # 4. 获取token
        auth_header = request.META.get('HTTP_AUTHORIZATION')
        print(f"Authorization头: {auth_header}")  # 调试用

        if not auth_header:
            return JsonResponse({
                'code': 401,
                'message': '未提供认证令牌'
            }, status=401)

        # 5. 提取token（支持 Bearer 和 Token 两种格式）
        if auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
        elif auth_header.startswith('Token '):
            token = auth_header.split(' ')[1]
        else:
            token = auth_header

        print(f"提取的token: {token[:30]}...")  # 调试用

        # 6. 验证token
        try:
            payload = jwt.decode(
                token,
                settings.SECRET_KEY,
                algorithms=['HS256']
            )

            # 7. 关键：把用户信息存到request对象中
            request.user_id = payload.get('id')
            request.user_email = payload.get('email')
            request.user_name = payload.get('name', '未知用户')
            request.token_payload = payload

            print(f"用户验证通过: ID={request.user_id}, 邮箱={request.user_email}")

            # 8. 继续处理请求
            return None

        except jwt.ExpiredSignatureError:
            print("token已过期")
            return JsonResponse({
                'code': 401,
                'message': '登录已过期，请重新登录'
            }, status=401)

        except jwt.InvalidTokenError as e:
            print(f"token无效: {e}")
            return JsonResponse({
                'code': 401,
                'message': '无效的认证令牌'
            }, status=401)

        except Exception as e:
            print(f"token验证异常: {e}")
            return JsonResponse({
                'code': 500,
                'message': '服务器内部错误'
            }, status=500)