"""
File: orchestrator.py
爬虫调度器（增强版）
保证 stop 后可以立即 start

作用：监听 Redis 指令，管理爬虫进程的启动和停止
"""

import redis
import time
import sys
import subprocess


class SpiderOrchestrator:
    """爬虫调度器 - 统一管理所有爬虫的启动和停止"""

    def __init__(self):
        self.redis_client = redis.Redis(
            host='localhost',
            port=6379,
            decode_responses=True
        )

        self.spiders = {
            'movie': 'cqc_ssr1',
        }

        self.running_processes = {}

    def clear_stop(self, spider_name: str):
        """清除停止信号"""
        self.redis_client.delete(f"spider:{spider_name}:stop_flag")

    def start_spider(self, spider_name: str):
        """启动爬虫"""
        if spider_name not in self.spiders:
            print(f"❌ 未知爬虫: {spider_name}")
            return

        # 检查旧进程
        process = self.running_processes.get(spider_name)
        if process:
            retcode = process.poll()
            if retcode is None:
                print(f"⚠️ {spider_name} 进程还在运行，先强制终止")
                process.terminate()
                try:
                    process.wait(timeout=5)
                    print(f"✅ {spider_name} 旧进程已终止")
                except subprocess.TimeoutExpired:
                    print(f"⚠️ {spider_name} 旧进程终止超时")
                del self.running_processes[spider_name]
            else:
                del self.running_processes[spider_name]

        # 清除停止信号
        self.clear_stop(spider_name)

        # 启动新爬虫
        spider_file = f"{self.spiders[spider_name]}.py"
        process = subprocess.Popen(
            [sys.executable, spider_file],
            stdout=None,
            stderr=None,
            shell=False
        )
        self.running_processes[spider_name] = process
        print(f"▶️ 爬虫已启动: {spider_name} (PID: {process.pid})")

        # ✅ 状态由爬虫自己更新，调度器不干预

    def stop_spider(self, spider_name: str, timeout: int = 15):
        """停止爬虫"""
        if spider_name not in self.spiders:
            print(f"❌ 未知爬虫: {spider_name}")
            return

        # 设置停止信号
        self.redis_client.set(f"spider:{spider_name}:stop_flag", "1")
        print(f"⏹️ 正在停止爬虫: {spider_name}")

        # 等待进程退出
        process = self.running_processes.get(spider_name)
        if process:
            start_time = time.time()
            while True:
                retcode = process.poll()
                if retcode is not None:
                    print(f"✅ 爬虫已停止: {spider_name}")
                    print(f"💚 调度器继续运行，等待下一条指令...")
                    break
                elif time.time() - start_time > timeout:
                    print(f"⚠️ {spider_name} 停止超时，强制终止")
                    process.terminate()
                    break
                time.sleep(0.5)

            if spider_name in self.running_processes:
                del self.running_processes[spider_name]

    def run(self):
        """主循环 - 监听 Redis 指令队列"""
        print("🚀 爬虫调度器启动")
        print(f"📋 已注册爬虫: {list(self.spiders.keys())}")
        print("💡 等待指令...")

        while True:
            try:
                command = self.redis_client.rpop("spider:commands")

                if command:
                    print(f"📨 收到指令: {command}")

                    parts = command.split(':')
                    if len(parts) == 2:
                        spider_name, action = parts

                        if action == 'start':
                            self.start_spider(spider_name)
                        elif action == 'stop':
                            self.stop_spider(spider_name)
                        else:
                            print(f"❌ 未知动作: {action}")

                time.sleep(0.5)

            except KeyboardInterrupt:
                print("\n🛑 调度器正在关闭...")
                for spider in list(self.running_processes.keys()):
                    self.stop_spider(spider)
                break
            except Exception as e:
                print(f"❌ 调度器异常: {e}")
                time.sleep(1)


def main():
    orchestrator = SpiderOrchestrator()
    orchestrator.run()


if __name__ == '__main__':
    main()