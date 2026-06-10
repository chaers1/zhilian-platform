# 1. docker 部署流程

## 准备工作
```bash
# 拉取代码
cd ~/zhilian-platform
git pull
# 配置国内镜像源（加速下载） 这里可以选择阿里和华为之类的镜像源
sudo nano /etc/docker/daemon.json
```
## 创建 docker-compose.yml
- 包含六个服务，mysql（MariaDB），redis，django，fastapi，crawler，frontend
## 创建服务的dockerfile
- Django: Python 3.10 + Django 5.0
- FastAPI: Python 3.10 + uvicorn
- 爬虫: Python 3.10 + 依赖
- 前端: Node 20 + Vite
## 启动服务
```bash
docker compose up -d --build
```

#  二、遇到的困难及解决方案
| 问题                 | 原因                                 | 解决方案                                             |
| ------------------ | ---------------------------------- | ------------------------------------------------ |
| **MySQL 8.0 无法启动** | CPU 不支持 x86-64-v2 指令集              | 改用 MariaDB 10.6                                  |
| **Django 连接数据库失败** | Django 4.2 要求 MySQL 8.0+           | 降级到 Django 5.0 + MariaDB                         |
| **前端请求后端失败**       | 前端请求 `127.0.0.1`，Docker 中需用 WSL IP | 修改 `.env` 为 `192.168.0.120`                      |
| **CORS 跨域错误**      | FastAPI 未允许前端来源                    | 配置 `allow_origins=["http://192.168.0.120:5173"]` |
| **Redis 连接失败**     | 代码中硬编码 `localhost`                 | 改为 `os.getenv('REDIS_HOST', 'redis')`            |
| **数据库缺少字段**        | 迁移未执行                              | 手动 `ALTER TABLE ADD COLUMN`                      |
| **环境变量乱码**         | docker-compose.yml 中值错误            | 修正 `REDIS_PORT: 6379`                            |
## 三、Windows 开发注意事项
### 后端开发 (Django + FastAPI + 爬虫)

1. **数据库连接**
```python
# ✅ 正确：使用环境变量
DB_HOST = os.getenv('DB_HOST', 'localhost')
# ❌ 错误：硬编码
DB_HOST = 'localhost'
```

2. redis链接
```python
# ✅ 正确
host = os.getenv('REDIS_HOST', 'localhost')

# ❌ 错误
host = 'localhost'
```

3. 文件上传路径
```python
 
   # ✅ 正确：统一使用正斜杠
filepath = f'avatars/{filename}'

# ❌ 错误：使用 os.path.join 可能产生反斜杠
filepath = os.path.join('avatars', filename)
```
4. jwt token 生成
5. ```python
   # ✅ Django 5.0 中
token = jwt.encode(payload, SECRET_KEY, algorithm='HS256')

# ❌ 错误：不需要 decode
token = jwt.encode(...).decode('utf-8')
   ```
   
### 前端开发 (React + Vite)

1. api地址配置
```js
// Windows 开发：127.0.0.1
// Docker 部署：WSL IP (如 192.168.0.120)
const DJANGO_BASE_URL = 'http://127.0.0.1:8000/'
```
1. 环江变量文件优先级
	- `.env.local` > `.env` > 代码默认值
	- 建议只在 `.env` 中配置，避免混乱
2. 提交代码前检查
	- 不要提交 `.env.local`
	- 使用 `.env.example` 作为模板
### 下次运行docker的步骤
1. 启动所有服务
```bash
cd ~/zhilian-platform
docker compose start
```
1. 检查状态
```bash
docker compose ps
```
1. 查看日志
```bash
docker logs zhilian-django --tail 50
docker logs zhilian-fastapi --tail 50
docker logs zhilian-crawler --tail 50
docker logs zhilian-frontend --tail 50
```
1. 代码更新
```bash
git pull
docker compose build --no-cache
docker compose up -d
```
1. 停止服务
```bash
docker compose stop
```
1. 关闭计算机
```
sudo shutdown now
```
### 常用命令速查
| 操作     | 命令                                    |
| ------ | ------------------------------------- |
| 启动所有服务 | `docker compose up -d`                |
| 停止所有服务 | `docker compose stop`                 |
| 重启单个服务 | `docker compose restart django`       |
| 查看日志   | `docker logs -f zhilian-django`       |
| 进入容器   | `docker exec -it zhilian-django bash` |
| 重新构建   | `docker compose build --no-cache`     |
| 查看状态   | `docker compose ps`                   |
# 个人部署docker流程和问题处理
## 1. 推送代码
```bash
git status 查看修改文件
git add . 添加修改
git commit -m "fix: 统一使用环境变量，修复以下问题" ## 提交
git push origin main ## 推送到远程仓库
```
## 2. 先删除乌班图系统中的容器，网络和数据
```bash
cd ~/zhilian-platform
docker compose down -v

docker rmi zhilian-platform-django zhilian-platform-fastapi zhilian-platform-crawler zhilian-platform-frontend # 删除镜像

git pull 拉取最新代码

docker compose up -d --build 重新构建

docker compose ps 查看状态

# 查看三个后端的日志
docker logs zhilian-django --tail 30
docker logs zhilian-fastapi --tail 30
docker logs zhilian-crawler --tail 30

# 执行数据库迁移

docker exec zhilian-django python manage.py migrate
```

## 遇到的困难
```python
# 解决 Django 5.0 + MariaDB 10.6 兼容性问题
# 位置：settings.py 最末尾
# 原因：Django 5.0 要求 MySQL 8.0+，但实际使用 MariaDB 10.6
# 解决：禁用 Django 的数据库版本检查

import django.db.backends.mysql.base
django.db.backends.mysql.base.DatabaseWrapper.check_database_version_supported = lambda self: None


fastapi的错误

import pymysql
pymysql.version_info = (8, 0, 0, 'final', 0)

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from .config import settings

# 使用配置中的数据库地址
DATABASE_URL = settings.DATABASE_URL

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    connect_args={
        "init_command": "SET sql_mode='STRICT_TRANS_TABLES'"
    }
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
        

docker容器内启动顺序，一定要做好健康检查第二启动顺序要先数据库
  cat > docker-compose.yml << 'EOF'
services:
  mysql:
    image: mariadb:10.6
    container_name: zhilian-mysql
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: qazwsx@123
      MYSQL_DATABASE: dingban_backend
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
    networks:
      - zhilian-network
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-uroot", "-pqazwsx@123"]
      timeout: 20s
      retries: 10
      interval: 5s

  redis:
    image: redis:7-alpine
    container_name: zhilian-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - zhilian-network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      timeout: 20s
      retries: 10
      interval: 5s

  django:
    build: ./backend/django_react
    container_name: zhilian-django
    restart: unless-stopped
    environment:
      DB_HOST: mysql
      DB_PORT: 3306
      DB_USER: root
      DB_PASSWORD: qazwsx@123
      DB_NAME: dingban_backend
      REDIS_HOST: redis
      REDIS_PORT: 6379
    ports:
      - "8000:8000"
    volumes:
      - ./backend/django_react:/app
    depends_on:
      mysql:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - zhilian-network
    command: python manage.py runserver 0.0.0.0:8000

  fastapi:
    build: ./backend/FastAPIProject
    container_name: zhilian-fastapi
    restart: unless-stopped
    environment:
      DB_HOST: mysql
      DB_PORT: 3306
      DB_USER: root
      DB_PASSWORD: qazwsx@123
      DB_NAME: dingban_backend
      REDIS_HOST: redis
      REDIS_PORT: 6379
    ports:
      - "8001:8001"
    volumes:
      - ./backend/FastAPIProject:/app
    depends_on:
      mysql:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - zhilian-network
    command: uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload

  crawler:
    build: ./backend/spiders
    container_name: zhilian-crawler
    restart: unless-stopped
    environment:
      DB_HOST: mysql
      DB_PORT: 3306
      DB_USER: root
      DB_PASSWORD: qazwsx@123
      DB_NAME: dingban_backend
      REDIS_HOST: redis
      REDIS_PORT: 6379
    volumes:
      - ./backend/spiders:/app
    depends_on:
      mysql:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - zhilian-network
    command: python app_main.py

  frontend:
    build: ./frontend/my-react-app
    container_name: zhilian-frontend
    restart: unless-stopped
    environment:
      VITE_DJANGO_HOST: 192.168.0.120
      VITE_DJANGO_PORT: 8000
      VITE_FASTAPI_HOST: 192.168.0.120
      VITE_FASTAPI_PORT: 8001
    ports:
      - "5173:5173"
    volumes:
      - ./frontend/my-react-app:/app
      - /app/node_modules
    depends_on:
      - django
      - fastapi
    networks:
      - zhilian-network
    command: npm run dev -- --host 0.0.0.0

networks:
  zhilian-network:
    driver: bridge

volumes:
  mysql_data:
  redis_data:
EOF     
```