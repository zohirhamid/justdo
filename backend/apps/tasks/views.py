from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import fields   # only needed if you want to compare exactly
from .models import Task
from .serializers import TaskSerializer, ReorderSerializer
from core.permissions import IsOwner


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

        # Tell type checker: after successful validation → it's a dict
        assert isinstance(serializer.validated_data, dict), "validated_data should be dict after is_valid(raise_exception=True)"

        task_ids = serializer.validated_data['task_ids']

        # Existence + ownership check (using values_list is efficient)
        existing_ids = set(
            Task.objects.filter(
                user=request.user,
                id__in=task_ids
            ).values_list('id', flat=True)
        )

        if len(existing_ids) != len(task_ids):
            return Response(
                {"error": "Some task IDs are invalid or do not belong to you"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Optional: early exit if list is empty (depends on your business rule)
        if not task_ids:
            return Response({"status": "ok"})

        # Bulk update in a transaction-safe way
        for index, task_id in enumerate(task_ids):
            Task.objects.filter(
                id=task_id,           # already checked → safe
                user=request.user     # extra defense in depth
            ).update(order=index)

        return Response({"status": "ok"})