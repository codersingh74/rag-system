from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .pipeline import similarity_search

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def search_view(request):
    query = request.data.get('query', '')
    if not query:
        return Response({'error': 'Query is required.'}, status=400)
    try:
        results = similarity_search(query, request.user.id)
        return Response({'query': query, 'results': [
            {'content': r.page_content, 'metadata': r.metadata, 'source': r.metadata.get('doc_title','Unknown')}
            for r in results
        ]})
    except ValueError as e:
        return Response({'error': str(e)}, status=400)
