from django.contrib import admin
from .models import FlashSale, FlashSaleProduct

class FlashSaleProductInline(admin.TabularInline):
    model = FlashSaleProduct
    extra = 1

@admin.register(FlashSale)
class FlashSaleAdmin(admin.ModelAdmin):
    list_display = ['title', 'discount_percentage', 'start_time', 'end_time', 'is_live', 'sold_quantity', 'total_quantity']
    list_filter = ['is_active', 'start_time', 'end_time']
    search_fields = ['title', 'description']
    inlines = [FlashSaleProductInline]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'description', 'discount_percentage', 'max_discount_amount')
        }),
        ('Timing', {
            'fields': ('start_time', 'end_time')
        }),
        ('Inventory', {
            'fields': ('total_quantity', 'sold_quantity', 'max_quantity_per_user')
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
    )

@admin.register(FlashSaleProduct)
class FlashSaleProductAdmin(admin.ModelAdmin):
    list_display = ['flash_sale', 'product', 'custom_discount', 'sale_price']
    list_filter = ['flash_sale']
    search_fields = ['product__name']