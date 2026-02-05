from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from core.permissions import IsOwner

from .models import DoneEntry, Task
from .serializers import DoneEntrySerializer, ReorderSerializer, TaskSerializer


class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated, IsOwner]
    queryset = Task.objects.all()

    def get_queryset(self):
        return super().get_queryset().filter(user=self.request.user)

    @action(detail=False, methods=['post'])
    def reorder(self, request):
        serializer = ReorderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        task_ids = serializer.validated_data['task_ids']
        existing_ids = set(
            Task.objects.filter(user=request.user, id__in=task_ids).values_list('id', flat=True)
        )

        if len(existing_ids) != len(task_ids):
            return Response(
                {'error': 'Some task IDs are invalid or do not belong to you'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not task_ids:
            return Response({'status': 'ok'})

        for index, task_id in enumerate(task_ids):
            Task.objects.filter(id=task_id, user=request.user).update(order=index)

        return Response({'status': 'ok'})


class DoneEntryViewSet(viewsets.ModelViewSet):
    serializer_class = DoneEntrySerializer
    permission_classes = [IsAuthenticated, IsOwner]
    queryset = DoneEntry.objects.all()

    def get_queryset(self):
        queryset = super().get_queryset().filter(user=self.request.user)
        date_param = self.request.query_params.get('entry_date')
        if date_param:
            queryset = queryset.filter(entry_date=date_param)
        return queryset
