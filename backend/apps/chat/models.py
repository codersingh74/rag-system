from django.db import models
from django.conf import settings

class Conversation(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='conversations')
    title = models.CharField(max_length=255, default='New Chat')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta:
        db_table = 'conversations'
        ordering = ['-updated_at']
    def __str__(self):
        return f'{self.title} ({self.user.email})'

class Message(models.Model):
    ROLE_CHOICES = [('user','User'),('assistant','Assistant')]
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    content = models.TextField()
    sources = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        db_table = 'messages'
        ordering = ['created_at']
    def __str__(self):
        return f'[{self.role}] {self.content[:60]}'
