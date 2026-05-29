
## 1. fastapi文件目录
```text
FastAPIProject/
├── .env                          # 环境变量配置
├── requirements.txt              # 依赖包列表
└── app/                          # 主应用目录
    ├── __init__.py               # 包标识文件
    ├── main.py                   # 应用入口（路由注册）
    ├── config.py                 # 配置管理（Pydantic Settings）
    ├── dependencies.py           # 数据库连接（依赖注入）
    ├── models.py                 # 数据模型（ORM）
    ├── routers/                  # 路由目录（视图层）
    │   ├── __init__.py
    │   ├── dashboard.py          # Dashboard 接口
    │   ├── movies.py             # 电影数据接口
    │   └── tasks.py              # 爬虫任务接口
    └── internal/                 # 内部工具（可选）
        ├── __init__.py
        └── helpers.py            # 辅助函数
```

## 2. 创建流程
```bash
# 1. 安装依赖
pip install fastapi uvicorn sqlalchemy pymysql python-dotenv pydantic-settings

# 2. 创建目录
mkdir app
mkdir app/routers
mkdir app/internal

# 3. 创建空文件
touch app/__init__.py
touch app/routers/__init__.py
touch app/internal/__init__.py

# 4. 依次创建各文件（见下方）

# 5. 启动服务
uvicorn app.main:app --reload --port 8001
```

## 3. 文件作用详解释

| 名称                            | 类型                                  | 类比                                 |
| ----------------------------- | ----------------------------------- | ---------------------------------- |
| .env                          | 存储环境变量（数据库密码等敏感信息）                  | Django 的 `.env`                    |
| requirements.txt              | 项目依赖包列表                             | Django 的 `requirements.txt`        |
| app/main.py                   | 应用入口，创建 FastAPI 实例，注册路由，配置中间件       | Django 的 `urls.py` + `settings.py` |
| app/config.py                 | 配置管理，使用 Pydantic Settings 读取 `.env` | Django 的 `settings.py`             |
| app/dependencies.py           | 数据库连接引擎、会话管理、依赖注入函数                 | Django 的数据库配置                      |
| **`app/models.py`**           | SQLAlchemy ORM 模型，映射数据库表            | Django 的 `models.py`               |
| **`app/routers/*.py`**        | 路由/视图函数，处理具体 API 请求                 | Django 的 `views.py`                |
| **`app/internal/helpers.py`** | 工具函数（格式化、通用逻辑等）                     | Django 的 `utils.py`                |


## 4.  核心文件代码示例
### .env
```text
DATABASE_URL=mysql+pymysql://root:password@localhost:3306/db_name
APP_NAME=我的API
DEBUG=true
```
### app/config.py
```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str
    APP_NAME: str = "FastAPI App"
    DEBUG: bool = True
    
    class Config:
        env_file = ".env"

settings = Settings()
```
### `app/dependencies.py`
```python
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from .config import settings

engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

### `app/models.py`
```python
from sqlalchemy import Column, Integer, String
from .dependencies import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True)
    name = Column(String(50))
```

### `app/routers/user.py`
```python
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..dependencies import get_db
from ..models import User

router = APIRouter()

@router.get("/list")
async def get_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    return {"users": users}
```
### `app/main.py`
```python
from fastapi import FastAPI
from .routers import user
from .config import settings

app = FastAPI(title=settings.APP_NAME)

app.include_router(user.router, prefix="/user", tags=["用户"])

@app.get("/")
async def root():
    return {"message": "Hello World"}
```

##  五、请求处理流程
```text
1. 客户端请求 → http://localhost:8001/dashboard/stats
                    ↓
2. main.py 路由匹配 → prefix="/dashboard" + router路径="/stats"
                    ↓
3. routers/dashboard.py → get_stats() 函数执行
                    ↓
4. dependencies.get_db() → 创建数据库会话
                    ↓
5. models.py → 查询数据表
                    ↓
6. 返回 JSON 响应
```
## 六、常用命令
```bash
# 开发模式启动（热重载）
uvicorn app.main:app --reload --port 8001

# 生产模式启动
uvicorn app.main:app --host 0.0.0.0 --port 8001

# 查看 API 文档
浏览器打开 http://localhost:8001/docs

# 查看健康状态
curl http://localhost:8001/health
```

## 七 与django的对比
| 功能   | django                     | fastapi                       | 说明  |
| :--- | :------------------------- | :---------------------------- | :-- |
| 创建项目 | django-admin startproject  | 手动创建项目                        |     |
| 创建应用 | python manage.py startapp  | 手动创建                          |     |
| 运行命令 | python manage.py runserver | uvicorn app.main:app --reload |     |
| 路由注册 | urls.py                    | `main.py` 中 `include_router`  |     |
| 视图   | views.py                   | routers/*.py                  |     |
| 模型   | models.py                  | models.py                     |     |
| 配置   | settings.py                | config.py + .env              |     |

## 八 总结
|层级|文件|职责|
|---|---|---|
|**入口层**|`main.py`|创建 app，注册路由|
|**配置层**|`config.py` + `.env`|管理配置|
|**数据层**|`models.py` + `dependencies.py`|数据库连接和模型|
|**视图层**|`routers/*.py`|处理请求，返回响应|
|**工具层**|`internal/helpers.py`|通用函数|
