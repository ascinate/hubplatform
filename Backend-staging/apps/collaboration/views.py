from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.utils import timezone
from django.shortcuts import get_object_or_404
from apps.core.models import ProductionOrder, Factory, Inspection
from .models import (
    CollaborationRoom, RoomParticipant, CollaborationMessage,
    ApprovalRequest, InspectionActivationRequest,
)
from .serializers import (
    CollaborationRoomSerializer, CollaborationMessageSerializer,
    ApprovalRequestSerializer, InspectionActivationRequestSerializer,
    CreateRoomSerializer, RoomParticipantSerializer,
)


class CollaborationRoomViewSet(viewsets.ModelViewSet):
    serializer_class = CollaborationRoomSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'post', 'head', 'options']

    def get_queryset(self):
        qs = CollaborationRoom.objects.filter(
            organization=self.request.user.organization
        ).prefetch_related('participants', 'messages')
        room_type = self.request.query_params.get('room_type')
        if room_type:
            qs = qs.filter(room_type=room_type)
        return qs

    def create(self, request, *args, **kwargs):
        serializer = CreateRoomSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        room_type = serializer.validated_data['room_type']
        entity_id = serializer.validated_data['entity_id']
        org = request.user.organization

        lookup = {'organization': org, 'room_type': room_type}
        defaults = {'created_by': request.user}

        if room_type == 'po':
            po = get_object_or_404(ProductionOrder, id=entity_id, organization=org)
            lookup['production_order'] = po
            defaults['name'] = f"PO {po.po_number or str(po.id)[:8]}"
        elif room_type == 'factory':
            factory = get_object_or_404(Factory, id=entity_id, organization=org)
            lookup['factory'] = factory
            defaults['name'] = f"Factory: {factory.name}"
        elif room_type == 'inspection':
            inspection = get_object_or_404(Inspection, id=entity_id, organization=org)
            lookup['inspection'] = inspection
            defaults['name'] = f"Inspection: {inspection.inspection_type}"

        room, created = CollaborationRoom.objects.get_or_create(
            **lookup, defaults=defaults
        )

        # Auto-add creator as participant
        RoomParticipant.objects.get_or_create(
            room=room, user=request.user,
            defaults={'participant_role': 'moderator'}
        )

        return Response(
            CollaborationRoomSerializer(room, context={'request': request}).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
        )

    @action(detail=True, methods=['get'])
    def messages(self, request, pk=None):
        room = self.get_object()
        messages = room.messages.select_related('sender').all()
        page = self.paginate_queryset(messages)
        if page is not None:
            serializer = CollaborationMessageSerializer(
                page, many=True, context={'request': request}
            )
            return self.get_paginated_response(serializer.data)
        serializer = CollaborationMessageSerializer(
            messages, many=True, context={'request': request}
        )
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def send_message(self, request, pk=None):
        room = self.get_object()
        # Ensure sender is a participant
        RoomParticipant.objects.get_or_create(
            room=room, user=request.user,
            defaults={'participant_role': 'member'}
        )
        msg = CollaborationMessage.objects.create(
            room=room,
            sender=request.user,
            message_type=request.data.get('message_type', 'text'),
            text=request.data.get('text', ''),
            metadata=request.data.get('metadata', {}),
        )

        # Process @mentions and create notifications
        from .utils import process_mentions
        process_mentions(msg, request.user, room)

        return Response(
            CollaborationMessageSerializer(msg, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )

    @action(
        detail=True, methods=['post'],
        parser_classes=[MultiPartParser, FormParser]
    )
    def upload(self, request, pk=None):
        room = self.get_object()
        attachment = request.FILES.get('attachment')
        if not attachment:
            return Response(
                {'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST
            )
        RoomParticipant.objects.get_or_create(
            room=room, user=request.user,
            defaults={'participant_role': 'member'}
        )
        msg = CollaborationMessage.objects.create(
            room=room,
            sender=request.user,
            message_type=request.data.get('message_type', 'photo'),
            text=request.data.get('text', ''),
            attachment=attachment,
            attachment_name=attachment.name,
        )
        return Response(
            CollaborationMessageSerializer(msg, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )

    @action(detail=True, methods=['get'])
    def participants(self, request, pk=None):
        room = self.get_object()
        participants = room.participants.select_related('user').all()
        serializer = RoomParticipantSerializer(participants, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def join(self, request, pk=None):
        room = self.get_object()
        participant, created = RoomParticipant.objects.get_or_create(
            room=room, user=request.user,
            defaults={'participant_role': 'member'}
        )
        return Response(
            RoomParticipantSerializer(participant).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        room = self.get_object()
        RoomParticipant.objects.filter(
            room=room, user=request.user
        ).update(last_read_at=timezone.now())
        return Response({'status': 'ok'})


class ApprovalRequestViewSet(viewsets.ModelViewSet):
    serializer_class = ApprovalRequestSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'post', 'patch', 'head', 'options']

    def get_queryset(self):
        qs = ApprovalRequest.objects.filter(
            room__organization=self.request.user.organization
        ).select_related('requested_by', 'assigned_to', 'room')
        room_id = self.request.query_params.get('room')
        if room_id:
            qs = qs.filter(room_id=room_id)
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs

    def perform_create(self, serializer):
        approval = serializer.save(requested_by=self.request.user)
        # Create the approval_request message in the room
        msg = CollaborationMessage.objects.create(
            room=approval.room,
            sender=self.request.user,
            message_type='approval_request',
            text=approval.title,
            metadata={
                'approval_id': str(approval.id),
                'assigned_to': str(approval.assigned_to.id),
                'assigned_to_name': approval.assigned_to.full_name or approval.assigned_to.email,
            },
        )
        approval.message = msg
        approval.save(update_fields=['message'])

    def partial_update(self, request, *args, **kwargs):
        approval = self.get_object()
        new_status = request.data.get('status')
        if new_status not in ('approved', 'rejected'):
            return Response(
                {'error': 'Status must be approved or rejected'},
                status=status.HTTP_400_BAD_REQUEST
            )
        approval.status = new_status
        approval.responded_at = timezone.now()
        approval.response_note = request.data.get('response_note', '')
        approval.save(update_fields=['status', 'responded_at', 'response_note'])

        # Create response message
        CollaborationMessage.objects.create(
            room=approval.room,
            sender=request.user,
            message_type='approval_response',
            text=f"{new_status.title()}: {approval.title}",
            metadata={
                'approval_id': str(approval.id),
                'status': new_status,
            },
        )

        return Response(ApprovalRequestSerializer(approval).data)


class InspectionActivationViewSet(viewsets.ModelViewSet):
    serializer_class = InspectionActivationRequestSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'post', 'patch', 'head', 'options']

    def get_queryset(self):
        return InspectionActivationRequest.objects.filter(
            room__organization=self.request.user.organization
        ).select_related('requested_by', 'responded_by', 'inspection', 'room')

    def perform_create(self, serializer):
        activation = serializer.save(requested_by=self.request.user)
        # Create activation message
        CollaborationMessage.objects.create(
            room=activation.room,
            sender=self.request.user,
            message_type='inspection_activation',
            text=f"Inspection activation requested: {activation.inspection.inspection_type}",
            metadata={
                'activation_id': str(activation.id),
                'inspection_id': str(activation.inspection.id),
            },
        )

    def partial_update(self, request, *args, **kwargs):
        activation = self.get_object()
        new_status = request.data.get('status')
        if new_status not in ('activated', 'declined'):
            return Response(
                {'error': 'Status must be activated or declined'},
                status=status.HTTP_400_BAD_REQUEST
            )
        activation.status = new_status
        activation.responded_by = request.user
        activation.responded_at = timezone.now()
        activation.save(update_fields=['status', 'responded_by', 'responded_at'])

        # System message
        CollaborationMessage.objects.create(
            room=activation.room,
            sender=request.user,
            message_type='system',
            text=f"Inspection {new_status}: {activation.inspection.inspection_type}",
            metadata={
                'activation_id': str(activation.id),
                'status': new_status,
            },
        )

        return Response(InspectionActivationRequestSerializer(activation).data)
