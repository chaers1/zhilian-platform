# 一 项目搭建流程
## 1. 创建django项目

```shell
django-admin startproject myproject
cd myproject
```
## 2. 配置环境

**requirements.txt**
```text
Django==4.2.0
mysqlclient==2.2.0
djangorestframework==3.14.0
django-cors-headers==4.0.0
PyJWT==2.8.0
python-dotenv==1.0.0
```

**安装依赖**
```bash
pip install -r requirements.txt
```

## 3. 创建数据库
```SQL
CREATE DATABASE myproject_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

## 4. 配置### settings.py数据库,SQL,MOGODB,REDIS
## myproject/settings.py

```python
# myproject/settings.py

DATABASES = {  
    'default': {  
        'ENGINE': 'django.db.backends.mysql',  
        'NAME': 'dingban_backend',  
        'USER': 'root',  
        'PASSWORD': 'qazwsx@123',  
        'HOST': 'localhost',  
        'PORT': '3306',  
        'OPTIONS': {  
            'charset': 'utf8mb4',  
        },  
    },  
    'mongodb': {  
        'ENGINE': 'django',  
        'NAME': 'movie_db',  
        'CLIENT': {  
            'host': 'mongodb://localhost:27017',  
        },  
    }  
  
}  
  
# Redis 配置（单独放在外面）  
REDIS_CONFIG = {  
    'host': 'localhost',  
    'port': 6379,  
    'db': 0,  
    'decode_responses': True,  
}
```

## 5.创建应用
```shell
python manage.py startapp users
```

## 6.注册应用
```python
# myproject/settings.py

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # 第三方应用
    'rest_framework',
    'corsheaders',
    
    # 自定义应用
    'users',  # 注册users应用
]
```

## 7. 创建urls.py 文件
```python
# users/urls.py

from django.urls import path
from users import views

urlpatterns = [
    # 首页接口
    path('', views.index, name='index'),
    path('register/', views.register, name='register'),
    path('login/', views.login, name='login'),
    path('profile/', views.profile, name='profile'),
    path('update/', views.update_profile, name='update_profile'),
    path('change-password/', views.change_password, name='change_password'),
]
```

## 8. 数据库迁移命令

```bash
# 1. 先生成迁移文件
python manage.py makemigrations

# 2. 查看迁移文件内容（可选）
python manage.py sqlmigrate users 0001

# 3. 应用迁移，创建表
python manage.py migrate

# 只生成 users 应用的迁移
python manage.py makemigrations users

# 只生成 products 应用的迁移
python manage.py makemigrations products

# 只生成 orders 应用的迁移
python manage.py makemigrations orders
```
## 项目启动命令
```shell
爬虫： python orchestrator.py
# 进入 Redis 命令行
redis-cli
# 发送启动爬虫指令
RPUSH spider:commands "movie:start"
# 查看队列（确认指令已发送）
LRANGE spider:commands 0 -1
# 发送停止爬虫指令
RPUSH spider:commands "movie:stop"
# 退出
exit
django:python manage.py runserver
npm run dev
uvicorn app.main:app --reload --port 8001
```
# 二 Users应用开发
## 配置
```text
创建models.py
django后端配置cors

 在虚拟环境中安装
pip install django-cors-headers

 在INSTALLED_APPS中添加
    # 第三方应用
    'corsheaders',  # 👈 添加这一行

**第三步在MIDDLEWARE中添加CorsMiddleware（必须放在最前面**
 'corsheaders.middleware.CorsMiddleware',  # 👈 放在最前面
 
 # 3. CORS配置（在文件末尾添加）
# 开发环境：允许所有来源
CORS_ALLOW_ALL_ORIGINS = True  # Django 3.x以上版本
# 或者生产环境：指定允许的来源
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",      # React默认端口
    "http://127.0.0.1:3000",
    "http://localhost:5173",      # Vite默认端口
    "http://127.0.0.1:5173",
    "http://localhost:5174",      # 你的Vite端口
    "http://127.0.0.1:5174",
    "http://localhost:8000",      # Django自身
]
# 允许携带认证信息（cookies/session）
CORS_ALLOW_CREDENTIALS = True
# 允许的HTTP方法
CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]
# 允许的请求头
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]
```

## 视图逻辑
### 基础视图类
```python
这里创建了一个基础视图类，因为寡欲请求的时候需要继承 @method_decorator(csrf_exempt, name='dispatch') 这样就可以进行了

```
### 注册视图 UserRegisterView
```python
#apps/users/views-》UserRegisterView
方法中设定了post请求方法，并且是异步 async
1. 在request请求的body中获取数据，由于是json数据传送，所以使用json.loads转换一下
2. 创建了一个反序列化方法，文件位置在/apps/users_serializers/文件中，方法名字UserRegisterSerializer
3.UserRegisterSerializer 中的方法，是一个序列化，方法中主要是验证数据是否有效，并且通过主方法，is_valid进行判断，先验证字段格式，在验证关键信息在数据库中的唯一性，没有错误的化返回注册数据4. 注册序列化中做了一个save方法，这个方法会查看一下is_valid是否有错误，没有错误的化会通过数据库操作创建用户，存储用户信息，并且返回前端需要的数据
5.使用反序列化器进行数据验证，验证后，判断is_valid 返回值，没有错误调用save方法保存数据，注册成功后返回数据
```

### 登录视图函数 UserLoginView
```python
#apps/users/views-》UserLoginView
1. 在body 中获取前端发送的数据
2. 转换为json
3. 序列化，验证密码和登录账号，
4. 登录时数据有一个存储操作，存储的数据是用户的登录时间信息
5. 制作token。token的制作是同该国用户的 id，email，用户名，时间戳
6. 创建登录日志 存储登录时间，
7. 登录成功后返回登录后的数据，id，name，用户头像路径，token
```
### 退出登录视图函数
```python
#apps/users/views-》UserLogoutView
1. 退出登录视图是通过token中间件来获取用户信息，直接使用token中的id和name进行操作
2. 查找数据库中的最后一条记录，并且设定退出登录时间  
```
### 个人信息视图函数
```python
#apps/users/views-》UserProfileView
一 查看用户信息

1. get请求直接从token中获取用户id
2. 使用用户id获取用户信息，并且拼接头像路径url
3. 返回用户信息，如果没有数据返回空字符串

二 修改用户信息
1. 通过token获取用户id
2. 判断请求头中的数据，分别获取数据文件和头像文件
3. 验证数据，验证数据的规则性和通过id查找用户，获取用户数据，并且做出更改，更改后保存数据到数据库
4. 检验头像文件，检验文件的类型，大小，获取数据库中用户头像，删除旧头像，生成文件名，和路径数据 ing且保存头像图片以及数据库中的路径信息的更新
5. 最后返回更新的数据
```
# jwt中间件实现逻辑
```text
# users/Middleware.py
1. 创建一个白名单，因为注册和登录是不需要token的，同时需要排序静态文件和媒体文件到认证
2. 检查请求的api是否在白名单中，如果在就需要放行
3. 获取request中的token，在NETA中的  HTTP_AUTHORIZATION 中获取token
4. 提取token，因为token支持两种模式 Bearer 和token ，Bearer是一个标准模式，Bearer：xxx 是一个格式，token：xxx 是一个模式，标准做法是使用BEARER 进行
5. 验证token 使用jwt 中的decode进行验证，方法中要传入token，返回解码后的用户信息，可以通过实例进行调用
6. 将用解码后的用户信息存储到request中
7. 配置中间件，middlewar中，这样在通信的时候就可以使用了，并且把一下信息会存储在request中，这样除了登录和注册以外，直接使用token方法中存储到request中的信息就可以进行数据库中的操作了
   ```