from rest_framework import serializers
from .models import Conversation, Message

class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ('id','role','content','sources','created_at')
        read_only_fields = ('id','created_at')

class ConversationSerializer(serializers.ModelSerializer):
    messages = MessageSerializer(many=True, read_only=True)
    message_count = serializers.SerializerMethodField()
    class Meta:
        model = Conversation
        fields = ('id','title','messages','message_count','created_at','updated_at')
        read_only_fields = ('id','created_at','updated_at')
    def get_message_count(self, obj):
        return obj.messages.count()

class ConversationListSerializer(serializers.ModelSerializer):
    message_count = serializers.SerializerMethodField()
    class Meta:
        model = Conversation
        fields = ('id','title','message_count','created_at','updated_at')
    def get_message_count(self, obj):
        return obj.messages.count()
