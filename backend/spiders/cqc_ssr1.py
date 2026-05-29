"""
File: cqc_ssr1.py
慢速站点异步爬虫（任务驱动版）
作者：张志刚
爬虫任务练习，mysql数据库保存
"""
###################################### 模块 ##################################################################
import random
import aiohttp
import asyncio
from fake_useragent import UserAgent
import logging
import ssl
from typing import Optional, Dict, Tuple
from lxml import etree
import aiomysql
from datetime import datetime
from redis_config import redis_client, redis_helper

#################################################### 全局变量 ################################################
BASE_URL = 'https://ssr2.scrape.center'


###################################### logging和ssl配置 #######################################################

def logger_config():
    logging.basicConfig(level=logging.INFO,
                        format='%(asctime)s - %(filename)s - %(levelname)s - %(message)s')
    return logging.getLogger()


def ssl_config():
    ssl_context = ssl.create_default_context()
    ssl_context.check_hostname = False
    ssl_context.verify_mode = ssl.CERT_NONE
    return ssl_context


###################################### 爬虫核心 #######################################################


class AsyncScraper(object):

    def __init__(self,
                 retry: int = 5,
                 time_sleep: Tuple[float, float] = (0.5, 1.5),
                 timeout=aiohttp.ClientTimeout(total=30, connect=10),
                 headers: Dict[str, str] = None,
                 semaphore: Optional[int] = 5,
                 logger: Optional[logging.Logger] = None,
                 ssl_context: Optional[ssl.SSLContext] = None,
                 ua: Optional[UserAgent] = None,
                 limit_per_host: int = 10,
                 limit: int = 3,
                 redis_logger=None):

        self.retry = retry
        self.time_sleep = time_sleep
        self.timeout = timeout
        self.headers = headers
        self.ua = ua or UserAgent()
        self.session = None
        self.semaphore = asyncio.Semaphore(semaphore)
        self.ssl_context = ssl_context or ssl.create_default_context()
        self.logger = logger or logging.getLogger()
        self.connector = aiohttp.TCPConnector(ssl=self.ssl_context, limit_per_host=limit_per_host, limit=limit)
        self.redis_logger = redis_logger

    def _log(self, level, message):
        if self.redis_logger:
            self.redis_logger.add_log(level, message)

    async def _fetch(self, url: str):
        for attempt in range(self.retry):
            try:
                async with self.semaphore:
                    curent_headers = self.headers.copy()
                    curent_headers['User-Agent'] = self.ua.random
                    self._log(level='info', message=f'请求{url}')

                    async with self.session.get(url, headers=curent_headers, timeout=self.timeout) as response:
                        self.logger.info(f'响应状态码{response.status}')
                        if 200 <= response.status < 300:
                            await asyncio.sleep(random.uniform(*self.time_sleep))
                            return await response.text()
                        elif response.status < 429:
                            await asyncio.sleep(random.uniform(*self.time_sleep))
                            self._log(level='warning', message=f'{response.status}重试{attempt + 1}次')
                            continue
            except Exception as e:
                self._log(level='error', message=f'请求{e}异常')
        return None

    async def start(self):
        self.session = aiohttp.ClientSession(connector=self.connector, timeout=self.timeout)
        self._log(level='info', message='爬虫启动')

    async def close(self):
        await self.session.close()
        self._log(level='info', message='爬虫关闭')


############################################### 任务结构 #############################################

def make_task(task_type, data):
    return {'task_type': task_type, 'data': data}


############################################### 解析 #############################################

def def_next_urls(response_text):
    if not response_text:
        return []
    html = etree.HTML(response_text)
    if html is None:
        return []
    return html.xpath('//a[@class="name"]/@href')


def dict_data(response_text, url, redis_logger) -> dict:
    def _log(level, message):
        if redis_logger:
            redis_logger.add_log(level, message)

    if not response_text:
        return {}

    html = etree.HTML(response_text)

    if html is None:
        _log(level='error', message='解析失败')
        return {}

    try:
        name = html.xpath('//h2[@class="m-b-sm"]/text()')
        categories = html.xpath(
            '//*[contains(@class, "categories")]//button[contains(@class, "el-button")]//span/text()')
        info_spans = html.xpath("//div[@class='m-v-sm info']/span/text()")
        score = html.xpath('//p[@class="score m-t-md m-b-n-sm"]/text()')
        drama = html.xpath('//*[contains(@class, "drama")]/p[1]/text()')

        detail_dict = {
            'movies_type': 'ssr1',  # 固定数据，主要是却别网站的来源
            'name': name[0] if name else None,
            'categories_str': ','.join([cat.strip() for cat in categories] if categories else []),
            'region': info_spans[0].strip() if len(info_spans) > 0 else '未知',
            'duration': info_spans[2].strip() if len(info_spans) > 2 else '未知',
            'score': score[0].strip() if score else '0.0',
            'drama': drama[0].strip() if drama else '',
            'url': url
        }
        _log(level='info', message=f'成功解析电影{detail_dict["name"]}')

        return detail_dict
    except Exception as e:
        _log(level='warning', message=f'解析电视信息出错{e}')
        return {}


######################################## 保存 MySQL（替换原来的 MongoPipeline）###########################################


class MySQLPipeline:
    """MySQL 存储管道"""

    def __init__(self):
        self.pool = None
        self.save_count = 0
        # ✅ 添加统计变量
        self.total_expected = 0  # 预期总数
        self.pages_stats = {}  # 每页统计
        # Redis 日志
        self.redis_client = redis_client
        self.logs_key = "spider:movie:logs"

    def add_log(self, level: str, message: str):
        log = f"{datetime.now().strftime('%H:%M:%S')}|{level}|{message}"
        self.redis_client.lpush(self.logs_key, log)
        self.redis_client.ltrim(self.logs_key, 0, 49)
        print('redis_logs:', log)

    async def open(self):
        """打开数据库连接"""
        self.pool = await aiomysql.create_pool(
            host='localhost',
            port=3306,
            user='root',
            password='qazwsx@123',
            db='dingban_backend',
            autocommit=True,
            minsize=5,
            maxsize=10,
        )
        self.add_log('success', 'MySQL 连接成功')

    async def save(self, item):
        """保存单条数据到 MySQL"""
        if not item or not item.get('name'):
            return

        async with self.pool.acquire() as conn:
            async with conn.cursor() as cur:
                sql = """
                    INSERT INTO ssr_one_movies (movies_type, name, categories_str, region, duration, score, drama, url, created_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                """
                await cur.execute(sql, (
                    item.get('movies_type', 'ssr1'),
                    item.get('name'),
                    item.get('categories_str', ''),
                    item.get('region', ''),
                    item.get('duration', ''),
                    item.get('score', '0'),
                    item.get('drama', ''),
                    item.get('url'),
                    datetime.now(),
                ))
                self.save_count += 1
                self.add_log('success', f'保存成功: {item.get("name")}')

                # ✅ 更新统计信息到 Redis
                progress_percent = (self.save_count / self.total_expected * 100) if self.total_expected > 0 else 0
                self.redis_client.hset("spider:movie:status", "current_count", str(self.save_count))
                self.redis_client.hset("spider:movie:status", "progress_percent", f"{progress_percent:.1f}%")
                self.redis_client.hset("spider:movie:status", "progress_info",
                                       f"已完成 {self.save_count}/{self.total_expected} ({progress_percent:.1f}%)")

    async def update_page_stats(self, page_num: int, detail_count: int):
        """更新每页的统计信息"""
        self.pages_stats[page_num] = detail_count
        self.total_expected = sum(self.pages_stats.values())

        # 更新到 Redis
        self.redis_client.hset("spider:movie:status", "total_expected", str(self.total_expected))
        self.redis_client.hset("spider:movie:status", f"page_{page_num}", str(detail_count))
        self.redis_client.hset("spider:movie:status", "pages_completed",
                               f"{len(self.pages_stats)}/10")

        self.add_log('info', f'第{page_num}页统计: {detail_count}个详情页，累计预期: {self.total_expected}')

    async def get_final_statistics(self):
        """获取最终统计信息"""
        stats = {
            'total_expected': self.total_expected,
            'total_saved': self.save_count,
            'success_rate': f"{(self.save_count / self.total_expected * 100):.1f}%" if self.total_expected > 0 else "0%",
            'pages_detail': self.pages_stats
        }
        return stats

    async def close(self):
        """关闭数据库连接"""
        if self.pool:
            self.pool.close()
            await self.pool.wait_closed()

            # ✅ 输出最终统计
            stats = await self.get_final_statistics()
            print(f'📊 最终统计:')
            print(f'   预期总数: {stats["total_expected"]}')
            print(f'   实际保存: {stats["total_saved"]}')
            print(f'   成功率: {stats["success_rate"]}')
            print(f'   每页详情: {stats["pages_detail"]}')
            print(f'一共保存了 {self.save_count} 条')
            print("🔌 MySQL 连接已关闭")


############################################### Worker #############################################

async def worker(name, queue, scraper, logger, mysql_pipeline):
    # ✅ 添加本地计数变量
    save_count = 0
    # ✅ 添加任务类型统计
    page_count = 0
    detail_count = 0

    while True:
        # 调度器停止信号
        if redis_client.get("spider:movie:stop_flag") == "1":
            logger.info(f'{name} 收到 Redis 停止信号，退出')
            while not queue.empty():
                try:
                    queue.get_nowait()
                    queue.task_done()
                except:
                    break
            break

        task = await queue.get()

        if task is None:
            logger.info(f'{name}退出')
            logger.info(f'{name} 统计: 处理了{page_count}个页面, {detail_count}个详情, 保存了{save_count}条')
            queue.task_done()
            break

        try:
            logger.info(f'{name}拿到任务{task}')
            task_type = task['task_type']
            url = task['data']

            if task_type == 'page':
                html = await scraper._fetch(url)
                if html:
                    paths = def_next_urls(html)
                    page_count += 1

                    # ✅ 提取页码
                    import re
                    page_match = re.search(r'/page/(\d+)', url)
                    page_num = int(page_match.group(1)) if page_match else 0

                    # ✅ 更新页面统计到 pipeline
                    await mysql_pipeline.update_page_stats(page_num, len(paths))

                    for p in paths:
                        full_url = BASE_URL + p
                        await queue.put(make_task('detail', full_url))
                    logger.info(f'{name} 页面 {url} 解析出 {len(paths)} 个详情页')

            elif task_type == 'detail':
                html = await scraper._fetch(url)
                if html:
                    detail_count += 1
                    logger.info(f'详情页面抓取成功：{url},准备解析')
                    item = dict_data(response_text=html, url=url, redis_logger=mysql_pipeline)
                    if item and item.get('name'):
                        await mysql_pipeline.save(item)
                        # ✅ 每保存一条，计数+1，并更新到 Redis
                        save_count += 1
                        logger.info(f'{name} 成功保存电影: {item["name"]}, 个人累计: {save_count}')
                    else:
                        logger.warning(f'{name} 解析 {url} 返回空数据')
                else:
                    logger.warning(f'{name} 抓取 {url} 失败')
        except Exception as e:
            logger.error(f'{name} 处理任务时出错: {e}', exc_info=True)
        finally:
            queue.task_done()
            logger.info(f'{name} 完成任务: {task["task_type"]} - {task["data"]}')


############################################### main #############################################

async def main():
    logger = logger_config()
    ssl_context = ssl_config()
    UA = UserAgent()

    headers = {
        'User-Agent': None,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.8,en-US;q=0.5,en;q=0.3',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
    }

    queue = asyncio.Queue()
    mysql_pipeline = MySQLPipeline()

    scraper = AsyncScraper(
        headers=headers,
        logger=logger,
        ssl_context=ssl_context,
        ua=UA,
        redis_logger=mysql_pipeline,
    )

    await scraper.start()
    await mysql_pipeline.open()

    logger.info('爬虫启动')

    # ✅ 更新 Redis 状态为 running
    try:
        redis_client.hset("spider:movie:status", "status", "running")
        redis_client.hset("spider:movie:status", "start_time", datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
        redis_client.hset("spider:movie:status", "current_count", "0")
        redis_client.hset("spider:movie:status", "total_expected", "正在统计...")
        redis_client.hset("spider:movie:status", "progress_percent", "0%")
        redis_client.hset("spider:movie:status", "progress_info", "准备开始...")
        redis_client.hset("spider:movie:status", "pages_completed", "0/10")
        logger.info('Redis 状态已更新: running')
    except Exception as e:
        logger.error(f'更新 Redis 状态失败: {e}')

    # ✅ 第一阶段：先统计总任务数（预扫描）
    logger.info('=' * 50)
    logger.info('开始预扫描，统计任务总数...')
    logger.info('=' * 50)

    for i in range(1, 11):
        url = BASE_URL + '/page/' + str(i)
        logger.info(f'预扫描第{i}页: {url}')
        html = await scraper._fetch(url)
        if html:
            paths = def_next_urls(html)
            await mysql_pipeline.update_page_stats(i, len(paths))
            logger.info(f'第{i}页发现 {len(paths)} 个详情页')
        else:
            logger.warning(f'第{i}页获取失败')

    total_expected = mysql_pipeline.total_expected
    logger.info('=' * 50)
    logger.info(f'预扫描完成！预计总任务数: {total_expected}')
    logger.info(f'每页详情: {mysql_pipeline.pages_stats}')
    logger.info('=' * 50)

    # 更新 Redis 统计信息
    redis_client.hset("spider:movie:status", "total_expected", str(total_expected))
    redis_client.hset("spider:movie:status", "progress_info", f"预计 {total_expected} 个详情页待抓取")

    # ✅ 第二阶段：创建 workers
    workers = [
        asyncio.create_task(worker(f'worker-{i}', queue, scraper, logger, mysql_pipeline))
        for i in range(5)
    ]

    # ✅ 第三阶段：投放页面任务
    for i in range(1, 11):
        url = BASE_URL + '/page/' + str(i)
        await queue.put(make_task('page', url))

    logger.info(f"初始任务投放完成: {queue.qsize()} 个页面任务")
    logger.info(f"等待抓取 {total_expected} 个详情页...")

    await queue.join()

    # 发送停止信号给 workers
    for _ in workers:
        await queue.put(None)

    # 等待所有 workers 真正结束
    await asyncio.gather(*workers)
    logger.info('所有 workers 已退出')

    await scraper.close()

    # ✅ 获取最终统计
    final_stats = await mysql_pipeline.get_final_statistics()

    await mysql_pipeline.close()

    # ✅ 更新最终状态
    try:
        stop_flag = redis_client.get("spider:movie:stop_flag")

        # 更新详细统计
        redis_client.hset("spider:movie:status", "final_count", str(final_stats['total_saved']))
        redis_client.hset("spider:movie:status", "success_rate", final_stats['success_rate'])
        redis_client.hset("spider:movie:status", "completed_at", datetime.now().strftime("%Y-%m-%d %H:%M:%S"))

        if stop_flag == "1":
            redis_client.hset("spider:movie:status", "status", "stopped")
            logger.info('Redis 状态已更新: stopped (用户停止)')
        else:
            redis_client.hset("spider:movie:status", "status", "idle")
            logger.info('Redis 状态已更新: idle (正常完成)')

        # 输出最终统计
        logger.info('=' * 50)
        logger.info('爬虫任务完成！最终统计:')
        logger.info(f'  预期总数: {final_stats["total_expected"]}')
        logger.info(f'  实际保存: {final_stats["total_saved"]}')
        logger.info(f'  成功率: {final_stats["success_rate"]}')
        logger.info(f'  每页详情: {final_stats["pages_detail"]}')
        logger.info('=' * 50)

    except Exception as e:
        logger.error(f'更新最终状态失败: {e}')

    logger.info('爬虫结束')


async def run():
    """调度器调用的入口函数"""
    logger = logger_config()
    try:
        await main()
    except Exception as e:
        # ✅ 异常时更新状态
        try:
            redis_client.hset("spider:movie:status", "status", "stopped")
            redis_client.hset("spider:movie:status", "error", str(e))
            redis_client.hset("spider:movie:status", "completed_at", datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
            logger.error(f'爬虫异常退出: {e}')
        except:
            pass
        raise


if __name__ == '__main__':
    asyncio.run(main())