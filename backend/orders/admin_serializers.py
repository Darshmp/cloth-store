from rest_framework import serializers
from .models import Order, OrderItem

class AdminOrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.ReadOnlyField()
    
    class Meta:
        model = OrderItem
        fields = '__all__'

class AdminOrderSerializer(serializers.ModelSerializer):
    items = AdminOrderItemSerializer(many=True, read_only=True)
    user_email = serializers.ReadOnlyField(source='user.email')
    user_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Order
        fields = '__all__'
        read_only_fields = ['order_number', 'created_at', 'updated_at']
    
    def get_user_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"