from rest_framework.decorators import action
from rest_framework import viewsets, filters, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django_filters import rest_framework as django_filters
from django.db.models import Q, Count, Avg
from django.db import models

from .models import Product, Category, Review, ProductVariant, Wishlist
from .serializers import ProductSerializer, CategorySerializer, ReviewSerializer, WishlistSerializer

class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    lookup_field = 'slug'

class ProductFilter(django_filters.FilterSet):
    # Price range filter
    min_price = django_filters.NumberFilter(field_name='price', lookup_expr='gte')
    max_price = django_filters.NumberFilter(field_name='price', lookup_expr='lte')

    # Multiple category selection
    category = django_filters.ModelMultipleChoiceFilter(
        field_name='category__slug',
        to_field_name='slug',
        queryset=Category.objects.all(),
        conjoined=False
    )

    # Size filter
    size = django_filters.CharFilter(method='filter_by_size')
    color = django_filters.CharFilter(method='filter_by_color')
    brand = django_filters.CharFilter(lookup_expr='icontains')
    min_rating = django_filters.NumberFilter(method='filter_by_rating')
    min_discount = django_filters.NumberFilter(method='filter_by_discount')
    in_stock = django_filters.BooleanFilter(method='filter_in_stock')
    is_featured = django_filters.BooleanFilter()

    class Meta:
        model = Product
        fields = ['category', 'is_featured']

    def filter_by_size(self, queryset, name, value):
        return queryset.filter(variants__size=value).distinct()

    def filter_by_color(self, queryset, name, value):
        return queryset.filter(variants__color=value).distinct()

    def filter_by_rating(self, queryset, name, value):
        return queryset.annotate(avg_rating=Avg('reviews__rating')).filter(avg_rating__gte=value)

    def filter_by_discount(self, queryset, name, value):
        return queryset.filter(compare_price__isnull=False).extra(
            where=['((compare_price - price) / compare_price * 100) >= %s'],
            params=[value]
        )

    def filter_in_stock(self, queryset, name, value):
        if value:
            return queryset.filter(stock__gt=0)
        return queryset.filter(stock=0)

class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Product.objects.filter(is_active=True)
    serializer_class = ProductSerializer
    lookup_field = 'slug'
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter
    ]
    filterset_class = ProductFilter
    search_fields = ['name', 'description', 'sku']
    ordering_fields = ['price', 'created_at', 'name', 'stock']

    ordering_map = {
        'popularity': '-review_count',
        'rating': '-average_rating',
        'newest': '-created_at',
        'price_low': 'price',
        'price_high': '-price',
    }

    def get_queryset(self):
        queryset = super().get_queryset()
        queryset = queryset.annotate(
            average_rating=Avg('reviews__rating'),
            review_count=Count('reviews')
        )
        order_by = self.request.query_params.get('ordering')
        if order_by in self.ordering_map:
            queryset = queryset.order_by(self.ordering_map[order_by])
        return queryset

    @action(detail=False, methods=['get'])
    def filter_options(self, request):
        """Get available filter options for frontend"""
        categories = Category.objects.annotate(
            product_count=Count('products', filter=Q(products__is_active=True))
        ).values('slug', 'name', 'product_count')

        sizes = ProductVariant.objects.values_list('size', flat=True).distinct()
        colors = ProductVariant.objects.values_list('color', flat=True).distinct()

        price_range = Product.objects.filter(is_active=True).aggregate(
            min_price=models.Min('price'),
            max_price=models.Max('price')
        )

        brands = Product.objects.filter(
            is_active=True,
            brand__isnull=False
        ).values_list('brand', flat=True).distinct()

        return Response({
            'categories': categories,
            'sizes': sizes,
            'colors': colors,
            'price_range': price_range,
            'brands': brands,
            'rating_options': [4, 3, 2, 1],
            'discount_options': [10, 20, 30, 40, 50]
        })

    @action(detail=True, methods=['get'])
    def recommendations(self, request, slug=None):
        """Get product recommendations based on purchase history"""
        product = self.get_object()
        
        # Find products frequently bought together
        from orders.models import OrderItem
        
        # Get all orders that contained this product
        orders_with_product = OrderItem.objects.filter(
            product=product
        ).values_list('order_id', flat=True).distinct()
        
        # Find other products in those orders
        recommended_products = Product.objects.filter(
            orderitem__order_id__in=orders_with_product,
            is_active=True
        ).exclude(id=product.id).annotate(
            frequency=Count('orderitem')
        ).order_by('-frequency', '-created_at')[:6]
        
        # Also add products from same category
        if recommended_products.count() < 4:
            category_products = Product.objects.filter(
                category=product.category,
                is_active=True
            ).exclude(
                id=product.id
            ).exclude(
                id__in=recommended_products.values_list('id', flat=True)
            )[:4]
            recommended_products = list(recommended_products) + list(category_products)
        
        serializer = self.get_serializer(recommended_products, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def also_viewed(self, request, slug=None):
        """Get products frequently viewed together"""
        product = self.get_object()
        
        # Similar products from same category
        similar_products = Product.objects.filter(
            category=product.category,
            is_active=True
        ).exclude(id=product.id)[:8]
        
        serializer = self.get_serializer(similar_products, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def add_review(self, request, slug=None):
        """Add a review to a product"""
        product = self.get_object()
        user = request.user
        
        if not user.is_authenticated:
            return Response(
                {'error': 'Authentication required'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Check if user already reviewed
        if Review.objects.filter(product=product, user=user).exists():
            return Response(
                {'error': 'You already reviewed this product'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = ReviewSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(product=product, user=user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class WishlistViewSet(viewsets.GenericViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = WishlistSerializer

    def get_queryset(self):
        return Wishlist.objects.filter(user=self.request.user)

    @action(detail=False, methods=['get'])
    def my_wishlist(self, request):
        wishlist = self.get_queryset()
        serializer = self.get_serializer(wishlist, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def add(self, request):
        product_id = request.data.get('product_id')
        if not product_id:
            return Response({'error': 'product_id required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            product = Product.objects.get(id=product_id)
            wishlist_item, created = Wishlist.objects.get_or_create(
                user=request.user,
                product=product
            )
            
            if created:
                serializer = self.get_serializer(wishlist_item)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response({'message': 'Product already in wishlist'}, status=status.HTTP_200_OK)
        except Product.DoesNotExist:
            return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['post'])
    def remove(self, request):
        product_id = request.data.get('product_id')
        if not product_id:
            return Response({'error': 'product_id required'}, status=status.HTTP_400_BAD_REQUEST)
        
        deleted = Wishlist.objects.filter(
            user=request.user,
            product_id=product_id
        ).delete()
        
        if deleted[0] > 0:
            return Response({'success': True})
        return Response({'error': 'Item not in wishlist'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['get'])
    def check(self, request):
        product_id = request.query_params.get('product_id')
        if not product_id:
            return Response({'error': 'product_id required'}, status=status.HTTP_400_BAD_REQUEST)
        
        exists = Wishlist.objects.filter(
            user=request.user,
            product_id=product_id
        ).exists()
        
        return Response({'in_wishlist': exists})