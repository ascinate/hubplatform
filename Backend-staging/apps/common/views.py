from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Comment, History, Document, Notification
from .serializers import (
    CommentSerializer, HistorySerializer, DocumentSerializer, NotificationSerializer,
)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def comments_view(request):
    entity_type = request.query_params.get('entity_type', '')
    entity_id = request.query_params.get('entity_id', '')

    if request.method == 'GET':
        qs = Comment.objects.filter(entity_type=entity_type, entity_id=entity_id)
        return Response(CommentSerializer(qs, many=True).data)

    elif request.method == 'POST':
        data = request.data.copy()
        data['entity_type'] = data.get('entity_type', entity_type)
        data['entity_id'] = data.get('entity_id', entity_id)
        serializer = CommentSerializer(data=data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def history_view(request):
    entity_type = request.query_params.get('entity_type', '')
    entity_id = request.query_params.get('entity_id', '')
    qs = History.objects.filter(entity_type=entity_type, entity_id=entity_id)
    return Response(HistorySerializer(qs, many=True).data)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def documents_view(request):
    entity_type = request.query_params.get('entity_type', '')
    entity_id = request.query_params.get('entity_id', '')

    if request.method == 'GET':
        qs = Document.objects.filter(entity_type=entity_type, entity_id=entity_id)
        return Response(DocumentSerializer(qs, many=True).data)

    elif request.method == 'POST':
        data = request.data.copy()
        data['entity_type'] = data.get('entity_type', entity_type)
        data['entity_id'] = data.get('entity_id', entity_id)
        serializer = DocumentSerializer(data=data)
        if serializer.is_valid():
            serializer.save(uploaded_by=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def notifications_list(request):
    qs = Notification.objects.filter(user=request.user)
    return Response(NotificationSerializer(qs[:50], many=True).data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def notifications_unread_count(request):
    count = Notification.objects.filter(user=request.user, read=False).count()
    return Response({'unread_count': count})


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def notification_mark_read(request, notification_id):
    try:
        notif = Notification.objects.get(id=notification_id, user=request.user)
    except Notification.DoesNotExist:
        return Response({'error': 'Not found'}, status=404)
    notif.read = True
    notif.save()
    return Response(NotificationSerializer(notif).data)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def notification_mark_all_read(request):
    Notification.objects.filter(user=request.user, read=False).update(read=True)
    return Response({'success': True})
