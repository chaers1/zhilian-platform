import os
import traceback
import uuid
from asgiref.sync import sync_to_async
from django.http import JsonResponse, QueryDict
from django.views import View
import json
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from .users_serializers import UserRegisterSerializer, UserLoginSeriaLizer,UserProfileUpdateSerializer
import logging

# 生成 token（使用 JWT）
import jwt
from datetime import datetime, timedelta
from django.conf import settings
from .models import UserLoginLog, User
from django.utils import timezone
from datetime import datetime

# Create your views here.

logger = logging.getLogger(__name__)

# API 基础视图类
@method_decorator(csrf_exempt, name='dispatch')
class APIViewBase(View):
    """API 基础视图类，已禁用 CSRF"""
    pass


class UserRegisterView(APIViewBase):

    async def post(self, request):

        try:
            register = json.loads(request.body)

            logger.info(f'注册数据{register}')

            # 创建返序列化
            serializer = UserRegisterSerializer(data=register)

            # 数据验证

            is_valid = await serializer.is_valid()

            if not is_valid:
                # 验证失败，返回语法错误
                return JsonResponse({
                    'code': 400,
                    'status': 'error',
                    'message': '参数验证失败',
                    'error': serializer.errors  # 具体的字段错误
                }, status=400)

            user_data = await serializer.save()

            if not user_data:
                # 保存失败

                return JsonResponse({
                    'code': 500,
                    'status': 'error',
                    'message': '注册失败，稍后重试',
                    'error': serializer.errors
                }, status=500)

            # 注册成功
            return JsonResponse({
                'code': 200,
                'status': 'success',
                'message': '注册成功,请登录',
                'data': {
                    'username': user_data.get('first_name'),
                    'email': user_data.get('email'),
                    'phone': user_data.get('phone', ''),
                }
            }, status=200)

        except Exception as e:
            logger.error(f"注册接口异常{str(e)}")
            return JsonResponse({
                'code': 500,
                'status': 'error',
                'message': '服务器内部错误'
            }, status=500)


class UserLoginView(APIViewBase):

    async def post(self, request):

        try:
            body_str = request.body.decode('utf-8')
            login_data = json.loads(body_str)
            logger.info(f'登录数据{login_data}')

            # 创建序列化器
            serializer = UserLoginSeriaLizer(data=login_data)

            # 数据验证
            is_valid = serializer.is_valid()

            if not is_valid:
                # 验证失败，返回语法错误

                return JsonResponse({
                    'code': 400,
                    'status': 'error',
                    'message': '参数验证失败',
                    'error': serializer.errors
                }, status=400)

            # 登录数据验证
            user_data = await serializer.save()

            if not user_data:
                return JsonResponse({
                    'code': 401,
                    'status': 'error',
                    'message': '邮箱或密码错误',
                    'error': serializer.errors
                }, status=401)

            exp_time = datetime.utcnow() + timedelta(hours=7)

            token = jwt.encode({
                'id': user_data.get('id'),
                'email': user_data.get('email'),
                'name': user_data.get('name'),
                'exp': exp_time,
            }, settings.SECRET_KEY, algorithm='HS256').decode('utf-8')
            logger.warning(f'token:{token}')
            logger.warning(f'token:{token}')

            # 创建登录日志
            user_obj = await User.objects.aget(id=user_data['id'])
            create_log = sync_to_async(UserLoginLog.objects.create)
            login_log = await create_log(user=user_obj)
            logger.warning(f"登录日志已创建，ID: {login_log.id}")

            avatar_url =  f"{settings.MEDIA_URL}{user_data.get('avatar')}" if user_data.get('avatar') else ''
            print("avatar_url:%s" % avatar_url)
            print("avatarr:%s" % user_data.get('avatar'))
            # 登录成功
            return JsonResponse({
                'code': 200,
                'status': 'success',
                'message': '登录成功',
                'data': {
                    'id': user_data.get('id'),
                    'name': user_data.get('name'),
                    'avatar_url': avatar_url,
                    'token': token,
                    'department': user_data.get('department'),
                }
            }, status=200)

        except json.decoder.JSONDecodeError as e:
            logger.error(e)
            return JsonResponse({
                'code': 400,
                'message': '无效的 JSON 数据'
            }, status=400)

        except Exception as e:

            logger.error(f'登录接口异常{str(e)}')
            return JsonResponse({
                'code': 500,
                'status': 'error',
                'message': '服务器内部错误'
            }, status=500)

# 退出视图
class UserLogoutView(APIViewBase):

    def post(self, request):
        # 直接从 request 获取用户信息（中间件已经验证好了）
        user_id = getattr(request, 'user_id', None)
        user_name = getattr(request, 'user_name', None)

        logger.warning(f"退出视图: 用户ID={user_id}, 用户名={user_name}")

        if not user_id:
            return JsonResponse({'code': 401, 'message': '未登录'}, status=401)

        try:
            # 获取最新一条登录记录
            latest_log = UserLoginLog.objects.filter(
                user_id=user_id
            ).order_by('-login_time').first()

            if latest_log:
                latest_log.logout_time = timezone.now()
                latest_log.save()
                logger.warning(f"退出时间更新成功，日志ID: {latest_log.id}")

            return JsonResponse({
                'code': 200,
                'message': f'{user_name} 退出成功'
            })

        except Exception as e:
            logger.error(f"退出异常: {e}")
            return JsonResponse({'code': 500, 'message': '服务器错误'}, status=500)

# 查看个人信息

class UserProfileView(APIViewBase):

    async def get(self, request):
        user_id = getattr(request, 'user_id', None)

        try:
            user = await User.objects.aget(id=user_id)
            avatar_path = user.avatar.replace('\\', '/') if user.avatar else ''
            avatar_url = f"{settings.MEDIA_URL}{avatar_path}" if avatar_path  else ''
            print(avatar_url)
            return JsonResponse({
                'code': 200,
                'data': {
                    'id': user.id,
                    'name': user.first_name,
                    'email': user.email,
                    'phone': user.phone,
                    'department': user.department or '',
                    'bio': user.bio or '',
                    'avatar_url': avatar_url,
                }
            }, status=200)

        except  User.DoesNotExist:
            return JsonResponse({
                'code': 404,
                'message': '用户不存在'
            }, status=404)


    async def post(self, request):
        user_id = getattr(request, 'user_id', None)

        try:
            # ===============================
            # 解析请求数据
            # ===============================
            avatar_file = None
            data = {}

            # 判断 Content-Type
            if request.content_type and 'multipart' in request.content_type:
                # ✅ POST 请求的 multipart/form-data，request.POST 自动有值
                data = request.POST.dict()
                avatar_file = request.FILES.get('avatar')
                print(f"FormData 解析结果: {data}")
                print(f"头像文件: {avatar_file}")
            else:
                try:
                    data = json.loads(request.body)
                    print(f"JSON 解析结果: {data}")
                except json.JSONDecodeError:
                    return JsonResponse({'code': 400, 'message': '无效的 JSON 数据'}, status=400)

            # ===============================
            # 2️⃣ 创建 Serializer 并验证数据
            # ===============================
            serializer = UserProfileUpdateSerializer(data=data, user_id=user_id)
            if not await serializer.is_valid():
                return JsonResponse({
                    'code': 400,
                    'message': '参数验证失败',
                    'errors': serializer.errors
                }, status=400)

            # ===============================
            # 3️⃣ 保存文本数据
            # ===============================
            user_data = await serializer.save()
            if user_data is None:
                return JsonResponse({'code': 500, 'message': '保存数据失败'}, status=500)

            # ===============================
            # 4️⃣ 处理头像文件（如果上传）
            # ===============================
            if avatar_file:
                # 校验文件类型
                allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
                if avatar_file.content_type not in allowed_types:
                    return JsonResponse({
                        'code': 400,
                        'message': f'不支持的文件类型，仅支持 {", ".join(allowed_types)}'
                    }, status=400)

                # 校验文件大小
                if avatar_file.size > 2 * 1024 * 1024:
                    return JsonResponse({'code': 400, 'message': '图片大小不能超过 2MB'}, status=400)

                # ✅ 获取用户对象（如果还没获取）
                user = await User.objects.aget(id=user_id)

                # ✅ 删除旧头像
                old_avatar = user.avatar
                if old_avatar:
                    old_full_path = os.path.join(settings.MEDIA_ROOT, old_avatar)
                    if os.path.exists(old_full_path):
                        try:
                            os.remove(old_full_path)
                            print(f"已删除旧头像: {old_full_path}")
                        except Exception as e:
                            print(f"删除旧头像失败: {e}")

                # 生成文件名并保存
                ext = avatar_file.name.split('.')[-1].lower()
                filename = f'avatar_{user_id}_{uuid.uuid4().hex[:8]}.{ext}'
                # 改成这样（统一用正斜杠）
                filepath = f'avatars/{filename}'  # ✅ 强制使用正斜杠
                full_path = os.path.join(settings.MEDIA_ROOT, 'avatars', filename)  # 或者用 os.path.join
                os.makedirs(os.path.dirname(full_path), exist_ok=True)

                with open(full_path, 'wb+') as f:
                    for chunk in avatar_file.chunks():
                        f.write(chunk)

                # 更新用户头像字段
                user.avatar = filepath
                await sync_to_async(user.save)()

                # 更新返回数据
                user_data['avatar'] = filepath
                user_data['avatar_url'] = f"{settings.MEDIA_URL}{filepath}"

            # ===============================
            # 5️⃣ 返回成功结果
            # ===============================
            return JsonResponse({'code': 200, 'message': '修改成功', 'data': user_data})

        # ===============================
        # 异常处理
        # ===============================
        except User.DoesNotExist:
            return JsonResponse({'code': 404, 'message': '用户不存在'}, status=404)
        except Exception as e:
            traceback.print_exc()
            return JsonResponse({'code': 500, 'message': str(e)}, status=500)