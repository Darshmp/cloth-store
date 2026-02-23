from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django.utils import timezone  # ✅ Use timezone instead of datetime
from .models import FlashSale, FlashSaleProduct
from .serializers import FlashSaleSerializer
from products.models import Product

class FlashSaleViewSet(viewsets.ModelViewSet):
    queryset = FlashSale.objects.all()
    serializer_class = FlashSaleSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by active/live sales
        if self.request.query_params.get('live_only'):
            now = timezone.now()
            queryset = queryset.filter(
                start_time__lte=now,
                end_time__gte=now,
                is_active=True
            )
        
        # Filter by upcoming sales
        if self.request.query_params.get('upcoming'):
            now = timezone.now()
            queryset = queryset.filter(start_time__gt=now, is_active=True)
        
        return queryset
    
    @action(detail=True, methods=['post'])
    def claim(self, request, pk=None):
        """User claims a flash sale product"""
        sale = self.get_object()
        product_id = request.data.get('product_id')
        quantity = request.data.get('quantity', 1)
        
        if not sale.is_live:
            return Response({'error': 'Sale is not live'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            sale_product = FlashSaleProduct.objects.get(
                flash_sale=sale,
                product_id=product_id
            )
        except FlashSaleProduct.DoesNotExist:
            return Response({'error': 'Product not in this sale'}, status=status.HTTP_404_NOT_FOUND)
        
        # Check quantity limits
        if sale.sold_quantity + quantity > sale.total_quantity:
            return Response({'error': 'Not enough stock'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Update sold quantity
        sale.sold_quantity += quantity
        sale.save()
        
        return Response({
            'success': True,
            'sale_price': float(sale_product.sale_price),
            'remaining': sale.total_quantity - sale.sold_quantity
        })
    
    @action(detail=False, methods=['get'])
    def homepage_deals(self, request):
        """Get deals for homepage display"""
        now = timezone.now()
        live_sales = FlashSale.objects.filter(
            start_time__lte=now,
            end_time__gte=now,
            is_active=True
        )[:3]
        
        upcoming_sales = FlashSale.objects.filter(
            start_time__gt=now,
            is_active=True
        )[:3]
        
        serializer = self.get_serializer(live_sales, many=True)
        upcoming_serializer = self.get_serializer(upcoming_sales, many=True)
        
        return Response({
            'live': serializer.data,
            'upcoming': upcoming_serializer.data
        })