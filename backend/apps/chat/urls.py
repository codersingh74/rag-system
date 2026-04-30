from django.urls import path
from .views import conversation_list_create, conversation_detail, send_message, send_message_sync
urlpatterns = [
    path('', conversation_list_create, name='conversation-list'),
    path('<int:pk>/', conversation_detail, name='conversation-detail'),
    path('<int:conv_id>/message/', send_message, name='send-message'),
    path('<int:conv_id>/message/sync/', send_message_sync, name='send-message-sync'),
]
