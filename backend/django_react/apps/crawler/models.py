from django.db import models
from django.utils import timezone
# Create your models here.


class SsrOneMovies(models.Model):
    '''
    电影数据
    后期相同的类型可以添加到这个库，通过类型进行判断
    '''
    id = models.AutoField(primary_key=True)
    movies_type = models.CharField(max_length=120,verbose_name='来源网站')# 主要用于后期查询分类网站
    name = models.CharField(max_length=200, verbose_name='名字')
    categories_str = models.CharField(max_length=500, verbose_name='剧情类型')
    release_date = models.DateField(null=True, blank=True, verbose_name="上映日期")
    duration = models.CharField(max_length=100,verbose_name='时长')  # ✅ 改这里
    release_date = models.CharField(max_length=50, null=True, blank=True, verbose_name="上映日期")
    score = models.DecimalField(max_digits=3, decimal_places=1, verbose_name='评分')
    drama = models.TextField(verbose_name='剧情简介')
    url = models.CharField(max_length=500, verbose_name='数据地址')
    created_at = models.DateTimeField(default=timezone.now,verbose_name='抓取时间')

    class Meta:
        db_table = 'ssr_one_movies'
        verbose_name = '电影数据'
        verbose_name_plural = verbose_name


    def __str__(self):
        return self.name

class Crawler(models.Model):
    '''
    爬虫任务表
    1. 表中主要存储操作的用户，id，name，email，
    2. 操作类型，启动和停止
    3. 操作时间
    4. 爬虫类类型，是否成功，异常日志
    '''

    STATUS_CHOICES = [
        ('running', '运行中'),
        ('completed', '已完成'),
        ('stopped', '已停止'),
        ('failed', '失败'),
    ]

    # 用户信息（从前端的token中获取）
    user_id = models.IntegerField(verbose_name='用户id')
    user_name = models.CharField(max_length=50, verbose_name='用户名')
    email = models.EmailField(verbose_name='邮箱')  # 去掉 unique=True，因为同一个用户可以多次操作

    # 数据类型
    spider_type = models.CharField(max_length=50, verbose_name='爬虫类型')  # movie/news/novel
    source = models.CharField(max_length=100, verbose_name='来源')  # 来源网站 ssr1/ssr2/douban

    # 用户的操作
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='running', verbose_name='任务状态')

    # 时间字段
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='操作时间')
    start_time = models.DateTimeField(null=True, blank=True, verbose_name='任务开始时间')
    stop_time = models.DateTimeField(null=True, blank=True, verbose_name='手动停止时间')
    completed_time = models.DateTimeField(null=True, blank=True, verbose_name='自然完成时间')

    # 统计字段
    items_count = models.IntegerField(default=0, verbose_name='抓取数量')
    total_expected = models.IntegerField(default=0, verbose_name='预期总数')

    # 异常信息（可选，只有失败时才有）
    error_info = models.JSONField(default=list, blank=True, null=True,verbose_name='异常信息，数据解构是列表【{字典}】')

    class Meta:
        db_table = 'crawler_task'
        ordering = ['-created_at']  # 按创建时间倒序
        verbose_name = '爬虫任务'
        verbose_name_plural = '爬虫任务'

    def __str__(self):
        return f"{self.user_name} - {self.spider_type} - {self.get_status_display()}"