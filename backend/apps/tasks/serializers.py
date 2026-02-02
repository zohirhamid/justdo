from rest_framework import serializers
from django.db import models
from .models import Task


class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = ('id', 'text', 'tag', 'done', 'order', 'created_at')
        read_only_fields = ('id', 'created_at')

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        
        # Set order to 0 (top of list) for new tasks
        validated_data['order'] = 0
        
        # Increment order of existing tasks
        Task.objects.filter(user=validated_data['user']).update(
            order=models.F('order') + 1
        )
        
        return super().create(validated_data)


class ReorderSerializer(serializers.Serializer):
    task_ids = serializers.ListField(
        child=serializers.IntegerField(),
        help_text="List of task IDs in the desired order"
    )