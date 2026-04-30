import json
from django.http import StreamingHttpResponse
from django.conf import settings
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Conversation, Message
from .serializers import ConversationSerializer, ConversationListSerializer, MessageSerializer
from .llm import get_rag_answer, answer_with_openai_stream, answer_with_huggingface
from apps.rag.pipeline import similarity_search, build_context

@api_view(['GET','POST'])
@permission_classes([IsAuthenticated])
def conversation_list_create(request):
    if request.method == 'GET':
        convs = Conversation.objects.filter(user=request.user)
        return Response(ConversationListSerializer(convs, many=True).data)
    conv = Conversation.objects.create(user=request.user, title=request.data.get('title','New Chat'))
    return Response(ConversationSerializer(conv).data, status=201)

@api_view(['GET','DELETE'])
@permission_classes([IsAuthenticated])
def conversation_detail(request, pk):
    try:
        conv = Conversation.objects.get(pk=pk, user=request.user)
    except Conversation.DoesNotExist:
        return Response({'error':'Conversation not found.'}, status=404)
    if request.method == 'GET':
        return Response(ConversationSerializer(conv).data)
    conv.delete()
    return Response({'message':'Conversation deleted.'}, status=204)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_message(request, conv_id):
    try:
        conv = Conversation.objects.get(pk=conv_id, user=request.user)
    except Conversation.DoesNotExist:
        return Response({'error':'Conversation not found.'}, status=404)
    query = request.data.get('query','').strip()
    if not query:
        return Response({'error':'Query cannot be empty.'}, status=400)

    user_msg = Message.objects.create(conversation=conv, role='user', content=query)

    # FIX: Django QuerySet negative indexing support nahi karta
    all_messages = list(conv.messages.order_by('created_at'))
    history = [{'role': m.role, 'content': m.content} for m in all_messages[:-1]]

    if conv.messages.count() == 1:
        conv.title = query[:60] + ('...' if len(query) > 60 else '')
        conv.save()

    def stream_response():
        full_answer = []
        sources = []
        try:
            docs = similarity_search(query, request.user.id, k=5)
            context, sources = build_context(docs)
            if settings.AI_PROVIDER == 'openai':
                for token in answer_with_openai_stream(query, context, history):
                    full_answer.append(token)
                    yield f'data: {json.dumps({"token":token,"type":"token"})}\n\n'
            else:
                answer = answer_with_huggingface(query, context)
                full_answer.append(answer)
                yield f'data: {json.dumps({"token":answer,"type":"token"})}\n\n'
        except ValueError as e:
            msg = str(e)
            full_answer.append(msg)
            yield f'data: {json.dumps({"token":msg,"type":"token"})}\n\n'
        final = ''.join(full_answer)
        asst_msg = Message.objects.create(conversation=conv, role='assistant', content=final, sources=sources)
        yield f'data: {json.dumps({"type":"done","sources":sources,"message_id":asst_msg.id})}\n\n'

    resp = StreamingHttpResponse(stream_response(), content_type='text/event-stream')
    resp['Cache-Control'] = 'no-cache'
    resp['X-Accel-Buffering'] = 'no'
    return resp

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_message_sync(request, conv_id):
    try:
        conv = Conversation.objects.get(pk=conv_id, user=request.user)
    except Conversation.DoesNotExist:
        return Response({'error':'Conversation not found.'}, status=404)
    query = request.data.get('query','').strip()
    if not query:
        return Response({'error':'Query cannot be empty.'}, status=400)

    Message.objects.create(conversation=conv, role='user', content=query)

    # FIX: Django QuerySet negative indexing support nahi karta
    all_messages = list(conv.messages.order_by('created_at'))
    history = [{'role': m.role, 'content': m.content} for m in all_messages[:-1]]

    result = get_rag_answer(query, request.user.id, history)
    asst_msg = Message.objects.create(conversation=conv, role='assistant', content=result['answer'], sources=result['sources'])

    if conv.messages.count() == 2:
        conv.title = query[:60]
        conv.save()

    return Response({
        'answer': result['answer'],
        'sources': result['sources'],
        'message': MessageSerializer(asst_msg).data
    })