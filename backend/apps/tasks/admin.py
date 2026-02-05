from django.contrib import admin

from .models import DoneEntry, Task


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ('text', 'user', 'tag', 'done', 'order', 'created_at')
    list_filter = ('done', 'tag', 'user')
    search_fields = ('text', 'tag')
    ordering = ('user', 'order')


@admin.register(DoneEntry)
class DoneEntryAdmin(admin.ModelAdmin):
    list_display = ('entry_date', 'entry_type', 'text', 'user', 'created_at')
    list_filter = ('entry_type', 'entry_date', 'user')
    search_fields = ('text',)
    ordering = ('-entry_date', '-created_at')
