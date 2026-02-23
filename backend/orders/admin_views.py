from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Count, Sum, Q
from datetime import datetime, timedelta
from django.utils import timezone
import random
from .models import Order
from .serializers import OrderSerializer
from users.permissions import IsAdminUser

class AdminOrderViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminUser]
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['order_status', 'payment_status', 'payment_method']
    search_fields = ['order_number', 'email', 'first_name', 'last_name', 'phone']
    ordering_fields = ['created_at', 'total']

    @action(detail=False, methods=['get'])
    def dashboard_stats(self, request):
        """Get dashboard statistics"""
        today = datetime.now().date()
        week_ago = today - timedelta(days=7)
        month_ago = today - timedelta(days=30)

        today_orders = Order.objects.filter(created_at__date=today, payment_status='paid')
        week_orders = Order.objects.filter(created_at__date__gte=week_ago, payment_status='paid')
        month_orders = Order.objects.filter(created_at__date__gte=month_ago, payment_status='paid')

        stats = {
            'today': {
                'orders': today_orders.count(),
                'revenue': float(today_orders.aggregate(Sum('total'))['total__sum'] or 0)
            },
            'week': {
                'orders': week_orders.count(),
                'revenue': float(week_orders.aggregate(Sum('total'))['total__sum'] or 0)
            },
            'month': {
                'orders': month_orders.count(),
                'revenue': float(month_orders.aggregate(Sum('total'))['total__sum'] or 0)
            },
            'total_orders': Order.objects.count(),
            'pending_orders': Order.objects.filter(order_status='pending').count(),
            'total_revenue': float(Order.objects.filter(payment_status='paid').aggregate(Sum('total'))['total__sum'] or 0)
        }
        return Response(stats)

    @action(detail=False, methods=['get'])
    def recent_orders(self, request):
        """Get recent 10 orders"""
        orders = self.queryset.order_by('-created_at')[:10]
        serializer = self.get_serializer(orders, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        """Update order status and regenerate tracking"""
        try:
            order = self.get_object()
            new_status = request.data.get('status')
            
            print(f"Updating order {order.order_number} from {order.order_status} to {new_status}")
            
            if new_status not in dict(Order.ORDER_STATUS):
                return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Update the status
            order.order_status = new_status
            
            # If order is delivered, set delivered_at
            if new_status == 'delivered':
                order.delivered_at = timezone.now()
            
            # IMPORTANT: Force regenerate tracking history
            self.force_regenerate_tracking(order)
            
            order.save()
            
            # Verify tracking was saved
            print(f"Tracking history after update: {len(order.tracking_history or [])} events")
            
            serializer = self.get_serializer(order)
            return Response({
                'success': True, 
                'message': f'Order status updated to {new_status}',
                'order': serializer.data
            })
            
        except Exception as e:
            print(f"Error updating order: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    def force_regenerate_tracking(self, order):
        """Force regenerate tracking history based on current order status"""
        history = []
        now = timezone.now()
        
        print(f"Regenerating tracking for order {order.order_number} with status {order.order_status}")
        
        # Base event - Order Placed (always present)
        history.append({
            'timestamp': order.created_at.isoformat(),
            'status': 'order_placed',
            'location': 'Online Store',
            'description': 'Your order has been placed successfully'
        })
        
        # Add events based on current status
        if order.order_status in ['processing', 'shipped', 'out_for_delivery', 'delivered']:
            processed_time = order.created_at + timedelta(hours=2)
            history.append({
                'timestamp': processed_time.isoformat(),
                'status': 'processed',
                'location': 'Mumbai Warehouse',
                'description': 'Order has been processed and packed'
            })
        
        if order.order_status in ['shipped', 'out_for_delivery', 'delivered']:
            shipped_time = order.created_at + timedelta(days=1)
            history.append({
                'timestamp': shipped_time.isoformat(),
                'status': 'shipped',
                'location': random.choice(['Mumbai Hub', 'Delhi Sort Center', 'Bangalore Facility']),
                'description': 'Package has been shipped'
            })
        
        if order.order_status in ['out_for_delivery', 'delivered']:
            out_time = order.created_at + timedelta(days=2)
            history.append({
                'timestamp': out_time.isoformat(),
                'status': 'out_for_delivery',
                'location': 'Local Delivery Center',
                'description': 'Package is out for delivery'
            })
        
        if order.order_status == 'delivered':
            delivered_time = order.delivered_at or (order.created_at + timedelta(days=3))
            history.append({
                'timestamp': delivered_time.isoformat(),
                'status': 'delivered',
                'location': 'Your Location',
                'description': 'Package has been delivered successfully'
            })
        
        # Generate tracking number if not exists
        if not order.tracking_number:
            order.tracking_number = f"TRK{random.randint(100000, 999999)}"
            order.courier_company = random.choice(['Blue Dart', 'Delhivery', 'DTDC', 'FedEx', 'Amazon Shipping'])
            order.estimated_delivery = now + timedelta(days=random.randint(2, 4))
        
        # Sort by timestamp
        history.sort(key=lambda x: x['timestamp'])
        order.tracking_history = history
        
        print(f"Generated {len(history)} tracking events")