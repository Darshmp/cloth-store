from rest_framework import serializers
from django.utils import timezone  # ✅ Add this
from .models import FlashSale, FlashSaleProduct
from products.serializers import ProductSerializer

class FlashSaleProductSerializer(serializers.ModelSerializer):
    product_details = ProductSerializer(source='product', read_only=True)
    sale_price = serializers.ReadOnlyField()
    
    class Meta:
        model = FlashSaleProduct
        fields = ['id', 'product', 'product_details', 'custom_discount', 'sale_price']

class FlashSaleSerializer(serializers.ModelSerializer):
    products = FlashSaleProductSerializer(many=True, read_only=True)
    time_remaining_seconds = serializers.SerializerMethodField()
    progress = serializers.ReadOnlyField(source='progress_percentage')
    
    class Meta:
        model = FlashSale
        fields = '__all__'
    
    def get_time_remaining_seconds(self, obj):
        if obj.is_live:
            remaining = obj.end_time - timezone.now()
            return int(remaining.total_seconds())
        return 0