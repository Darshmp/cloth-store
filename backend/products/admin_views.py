import json
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Count, Sum, Q
from .models import Product, Category, Review, ProductVariant
from .admin_serializers import (
    AdminCategorySerializer, AdminProductSerializer,
    AdminReviewSerializer
)
from users.permissions import IsAdminUser

class AdminCategoryViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminUser]
    queryset = Category.objects.all()
    serializer_class = AdminCategorySerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['name']

class AdminProductViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminUser]
    queryset = Product.objects.all()
    serializer_class = AdminProductSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'is_active', 'is_featured']
    search_fields = ['name', 'sku', 'description']
    ordering_fields = ['price', 'created_at', 'stock']

    def create(self, request, *args, **kwargs):
        import json
        print("\n" + "="*60)
        print("CREATE REQUEST RECEIVED")
        print("="*60)
        
        # Handle variants separately
        variants_json = request.data.get('variants')
        variants_data = None
        if variants_json:
            try:
                variants_data = json.loads(variants_json)
                print(f"\n🔍 VARIANTS PARSED: {variants_data}")
            except json.JSONDecodeError as e:
                print(f"❌ JSON PARSE ERROR: {e}")
                return Response(
                    {'error': f'Invalid variants data: {str(e)}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Create product
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        product = serializer.save()
        
        # Handle variants after product is created
        if variants_data is not None:
            print(f"\n🔄 Creating variants...")
            for i, v_data in enumerate(variants_data):
                print(f"  Creating variant {i+1}: {v_data}")
                ProductVariant.objects.create(
                    product=product,
                    size=v_data.get('size'),
                    color=v_data.get('color'),
                    stock=v_data.get('stock', 0),
                    price_adjustment=v_data.get('price_adjustment', 0)
                )
        
        print("\n✅ CREATE COMPLETED SUCCESSFULLY")
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        import json
        print("\n" + "="*60)
        print("UPDATE REQUEST RECEIVED")
        print("="*60)
        
        # Print all request data
        print("\n📦 REQUEST DATA:")
        for key, value in request.data.items():
            print(f"  {key}: {value}")
        
        # Get the instance
        instance = self.get_object()
        print(f"\n📦 INSTANCE: Product ID {instance.id} - {instance.name}")
        
        # Handle variants separately
        variants_json = request.data.get('variants')
        variants_data = None
        if variants_json:
            try:
                variants_data = json.loads(variants_json)
                print(f"\n🔍 VARIANTS PARSED: {variants_data}")
            except json.JSONDecodeError as e:
                print(f"❌ JSON PARSE ERROR: {e}")
                return Response(
                    {'error': f'Invalid variants data: {str(e)}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Update product fields (excluding variants)
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        # Handle variants after product is updated
        if variants_data is not None:
            print(f"\n🔄 Updating variants...")
            # Delete existing variants
            deleted = instance.variants.all().delete()
            print(f"  Deleted {deleted[0]} existing variants")
            
            # Create new variants
            for i, v_data in enumerate(variants_data):
                print(f"  Creating variant {i+1}: {v_data}")
                ProductVariant.objects.create(
                    product=instance,
                    size=v_data.get('size'),
                    color=v_data.get('color'),
                    stock=v_data.get('stock', 0),
                    price_adjustment=v_data.get('price_adjustment', 0)
                )
        
        print("\n✅ UPDATE COMPLETED SUCCESSFULLY")
        return Response(serializer.data)
    

    @action(detail=False, methods=['get'])
    def low_stock(self, request):
        """Get products with low stock (< 10)"""
        products = self.queryset.filter(stock__lt=10)
        serializer = self.get_serializer(products, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def bulk_update_stock(self, request):
        """Bulk update product stock"""
        updates = request.data.get('updates', [])
        for update in updates:
            Product.objects.filter(id=update['id']).update(stock=update['stock'])
        return Response({'message': f'{len(updates)} products updated'})

class AdminReviewViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminUser]
    queryset = Review.objects.all()
    serializer_class = AdminReviewSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['rating', 'product']
    search_fields = ['comment', 'user__email']
    