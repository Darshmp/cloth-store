import razorpay
from django.conf import settings
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
import hmac
import hashlib
import json

from orders.models import Order
from .models import Payment
from .serializers import CreateOrderSerializer, VerifyPaymentSerializer

class PaymentViewSet(viewsets.GenericViewSet):
    permission_classes = [IsAuthenticated]
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.client = razorpay.Client(auth=(
            settings.RAZORPAY_KEY_ID,
            settings.RAZORPAY_KEY_SECRET
        ))

    @action(detail=False, methods=['post'])
    def create_order(self, request):
        """Create Razorpay order"""
        serializer = CreateOrderSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            order = get_object_or_404(Order, 
                id=serializer.validated_data['order_id'],
                user=request.user
            )
            
            # Create Razorpay order
            razorpay_order = self.client.order.create({
                'amount': int(order.total * 100),  # Convert to paise
                'currency': 'INR',
                'payment_capture': 1
            })
            
            # Save payment record
            payment = Payment.objects.create(
                order=order,
                user=request.user,
                razorpay_order_id=razorpay_order['id'],
                amount=order.total,
                status='created'
            )
            
            return Response({
                'key': settings.RAZORPAY_KEY_ID,
                'amount': razorpay_order['amount'],
                'currency': razorpay_order['currency'],
                'order_id': razorpay_order['id'],
                'order': order.id
            })
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def verify_payment(self, request):
        """Verify Razorpay payment signature"""
        serializer = VerifyPaymentSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            payment = get_object_or_404(Payment,
                razorpay_order_id=serializer.validated_data['razorpay_order_id'],
                user=request.user
            )
            
            # Verify signature
            generated_signature = hmac.new(
                bytes(settings.RAZORPAY_KEY_SECRET, 'utf-8'),
                bytes(f"{serializer.validated_data['razorpay_order_id']}|{serializer.validated_data['razorpay_payment_id']}", 'utf-8'),
                hashlib.sha256
            ).hexdigest()
            
            if generated_signature == serializer.validated_data['razorpay_signature']:
                payment.razorpay_payment_id = serializer.validated_data['razorpay_payment_id']
                payment.razorpay_signature = serializer.validated_data['razorpay_signature']
                payment.status = 'captured'
                payment.save()
                
                # Update order payment status
                order = payment.order
                order.payment_status = 'paid'
                order.save()
                
                return Response({'success': True})
            else:
                payment.status = 'failed'
                payment.save()
                return Response({'error': 'Invalid signature'}, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)