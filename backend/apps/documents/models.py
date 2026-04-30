import os
from django.db import models
from django.conf import settings

def user_upload_path(instance, filename):
    return f'user_{instance.user.id}/{filename}'

class Document(models.Model):
    STATUS_CHOICES = [
        ('uploading', 'Uploading'), ('processing', 'Processing'),
        ('ready', 'Ready'), ('error', 'Error'),
    ]
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='documents')
    title = models.CharField(max_length=255)
    file = models.FileField(upload_to=user_upload_path)
    file_size = models.PositiveIntegerField(default=0)
    page_count = models.PositiveIntegerField(default=0)
    chunk_count = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='uploading')
    error_message = models.TextField(blank=True)
    summary = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'documents'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.title} ({self.user.email})'

    @property
    def file_size_mb(self):
        return round(self.file_size / (1024 * 1024), 2)
