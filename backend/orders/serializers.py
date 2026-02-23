from rest_framework import serializers
from .models import Cart, CartItem, Order, OrderItem
from products.models import Product, ProductVariant
from products.serializers import ProductSerializer

class CartItemSerializer(serializers.ModelSerializer):
    product_details = ProductSerializer(source='product', read_only=True)
    subtotal = serializers.ReadOnlyField()

    class Meta:
        model = CartItem
        fields = ['id', 'product', 'product_details', 'variant', 'quantity', 'subtotal', 'created_at']

class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total = serializers.ReadOnlyField()
    total_items = serializers.ReadOnlyField()

    class Meta:
        model = Cart
        fields = ['id', 'user', 'items', 'total', 'total_items', 'created_at', 'updated_at']
        read_only_fields = ['user']

class AddToCartSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    variant_id = serializers.IntegerField(required=False, allow_null=True)
    quantity = serializers.IntegerField(min_value=1, default=1)

class UpdateCartItemSerializer(serializers.Serializer):
    quantity = serializers.IntegerField(min_value=0)

class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'variant', 'product_name', 'product_price', 'quantity', 'subtotal']

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = '__all__'
        read_only_fields = ['user', 'order_number', 'created_at', 'updated_at']

class CreateOrderSerializer(serializers.Serializer):
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    email = serializers.EmailField()
    phone = serializers.CharField()
    address_line1 = serializers.CharField()
    address_line2 = serializers.CharField(required=False, allow_blank=True)
    city = serializers.CharField()
    state = serializers.CharField()
    pincode = serializers.CharField()
    country = serializers.CharField(default='India')
    payment_method = serializers.CharField()

class TrackingSerializer(serializers.Serializer):
    tracking_number = serializers.CharField(required=False, allow_blank=True)
    courier_company = serializers.CharField(required=False, allow_blank=True)
    estimated_delivery = serializers.DateTimeField(required=False, allow_null=True)
    tracking_history = serializers.JSONField(read_only=True)

class TrackingSerializer(serializers.Serializer):
    tracking_number = serializers.CharField(required=False, allow_blank=True)
    courier_company = serializers.CharField(required=False, allow_blank=True)
    estimated_delivery = serializers.DateTimeField(required=False, allow_null=True)