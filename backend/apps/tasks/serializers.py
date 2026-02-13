import re
from rest_framework import serializers
from django.db import models
from django.db.models import Max
from .models import Task


HASHTAG_RE = re.compile(r'(^|\s)#([A-Za-z0-9_-]{1,50})(?=\b)')


def parse_task_text_and_tag(raw_text: str):
    text = (raw_text or '')
    match = HASHTAG_RE.search(text)
    tag = match.group(2).lower() if match else None
    cleaned = HASHTAG_RE.sub(r'\1', text)
    cleaned = re.sub(r'\s{2,}', ' ', cleaned).strip()
    return cleaned, tag


class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = ('id', 'text', 'tag', 'scheduled_for', 'done', 'order', 'created_at')
        read_only_fields = ('id', 'created_at')

    def validate_tag(self, value):
        if value is None:
            return None
        tag = str(value).strip()
        if tag.startswith('#'):
            tag = tag[1:].strip()
        if tag == '':
            return None
        if len(tag) > 50:
            raise serializers.ValidationError("Tag must be 50 characters or fewer.")
        return tag.lower()

    def validate(self, attrs):
        if 'text' in attrs:
            cleaned_text, inferred_tag = parse_task_text_and_tag(attrs.get('text', ''))
            if not cleaned_text:
                raise serializers.ValidationError({'text': 'Task text cannot be empty.'})
            attrs['text'] = cleaned_text
            if 'tag' not in attrs or attrs.get('tag') in (None, ''):
                attrs['tag'] = inferred_tag
        return attrs

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
