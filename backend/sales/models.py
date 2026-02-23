from django.db import models
from django.conf import settings
from django.utils import timezone  # ✅ Add this
from products.models import Product

class FlashSale(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    
    # Sale timing
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    
    # Sale settings
    discount_percentage = models.DecimalField(max_digits=5, decimal_places=2, help_text="Discount percentage off")
    max_discount_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    # Limits
    max_quantity_per_user = models.IntegerField(default=1)
    total_quantity = models.IntegerField(default=100)
    sold_quantity = models.IntegerField(default=0)
    
    # Status
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} ({self.discount_percentage}% off)"
    
    @property
    def is_live(self):
        now = timezone.now()
        return self.start_time <= now <= self.end_time and self.is_active
    
    @property
    def time_remaining(self):
        if self.is_live:
            return self.end_time - timezone.now()
        return None
    
    @property
    def progress_percentage(self):
        if self.total_quantity > 0:
            return (self.sold_quantity / self.total_quantity) * 100
        return 0

class FlashSaleProduct(models.Model):
    flash_sale = models.ForeignKey(FlashSale, on_delete=models.CASCADE, related_name='products')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    
    # Override sale price if needed
    custom_discount = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    
    class Meta:
        unique_together = ['flash_sale', 'product']
    
    def __str__(self):
        return f"{self.flash_sale.title} - {self.product.name}"
    
    @property
    def sale_price(self):
        discount = self.custom_discount or self.flash_sale.discount_percentage
        discounted = self.product.price * (1 - discount/100)
        if self.flash_sale.max_discount_amount:
            max_discounted = self.product.price - self.flash_sale.max_discount_amount
            return max(max_discounted, discounted)
        return discounted