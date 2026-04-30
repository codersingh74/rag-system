from django.contrib import admin
from .models import Document

@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'status', 'page_count', 'chunk_count', 'created_at')
    list_filter = ('status',)
    search_fields = ('title', 'user__email')
