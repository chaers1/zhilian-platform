from django.urls import path
from apps.crawler import views

urlpatterns = [

    # 启动爬虫
    path("spider_start", views.SpiderOperationView.as_view(), name='spider_start'),
    path("spider/<str:spider_name>/status/", views.SpiderStatusView.as_view(), name='spider_status'),
]
