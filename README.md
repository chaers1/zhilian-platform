# 智联爬虫平台 - 分布式爬虫管理系统
## 📖 项目简介
- 智联爬虫平台是一个分布式、微服务架构的爬虫管理系统。采用 Django + FastAPI + React 技术栈，通过 Redis 实现服务间通信，提供爬虫任务调度、数据管理、实时监控等完整功能。

## 🏗 系统架构
```text
┌─────────────────────────────────────────────────────────────┐
│                         前端层                                │
│                    React + Axios + Ant Design               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       网关/接口层                             │
│         FastAPI（高性能数据接口，实时状态查询）                 │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│    Django       │ │     Redis       │ │    爬虫服务      │
│  模型/用户管理   │ │  通讯/缓存中间件 │ │   独立爬虫进程   │
│  MySQL/ORM      │ │   状态存储      │ │   调度器控制     │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```
## ✨ 核心功能
1. 用户与权限管理（Django）
- 用户注册/登录/JWT认证
- 权限控制与角色管理
- 操作日志记录

2. 数据接口服务（FastAPI）
- 高性能数据查询接口
- 实时爬虫状态监控
- 数据统计与趋势分析
- 多条件筛选与数据导出

3. 爬虫调度器
- 独立部署的爬虫服务
- 启动/停止任务控制
- 定时任务调度
- 爬虫进程生命周期管理

4. 实时通信（Redis）
- 爬虫状态实时同步
- 实时日志推送
- 任务队列管理
- 缓存加速

## 🛠 技术栈

### 后端服务

| 服务 | 技术栈 | 版本 | 核心职责 |
|------|--------|------|----------|
| **Django** | Django + DRF | 4.2 | 模型管理、用户认证、权限控制 |
| **FastAPI** | FastAPI | 0.100+ | 高性能数据接口、实时状态查询 |
| **爬虫服务** | Python + Scrapy | 3.11+ | 数据采集、解析、存储 |
| **调度器** | APScheduler | 3.10+ | 任务调度、爬虫启停控制 |

## 基础设施
| 组件 |	用途 |
|------|-------|
| **Redis** |	服务间通信、状态缓存、日志存储|
| **MySQL **|	主要数据存储（Django 管理）|
|**PyMySQL**|	MySQL 驱动|

## 前端
|技术 |	用途|
|------|-----|
|**React**| 18	UI 框架|
|**Axios**|	HTTP 请求|
|**Ant Design**| / Tailwind	UI 组件库|

## 📁 项目结构
```text
zhilian-platform/
├── django_backend/              # Django 服务
│   ├── manage.py
│   ├── users/                   # 用户模块
│   ├── models/                  # 数据模型
│   └── api/                     # DRF API
│
├── fastapi_backend/             # FastAPI 服务
│   ├── main.py                  # 应用入口
│   ├── app/
│   │   ├── routers/             # API 路由
│   │   ├── models/              # 查询模型
│   │   ├── dependencies.py      # 依赖注入
│   │   ├── auth.py             # JWT 认证
│   │   └── redis_config.py     # Redis 配置
│   └── requirements.txt
│
├── crawler_service/             # 爬虫服务
│   ├── spiders/                 # 爬虫脚本
│   ├── scheduler.py             # 调度器
│   ├── redis_client.py          # Redis 通信
│   └── run.py                   # 启动入口
│
├── frontend/                    # React 前端
│   ├── src/
│   │   ├── pages/               # 页面组件
│   │   ├── services/            # API 服务（Axios）
│   │   ├── hooks/               # 自定义 Hooks
│   │   └── utils/
│   └── package.json
│
└── docker-compose.yml           # 容器编排（可选）
```
## 🔄 服务通信流程
- 爬虫启停流程
```text
前端 → FastAPI → Redis（发布命令）→ 调度器（订阅）→ 爬虫进程
                ↑                              ↓
                ←───────── 状态更新 ────────────
```
- 数据查询流程
```text
前端 → FastAPI → MySQL（Django 管理的表）← 爬虫写入数据
                ↓
              Redis（缓存加速）
```
## 🚀 快速开始
1. 环境要求
- Python 3.11+

- Node.js 18+

- MySQL 8.0+

- Redis 7.0+

## 启动步骤
### 1. 启动 Redis
```bash
redis-server
```
### 2. 启动 Django 服务
```bash
cd django_backend
python manage.py migrate
python manage.py runserver 8000
```
### 3. 启动 FastAPI 服务
```bash
cd fastapi_backend
uvicorn main:app --reload --port 8081
```
### 4. 启动爬虫调度器
```bash
cd crawler_service
python scheduler.py
```
### 5. 启动前端
```bash
cd frontend
npm install
npm run dev
```
## 📡 API 接口（FastAPI）
|接口	|方法	|说明|
|---|----|-------|
|/api/crawler/dashboard/stats |	GET	| 统计数据|
|/api/crawler/dashboard/{spider}/status	|GET	|爬虫状态|
|/api/crawler/dashboard/{spider}/logs|	GET|	实时日志|
|/api/crawler/dashboard/movie/data|	GET|	数据列表|
|/api/crawler/dashboard/exportcsv	|POST	|导出| CSV|
## 🔗 服务地址
|服务	|地址	|端口|
|------|-----|-----|
|React 前端	|http://localhost|	5173|
|FastAPI 接口	|http://localhost	|8081|
|Django 后台	|http://localhost|	8000|
|Redis	|localhost	|6379
|MySQL	| localhost	| 3306 
## 📊 Redis 数据结构
- 命令通道
|Key	|说明|
|----|----|
|cmd:spider:{name}:start	|启动爬虫命令|
|cmd:spider:{name}:stop	|停止爬虫命令|

### 状态存储
|Key	|类型	|说明|
|----|----|-----|
|spider:{name}:status	|Hash	|运行状态|
|spider:{name}:logs	|List	|实时日志|
### 🎯 爬虫类型
|类型	|说明	|状态|
|----|----|-----|
|movie	|电影数据爬虫	|✅ 已完成|
|news	|新闻爬虫	|🚧 |开发中|
|novel	|小说爬虫	🚧 |开发中|

## 📝 更新日志
v1.0.0 (2024-01)
✅ Django + FastAPI 微服务架构搭建

✅ Redis 服务间通信实现

✅ 爬虫启停调度器

✅ 实时状态监控

✅ 数据统计与导出

✅ React 前端界面

👥 作者
姓名：张志刚

邮箱：419239798@qq.com
