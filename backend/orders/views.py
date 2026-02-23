import random
from datetime import timedelta
from django.utils import timezone

from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db import transaction
from decimal import Decimal
from .models import Cart, CartItem, Order, OrderItem
from products.models import Product, ProductVariant
from .serializers import (
    CartSerializer, 
    AddToCartSerializer, 
    UpdateCartItemSerializer,
    OrderSerializer, 
    CreateOrderSerializer,
    TrackingSerializer
)

class CartViewSet(viewsets.GenericViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = CartSerializer

    def get_queryset(self):
        return Cart.objects.filter(user=self.request.user)

    def get_cart(self):
        cart, created = Cart.objects.get_or_create(user=self.request.user)
        return cart

    @action(detail=False, methods=['get'])
    def my_cart(self, request):
        cart = self.get_cart()
        serializer = self.get_serializer(cart)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def add(self, request):
        cart = self.get_cart()
        serializer = AddToCartSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            product = get_object_or_404(Product, id=serializer.validated_data['product_id'])
            variant_id = serializer.validated_data.get('variant_id')
            quantity = serializer.validated_data['quantity']

            variant = None
            if variant_id:
                variant = get_object_or_404(ProductVariant, id=variant_id)

            cart_item, created = CartItem.objects.get_or_create(
                cart=cart,
                product=product,
                variant=variant,
                defaults={'quantity': quantity}
            )

            if not created:
                cart_item.quantity += quantity
                cart_item.save()

            cart_serializer = self.get_serializer(cart)
            return Response(cart_serializer.data, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def update_item(self, request):
        cart = self.get_cart()
        item_id = request.data.get('item_id')
        quantity = request.data.get('quantity')

        if not item_id or quantity is None:
            return Response({'error': 'item_id and quantity required'},
                          status=status.HTTP_400_BAD_REQUEST)

        cart_item = get_object_or_404(CartItem, id=item_id, cart=cart)

        if quantity == 0:
            cart_item.delete()
        else:
            cart_item.quantity = quantity
            cart_item.save()

        cart_serializer = self.get_serializer(cart)
        return Response(cart_serializer.data)

    @action(detail=False, methods=['post'])
    def remove_item(self, request):
        cart = self.get_cart()
        item_id = request.data.get('item_id')

        if not item_id:
            return Response({'error': 'item_id required'},
                          status=status.HTTP_400_BAD_REQUEST)

        cart_item = get_object_or_404(CartItem, id=item_id, cart=cart)
        cart_item.delete()
        
        cart_serializer = self.get_serializer(cart)
        return Response(cart_serializer.data)

    @action(detail=False, methods=['post'])
    def clear(self, request):
        cart = self.get_cart()
        cart.items.all().delete()

        cart_serializer = self.get_serializer(cart)
        return Response(cart_serializer.data)

    @action(detail=False, methods=['post'])
    def sync(self, request):
        cart = self.get_cart()
        local_items = request.data.get('items', [])

        with transaction.atomic():
            cart.items.all().delete()

            for item in local_items:
                try:
                    product = Product.objects.get(id=item['product_id'])
                    variant = None
                    if item.get('variant_id'):
                        variant = ProductVariant.objects.get(id=item['variant_id'])

                    CartItem.objects.create(
                        cart=cart,
                        product=product,
                        variant=variant,
                        quantity=item['quantity']
                    )
                except (Product.DoesNotExist, ProductVariant.DoesNotExist):
                    continue

        cart_serializer = self.get_serializer(cart)
        return Response(cart_serializer.data)


class OrderViewSet(viewsets.GenericViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = OrderSerializer
    queryset = Order.objects.all()

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user)

    def retrieve(self, request, pk=None):
        """Get single order details"""
        order = self.get_object()
        serializer = self.get_serializer(order)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def my_orders(self, request):
        """Get current user's orders"""
        orders = self.get_queryset()
        serializer = self.get_serializer(orders, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def create_order(self, request):
        """Create order from cart"""
        serializer = CreateOrderSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                # Get user's cart
                cart = Cart.objects.get(user=request.user)

                if not cart.items.exists():
                    return Response({'error': 'Cart is empty'}, status=status.HTTP_400_BAD_REQUEST)

                # Calculate totals using Decimal
                subtotal = cart.total
                shipping_cost = Decimal('0')
                tax = subtotal * Decimal('0.18')
                total = subtotal + shipping_cost + tax

                # Create order
                order = Order.objects.create(
                    user=request.user,
                    first_name=serializer.validated_data['first_name'],
                    last_name=serializer.validated_data['last_name'],
                    email=serializer.validated_data['email'],
                    phone=serializer.validated_data['phone'],
                    address_line1=serializer.validated_data['address_line1'],
                    address_line2=serializer.validated_data.get('address_line2', ''),
                    city=serializer.validated_data['city'],
                    state=serializer.validated_data['state'],
                    pincode=serializer.validated_data['pincode'],
                    country=serializer.validated_data.get('country', 'India'),
                    subtotal=subtotal,
                    shipping_cost=shipping_cost,
                    tax=tax,
                    total=total,
                    payment_method=serializer.validated_data['payment_method'],
                    order_status='pending',
                    payment_status='pending'
                )

                # Create order items from cart items
                for cart_item in cart.items.all():
                    OrderItem.objects.create(
                        order=order,
                        product=cart_item.product,
                        variant=cart_item.variant,
                        product_name=cart_item.product.name,
                        product_price=cart_item.product.price,
                        quantity=cart_item.quantity,
                        subtotal=cart_item.subtotal
                    )

                    # Update stock
                    if cart_item.variant:
                        cart_item.variant.stock -= cart_item.quantity
                        cart_item.variant.save()
                    else:
                        cart_item.product.stock -= cart_item.quantity
                        cart_item.product.save()

                # Clear the cart
                cart.items.all().delete()

                # Return order details
                order_serializer = self.get_serializer(order)
                return Response({
                    'success': True,
                    'order': order_serializer.data,
                    'payment_required': True
                }, status=status.HTTP_201_CREATED)

        except Cart.DoesNotExist:
            return Response({'error': 'Cart not found'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def payment_success(self, request, pk=None):
        """Handle payment success"""
        order = self.get_object()
        order.payment_status = 'paid'
        order.order_status = 'processing'
        order.transaction_id = request.data.get('transaction_id', '')
        order.save()
        
        # Generate initial tracking data
        self.generate_complete_tracking_history(order)
        
        return Response({'success': True})

    @action(detail=True, methods=['post'])
    def payment_failed(self, request, pk=None):
        """Handle payment failure"""
        order = self.get_object()
        order.payment_status = 'failed'
        order.save()
        return Response({'success': True})
    
    @action(detail=True, methods=['get'])
    def track(self, request, pk=None):
        """Get comprehensive tracking information for an order"""
        order = self.get_object()
        
        # If no tracking history exists, generate it
        if not order.tracking_history or len(order.tracking_history) == 0:
            self.force_regenerate_tracking(order)
        
        # Calculate progress
        all_statuses = ['order_placed', 'processed', 'shipped', 'out_for_delivery', 'delivered']
        current_status_index = 0
        
        if order.tracking_history and len(order.tracking_history) > 0:
            last_status = order.tracking_history[-1]['status']
            if last_status in all_statuses:
                current_status_index = all_statuses.index(last_status) + 1
        
        progress_percentage = (current_status_index / len(all_statuses)) * 100
        
        return Response({
            'order_number': order.order_number,
            'status': order.order_status,
            'payment_status': order.payment_status,
            'tracking_number': order.tracking_number,
            'courier_company': order.courier_company,
            'estimated_delivery': order.estimated_delivery,
            'tracking_history': order.tracking_history,  # Make sure this is included
            'delivered_at': order.delivered_at,
            'progress': {
                'current': current_status_index,
                'total': len(all_statuses),
                'percentage': progress_percentage
            }
        })
        @action(detail=True, methods=['post'])
        def update_tracking(self, request, pk=None):
            """Update tracking information (admin only)"""
            if not request.user.is_staff:
                return Response({'error': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
            
            order = self.get_object()
            serializer = TrackingSerializer(data=request.data)
            
            if serializer.is_valid():
                if hasattr(order, 'tracking_number'):
                    order.tracking_number = serializer.validated_data.get('tracking_number', order.tracking_number)
                    order.courier_company = serializer.validated_data.get('courier_company', order.courier_company)
                    order.estimated_delivery = serializer.validated_data.get('estimated_delivery', order.estimated_delivery)
                    order.save()
                return Response({'success': True})
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        def generate_complete_tracking_history(self, order):
            """Generate comprehensive tracking history based on order status"""
            history = []
            now = timezone.now()
            
            # Base tracking events that always happen
            tracking_events = [
                {
                    'status': 'order_placed',
                    'location': 'Online Store',
                    'description': 'Your order has been placed successfully',
                    'days_ago': 3
                },
                {
                    'status': 'processed',
                    'location': 'Mumbai Warehouse',
                    'description': 'Order has been processed and packed',
                    'days_ago': 2
                }
            ]
            
            # Add events based on actual order status
            if order.order_status in ['shipped', 'out_for_delivery', 'delivered']:
                tracking_events.append({
                    'status': 'shipped',
                    'location': random.choice(['Mumbai Hub', 'Delhi Sort Center', 'Bangalore Facility']),
                    'description': 'Package has been shipped',
                    'days_ago': 1
                })
            
            if order.order_status in ['out_for_delivery', 'delivered']:
                tracking_events.append({
                    'status': 'out_for_delivery',
                    'location': 'Local Delivery Center',
                    'description': 'Package is out for delivery',
                    'days_ago': 0.5
                })
            
            if order.order_status == 'delivered':
                tracking_events.append({
                    'status': 'delivered',
                    'location': 'Your Location',
                    'description': 'Package has been delivered successfully',
                    'days_ago': 0
                })
                order.delivered_at = now
            
            # Generate timestamps
            for event in tracking_events:
                event_time = now - timedelta(days=event['days_ago'])
                history.append({
                    'timestamp': event_time.isoformat(),
                    'status': event['status'],
                    'location': event['location'],
                    'description': event['description']
                })
            
            # Sort by timestamp (oldest first)
            history.sort(key=lambda x: x['timestamp'])
            
            # Set tracking number and courier if not exists
            if not order.tracking_number:
                order.tracking_number = f"TRK{random.randint(100000, 999999)}"
                order.courier_company = random.choice(['Blue Dart', 'Delhivery', 'DTDC', 'FedEx', 'Amazon Shipping'])
                order.estimated_delivery = now + timedelta(days=random.randint(2, 4))
            
            order.tracking_history = history
            order.save()