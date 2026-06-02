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
|操作|命令|
|---|---|
|启动所有服务|`docker compose up -d`|
|停止所有服务|`docker compose stop`|
|重启单个服务|`docker compose restart django`|
|查看日志|`docker logs -f zhilian-django`|
|进入容器|`docker exec -it zhilian-django bash`|
|重新构建|`docker compose build --no-cache`|
|查看状态|`docker compose ps`|
# 个人部署docker流程和问题处理
## 1. 推送代码
```bash
git status 查看修改文件
git add . 添加修改
git commit -m "fix: 统一使用环境变量，修复以下问题" ## 提交
git push origin main ## 推送到远程仓库
```