from django.urls import path
from .views import register, login, user_detail, change_password, logout

urlpatterns = [
    path('register/', register, name='register'),
    path('login/', login, name='login'),
    path('logout/', logout, name='logout'),
    path('profile/', user_detail, name='user_detail'),
    path('change-password/', change_password, name='change_password'),
]
