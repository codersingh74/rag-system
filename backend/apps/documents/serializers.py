from rest_framework import serializers
from .models import Document

class DocumentSerializer(serializers.ModelSerializer):
    file_size_mb = serializers.ReadOnlyField()
    class Meta:
        model = Document
        fields = ('id','title','file','file_size','file_size_mb','page_count',
                  'chunk_count','status','error_message','summary','created_at','updated_at')
        read_only_fields = ('id','file_size','page_count','chunk_count',
                            'status','error_message','summary','created_at','updated_at')
