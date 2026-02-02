from django.contrib import admin
from django.urls import path, include, re_path
from django.views.generic import TemplateView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.users.urls')),
    path('api/tasks/', include('apps.tasks.urls')),
    
    # Serve React for all other routes
    re_path(r'^(?!api/|admin/).*$', TemplateView.as_view(template_name='index.html')),
]