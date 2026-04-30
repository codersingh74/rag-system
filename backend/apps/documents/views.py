import os
from django.conf import settings
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Document
from .serializers import DocumentSerializer

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def document_list_create(request):
    if request.method == 'GET':
        docs = Document.objects.filter(user=request.user)
        return Response(DocumentSerializer(docs, many=True).data)

    file = request.FILES.get('file')
    if not file:
        return Response({'error': 'No file provided.'}, status=400)
    if not file.name.lower().endswith('.pdf'):
        return Response({'error': 'Only PDF files are accepted.'}, status=400)
    if file.size > settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024:
        return Response({'error': f'File too large. Max {settings.MAX_UPLOAD_SIZE_MB}MB.'}, status=400)

    title = request.data.get('title') or os.path.splitext(file.name)[0]
    doc = Document.objects.create(user=request.user, title=title, file=file, file_size=file.size, status='processing')

    try:
        from apps.rag.pipeline import process_document
        result = process_document(doc)
        doc.page_count = result['page_count']
        doc.chunk_count = result['chunk_count']
        doc.summary = result.get('summary', '')
        doc.status = 'ready'
    except Exception as e:
        doc.status = 'error'
        doc.error_message = str(e)
    doc.save()
    return Response(DocumentSerializer(doc).data, status=status.HTTP_201_CREATED)

@api_view(['GET', 'DELETE'])
@permission_classes([IsAuthenticated])
def document_detail(request, pk):
    try:
        doc = Document.objects.get(pk=pk, user=request.user)
    except Document.DoesNotExist:
        return Response({'error': 'Document not found.'}, status=404)

    if request.method == 'GET':
        return Response(DocumentSerializer(doc).data)

    try:
        from apps.rag.pipeline import delete_document_vectors
        delete_document_vectors(doc.id, request.user.id)
    except Exception:
        pass
    if doc.file and os.path.exists(doc.file.path):
        os.remove(doc.file.path)
    doc.delete()
    return Response({'message': 'Document deleted successfully.'}, status=204)
