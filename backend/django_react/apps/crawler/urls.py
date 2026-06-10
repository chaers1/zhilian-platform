from django.urls import path
from apps.crawler import views

urlpatterns = [

    # 启动爬虫
    path("spider_start", views.SpiderOperationView.as_view(), name='spider_start'),
    path('taskhistory',views.TaskHistoryView.as_view(), name='TaskHistory'),
]
