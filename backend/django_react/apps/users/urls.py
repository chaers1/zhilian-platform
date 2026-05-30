from django.urls import path
from apps.users import views
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    # 首页接口
        # api/users/
        path("register", views.UserRegisterView.as_view(), name='register'),
        path("login", views.UserLoginView.as_view(), name='login'),
        path("logout", views.UserLogoutView.as_view(), name='logout'),
        path("profile", views.UserProfileView.as_view(), name='profile'),
]
