from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import Task
from .serializers import TaskSerializer, ReorderSerializer
from core.permissions import IsOwner


class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated, IsOwner]

    def get_queryset(self):
        return Task.objects.filter(user=self.request.user)

    @action(detail=False, methods=['post'])
    def reorder(self, request):
        serializer = ReorderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        task_ids = serializer.validated_data['task_ids']
        
        user_tasks = Task.objects.filter(user=request.user, id__in=task_ids)
        if user_tasks.count() != len(task_ids):
            return Response(
                {'error': 'Invalid task IDs'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        for index, task_id in enumerate(task_ids):
            Task.objects.filter(id=task_id, user=request.user).update(order=index)
        
        return Response({'status': 'ok'})