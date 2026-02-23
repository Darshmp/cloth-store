from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .admin_views import AdminCategoryViewSet, AdminProductViewSet, AdminReviewViewSet

router = DefaultRouter()
router.register('categories', AdminCategoryViewSet, basename='admin-category')
router.register('products', AdminProductViewSet, basename='admin-product')
router.register('reviews', AdminReviewViewSet, basename='admin-review')

urlpatterns = [
    path('', include(router.urls)),
]