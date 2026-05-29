# Create your models here.

from django.db import models


class User(models.Model):

    first_name = models.CharField(max_length=50, verbose_name='姓名')
    email = models.EmailField(unique=True, verbose_name='邮箱')
    phone = models.CharField(max_length=11, unique=True, verbose_name='手机号')
    password = models.CharField(max_length=255, verbose_name='密码')

    # 新增字段
    department = models.CharField(max_length=100,blank=True,null=True,verbose_name='部门')
    bio = models.TextField(blank=True,null=True,verbose_name='个人简介')
    avatar = models.CharField(max_length=255,blank=True,null=True,verbose_name='头像路径')

    created_at = models.DateTimeField(auto_now_add=True, verbose_name='注册时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')

    class Meta:
        db_table = 'users_user'  # 表名
        verbose_name = '用户'
        verbose_name_plural = verbose_name  # 复数形式

    def __str__(self):
        return f"{self.first_name} - {self.email}"


class UserLoginLog(models.Model):
    # 用户登录日志表，一个用户对那对应多条记录

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='login_log',
        verbose_name='用户'
    )

    login_time = models.DateTimeField(auto_now_add=True,verbose_name='登录时间')
    logout_time = models.DateTimeField(null=True,blank=True,verbose_name='退出时间')

    class Meta:
        db_table = 'users_login_log'
        verbose_name = '登录时间'
        ordering =  ['-login_time']  # 按登录时间倒序

    def __str__(self):
        return f"{self.user} - {self.login_time}"