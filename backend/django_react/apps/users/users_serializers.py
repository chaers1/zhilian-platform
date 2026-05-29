"""
用户序列化器模块

包含用户相关的所有序列化器类：
    UserRegisterSerializer : 用户注册验证
        - 接收前端注册数据
        - 验证字段格式和唯一性
        - self.data : 原始请求数据
        - self.errors : 验证错误信息
        - self.validated_data : 验证通过后的数据

    UserLoginSerializer : 用户登录验证
        - 验证登录凭证
        - 支持用户名/邮箱/手机号登录
        - 验证密码正确性

    UserSerializer : 用户详细信息序列化
        - 用户信息展示
        - 敏感信息过滤

Author: 张志刚
Date: 2026-03-07
Version: 1.0
"""
from django_react import settings
from .models import User
import re
from django.contrib.auth.hashers import make_password, check_password
import logging
from asgiref.sync import sync_to_async

logger = logging.getLogger(__name__)


class UserRegisterSerializer(object):
    '''用户注册序列化'''

    def __init__(self, data):
        self.data = data
        self.errors = {}
        self.validated_data = {}

    async def is_valid(self) -> bool:
        """
               验证数据是否有效
               返回: True=验证通过, False=验证失败
               错误信息在 self.errors 中
        """

        # 1. 验证字段格式（同步）
        self._validate_format()

        # 2. 字段通过验证数据库唯一性（异步）
        if not self.errors:
            await self._check_registered()

        # 3. 填充 validated_data（如果没有错误）
        if not self.errors:
            self.validated_data = {
                'first_name': self.data.get('first_name'),
                'email': self.data.get('email'),
                'phone': str(self.data.get('phone')),
                'password': str(self.data.get('password')),
            }
        # 4. 返回bool值

        return not self.errors

    def _validate_format(self):

        # 同步验格式
        self._validate_username()
        self._validate_email_format()
        self._validate_phone_format()
        self._validate_password()

    def _validate_username(self):
        username = self.data.get('first_name')

        if not username:
            self.errors['first_name'] = '用户名不能为空'
            return
        if len(username) < 3 or len(username) > 20:
            self.errors['first_name'] = '用户名长度必须在3-20位之间'

    def _validate_email_format(self):

        # 邮箱验证
        email = self.data.get('email')
        if not email:
            self.errors['email'] = '邮箱不能为空'
            return
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'

        if not re.match(pattern, email):
            self.errors['email'] = '邮箱格式不正确'

    def _validate_phone_format(self):

        # 验证手机号码格式
        phone = self.data.get('phone')

        if not phone:
            self.errors['phone'] = '手机号码不能为空'
            return
        phone_str = str(phone)

        if not phone_str.isdigit():
            self.errors['phone'] = '手机号只能包含数字'
        elif len(phone_str) != 11:
            self.errors['phone'] = f'手机号必须是11位，当前是{len(phone_str)}位'
        elif not phone_str.startswith('1'):
            self.errors['phone'] = '手机号必须以1开头'

    def _validate_password(self):

        # 密码验证

        password = self.data.get('password')
        if not password:
            self.errors['password'] = '密码不能为空'
            return
        pwd_str = str(password)

        if len(pwd_str) < 6:
            self.errors['password'] = '密码至少6位'
        elif len(pwd_str) > 128:
            self.errors['password'] = '密码不能超过128位'

    async def _check_registered(self):

        # 异步检查邮箱和手机号是否被注册
        email = self.data.get('email')
        if email and 'email' not in self.errors:
            if await User.objects.filter(email=email).aexists():
                self.errors['email'] = '邮箱已经被注册'

        # 检查手机号

        phone = self.data.get('phone')

        if phone and 'phone' not in self.errors:
            if await User.objects.filter(phone=phone).aexists():
                self.errors['phone'] = '手机号已经被注册'

    async def save(self) -> dict | None:

        """
          保存用户到数据库

          返回:
              - 成功: 包含用户信息的字典（用于响应）
              - 失败: None (错误信息在 self.errors 中)

          注意: 这个方法应该在 is_valid() 返回 True 后调用
          """
        if self.errors:
            logger.error(f"尝试保存无效数据: {self.errors}")
            return None

        try:
            # 密码加密
            pwd = self.validated_data.get('password')
            if not pwd:
                self.errors['password'] = '密码不能为空'
                return None

            hashed_password = make_password(pwd)
            self.validated_data['password'] = hashed_password

            # 创建用户
            user = User(**self.validated_data)
            await user.asave()

            # 记录日志
            logger.info(f'用户注册成功: {user.first_name}')

            # 返回需要的数据
            return {
                'first_name': user.first_name,
                'email': user.email,
                'phone': user.phone,
            }
        except Exception as e:
            logger.error(f'保存用户失败: {str(e)}')
            self.errors['database'] = f'数据库操作失败: {str(e)}'
            return None


class UserLoginSeriaLizer(object):
    '''登录序列化器'''

    def __init__(self, data):
        self.data = data
        self.errors = {}
        self.validated_data = {}  # 存储验证通过的用户输入
        self.user_data = {}

    def is_valid(self) -> bool:

        # 验证数据格式
        self._validate_format()

        if not self.errors:
            self.validated_data = {
                'email': self.data.get('email'),
                'password': str(self.data.get('password')),
            }

        return not self.errors

    def _validate_format(self):
        # 数据验证封装
        self._validate_password_format()
        self._validate_email_format()

    def _validate_email_format(self):

        email = self.data.get('email')
        if not email:
            self.errors['email'] = '邮箱不能为空'

            return

        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(pattern, email):
            self.errors['email'] = '邮箱格式不正确'

            return

    def _validate_password_format(self):

        password = self.data.get('password')
        if not password:
            self.errors['password'] = '密码不能为空'
            return

        pwd_str = str(password)
        if len(pwd_str) < 6:
            self.errors['password'] = '密码长度少于六位'

            return

        if len(pwd_str) > 128:
            self.errors['password'] = '密码长度大于128位'

            return

    async def save(self) -> dict | None:

        """
        执行登录操作逻辑
                 返回:
                     - 成功: 包含用户信息的字典（用于响应）
                     - 失败: None (错误信息在 self.errors 中)

                 注意: 这个方法应该在 is_valid() 返回 True 后调用
                 """
        if self.errors:
            logger.error(f'数据保存失败: {self.errors}')
            return None

        pwd = self.validated_data.get('password')
        email = self.validated_data.get('email')

        try:

            # 查找用户
            user = await User.objects.aget(email=email)

            if check_password(pwd, user.password):

                self.user_data = {
                    'id': user.id,
                    'email': user.email,
                    'name':user.first_name,
                    'phone': user.phone,
                    'avatar': user.avatar,
                    'department': user.department,


                }
                return self.user_data

            else:
                self.errors['password'] = '密码错误'
                return None

        except User.DoesNotExist:
            self.errors['email'] = '用户不存在'
            return None

class UserProfileUpdateSerializer(object):

    '''个人资料更新序列化器'''

    def __init__(self, data,user_id=None):

        self.data = data
        self.user_id = user_id
        self.errors = {}
        self.validated_data = {}
        self.user = None

    async def is_valid(self):
        print(f"=== 序列化器 is_valid 开始 ===")
        print(f"self.data: {self.data}")
        print(f"self.data.get('name'): {self.data.get('name')}")
        print(f"self.data.get('email'): {self.data.get('email')}")
        print(f"self.data.get('phone'): {self.data.get('phone')}")

        # 获取用户对象
        self.user = await User.objects.aget(id=self.user_id)
        print(f"用户对象: {self.user.id}, {self.user.first_name}")

        # 验证格式
        self._validate_format()
        print(f"验证后 errors: {self.errors}")

        # 验证邮箱和手机号码更改的时候是否被占用
        if not self.errors:
            await self._check_unique()

        # 验证通过后存数据
        if not self.errors:
            self.validated_data = {
                'name': self.data.get('name'),
                'email': self.data.get('email'),
                'phone': self.data.get('phone'),
                'department': self.data.get('department'),
                'bio': self.data.get('bio'),
            }
            print(f"validated_data: {self.validated_data}")

        print(f"最终 errors: {self.errors}")
        return not self.errors

    async def save(self) -> dict | None:
        '''保存更新后的用户数据信息'''

        if self.errors:
            return None

        # 更新字段
        if 'name' in self.validated_data:
            self.user.first_name = self.validated_data['name']
        if 'email' in self.validated_data:
            self.user.email = self.validated_data['email']
        if 'phone' in self.validated_data:
            self.user.phone = self.validated_data['phone']
        if 'department' in self.validated_data:
            self.user.department = self.validated_data['department']
        if 'bio' in self.validated_data:
            self.user.bio = self.validated_data['bio']

        # 保存到数据库
        await sync_to_async(self.user.save)()

        # 返回更新后的数据
        return {
            'id': self.user.id,
            'name': self.user.first_name,
            'email': self.user.email,
            'phone': self.user.phone,
            'department': self.user.department,
            'bio': self.user.bio,
            'avatar': self.user.avatar,
            'avatar_url': f"{settings.MEDIA_URL}{self.user.avatar}" if self.user.avatar else None
        }

    # 同步验证方法

    def _validate_format(self):

        '''字段验证'''

        self._validate_name()
        self._validate_email_format()
        self._validate_phone_format()
        self._validate_department()
        self._validate_bio()

    def _validate_name(self):

        '''验证名字'''

        name = self.data.get('name')

        if name is not None:

            if not name:
                self.errors['name'] = '姓名不能为空'

            elif len(name) < 2 or len(name) > 50:

                self.errors['name'] = '姓名长度必须在2~50位之间'

    def _validate_email_format(self):

        '''验证邮箱格式'''
        email = self.data.get('email')

        if email is not None:
            if not email:
                self.errors['email'] = '邮箱不能为空'
                return
            pattern =  r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'

            if not re.match(pattern, email):

                self.errors['email'] = '邮箱格式不正确'

    def _validate_phone_format(self):
        """验证手机号格式"""
        phone = self.data.get('phone')
        if phone is not None:
            if not phone:
                self.errors['phone'] = '手机号码不能为空'
                return
            phone_str = str(phone)
            if not phone_str.isdigit():
                self.errors['phone'] = '手机号只能包含数字'
            elif len(phone_str) != 11:
                self.errors['phone'] = f'手机号必须是11位，当前是{len(phone_str)}位'
            elif not phone_str.startswith('1'):
                self.errors['phone'] = '手机号必须以1开头'

    def _validate_department(self):
        """验证部门"""
        department = self.data.get('department')
        if department is not None:
            if len(department) > 100:
                self.errors['department'] = '部门名称不能超过100个字符'

    def _validate_bio(self):
        """验证个人简介"""
        bio = self.data.get('bio')
        if bio is not None:
            if len(bio) > 500:
                self.errors['bio'] = '个人简介不能超过500个字符'

    async def _check_unique(self):
        """检查邮箱和手机号是否被占用（排除当前用户）"""
        # 检查邮箱
        email = self.data.get('email')
        if email and 'email' not in self.errors:
            if await User.objects.filter(email=email).exclude(id=self.user_id).aexists():
                self.errors['email'] = '邮箱已经被其他用户注册'

        # 检查手机号
        phone = self.data.get('phone')
        if phone and 'phone' not in self.errors:
            if await User.objects.filter(phone=phone).exclude(id=self.user_id).aexists():
                self.errors['phone'] = '手机号已经被其他用户注册'







































