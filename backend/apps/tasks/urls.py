from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import DoneEntryViewSet, TaskViewSet

router = DefaultRouter()
router.register('done-entries', DoneEntryViewSet, basename='done-entry')
router.register('', TaskViewSet, basename='task')

urlpatterns = [
    path('', include(router.urls)),
]
