from django.contrib.auth.models import User
from django.db import models
from django.utils import timezone


class Task(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='tasks'
    )
    text = models.CharField(max_length=500)
    tag = models.CharField(max_length=50, blank=True, null=True)
    done = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order', '-created_at']

    def __str__(self):
        return f"{self.text[:50]}{'...' if len(self.text) > 50 else ''}"


class DoneEntry(models.Model):
    class EntryType(models.TextChoices):
        DONE = 'done', 'Done'
        LEARNED = 'learned', 'Learned'

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='done_entries'
    )
    entry_date = models.DateField(default=timezone.localdate)
    entry_type = models.CharField(max_length=20, choices=EntryType.choices)
    text = models.CharField(max_length=500)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-entry_date', '-created_at']

    def __str__(self):
        return f"{self.entry_date} · {self.entry_type}: {self.text[:40]}"
