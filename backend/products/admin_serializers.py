from rest_framework import serializers
from .models import Category, Product, ProductImage, ProductVariant, Review
from django.utils.text import slugify

class AdminCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'
    
    def validate_slug(self, value):
        if not value:
            return slugify(self.initial_data.get('name', ''))
        return value

class AdminProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = '__all__'

class AdminProductVariantSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductVariant
        fields = '__all__'
        
class AdminProductSerializer(serializers.ModelSerializer):
    images = AdminProductImageSerializer(many=True, read_only=True)
    variants = AdminProductVariantSerializer(many=True, read_only=True)
    uploaded_images = serializers.ListField(
        child=serializers.ImageField(), write_only=True, required=False
    )
    # Remove variants_data field - we'll handle it in the view

    class Meta:
        model = Product
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'slug']

    def validate_slug(self, value):
        if not value:
            return slugify(self.initial_data.get('name', ''))
        return value

    def create(self, validated_data):
        uploaded_images = validated_data.pop('uploaded_images', [])
        
        # Create product
        product = Product.objects.create(**validated_data)

        # Create product images
        for image in uploaded_images:
            ProductImage.objects.create(product=product, image=image)

        return product
    
    def update(self, instance, validated_data):
        uploaded_images = validated_data.pop('uploaded_images', [])

        # Update product fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Add new images
        for image in uploaded_images:
            ProductImage.objects.create(product=instance, image=image)

        return instance


class AdminReviewSerializer(serializers.ModelSerializer):
    user_email = serializers.ReadOnlyField(source='user.email')
    
    class Meta:
        model = Review
        fields = '__all__'
        read_only_fields = ['created_at']