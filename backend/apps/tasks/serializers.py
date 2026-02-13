from rest_framework import serializers
from django.db import models
from django.db.models import Max
from .models import Task


class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = ('id', 'text', 'tag', 'scheduled_for', 'done', 'order', 'created_at')
        read_only_fields = ('id', 'created_at')

    def create(self, validated_data):
        user = self.context['request'].user
        validated_data['user'] = user
        current_max = (
            Task.objects.filter(user=user).aggregate(max_order=Max('order')).get('max_order')
        )
        validated_data['order'] = (current_max if current_max is not None else -1) + 1

        return super().create(validated_data)


class ReorderSerializer(serializers.Serializer):
    task_ids = serializers.ListField(
        child=serializers.IntegerField(),
        help_text="List of task IDs in the desired order"
    )
