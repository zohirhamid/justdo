from rest_framework import serializers
from django.db import models
from .models import Task


class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = ('id', 'text', 'tag', 'scheduled_for', 'done', 'order', 'created_at')
        read_only_fields = ('id', 'created_at')

    def create(self, validated_data):
        user = self.context['request'].user
        print("Creating task for user:", user)
        print("Validated data:", validated_data)

        validated_data['user'] = user
        validated_data['order'] = 0

        Task.objects.filter(user=user).update(order=models.F('order') + 1)

        return super().create(validated_data)


class ReorderSerializer(serializers.Serializer):
    task_ids = serializers.ListField(
        child=serializers.IntegerField(),
        help_text="List of task IDs in the desired order"
    )