from django.contrib import admin
from .models import Task


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ('text', 'user', 'tag', 'done', 'order', 'created_at')
    list_filter = ('done', 'tag', 'user')
    search_fields = ('text', 'tag')
    ordering = ('user', 'order')