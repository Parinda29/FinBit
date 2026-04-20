from django.contrib import admin
from .models import User, AuthToken


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'email', 'is_active', 'created_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('name', 'email')
    readonly_fields = ('id', 'created_at', 'updated_at')
    fieldsets = (
        ('Personal Info', {
            'fields': ('id', 'name', 'email')
        }),
        ('Permissions', {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )


@admin.register(AuthToken)
class AuthTokenAdmin(admin.ModelAdmin):
    list_display = ('key', 'user', 'created_at')
    search_fields = ('key', 'user__email', 'user__name')
    readonly_fields = ('key', 'created_at')
