import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if it exists
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    console.log('Sending request to:', config.url);
    console.log('Token present:', !!token);
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Added Authorization header');
    } else {
      console.warn('No token found!');
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Handle token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        const response = await axios.post(`${API_URL}/users/login/refresh/`, {
          refresh: refreshToken,
        });
        
        localStorage.setItem('access_token', response.data.access);
        originalRequest.headers.Authorization = `Bearer ${response.data.access}`;
        
        return api(originalRequest);
      } catch (refreshError) {
        // Redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// Product APIs
export const productAPI = {
  getProducts: (params = {}) => api.get('/products/products/', { params }),
  getProduct: (slug) => api.get(`/products/products/${slug}/`),
  getCategories: () => api.get('/products/categories/'),
  getFeaturedProducts: () => api.get('/products/products/?is_featured=true'),
  addReview: (slug, data) => api.post(`/products/products/${slug}/add_review/`, data),
getRecommendations: (slug) => api.get(`/products/products/${slug}/recommendations/`),
getAlsoViewed: (slug) => api.get(`/products/products/${slug}/also_viewed/`), 
};

// Auth APIs
export const authAPI = {
  login: (data) => api.post('/users/login/', data),
  register: (data) => api.post('/users/register/', data),
  getProfile: () => api.get('/users/profile/'),
  refreshToken: (data) => api.post('/users/login/refresh/', data),
 googleLogin: (data) => api.post('/users/google/', data),
};

export const cartAPI = {
  // Get user's cart (requires authentication)
  getCart: () => api.get('/orders/cart/my_cart/'),
  
  // Add item to cart
  addToCart: (data) => api.post('/orders/cart/add/', data),
  
  // Update item quantity
  updateItem: (itemId, quantity) => api.post('/orders/cart/update_item/', {
    item_id: itemId,
    quantity: quantity
  }),
  
  // Remove item from cart
  removeItem: (itemId) => api.post('/orders/cart/remove_item/', {
    item_id: itemId
  }),
  
  // Clear cart
  clearCart: () => api.post('/orders/cart/clear/'),
  
  // Sync local cart with server (for logged-in users)
  syncCart: (items) => api.post('/orders/cart/sync/', { items })
};


// Order APIs
export const orderAPI = {
  createOrder: (data) => api.post('/orders/order/create_order/', data),
  getMyOrders: () => api.get('/orders/order/my_orders/'),
  getOrder: (id) => api.get(`/orders/order/${id}/`),  // This should now work
  trackOrder: (orderId) => api.get(`/orders/order/${orderId}/track/`),
};

// Add to your existing API exports
export const wishlistAPI = {
  getWishlist: () => api.get('/products/wishlist/my_wishlist/'),
  addToWishlist: (productId) => api.post('/products/wishlist/add/', { product_id: productId }),
  removeFromWishlist: (productId) => api.post('/products/wishlist/remove/', { product_id: productId }),
  checkInWishlist: (productId) => api.get(`/products/wishlist/check/?product_id=${productId}`),
};


export const adminAPI = {
  // Dashboard - NOTE: needs extra /orders/ in path
  getDashboardStats: () => api.get('/admin/orders/orders/dashboard_stats/'),  // ✅ Fixed
  getRecentOrders: () => api.get('/admin/orders/orders/recent_orders/'),      // ✅ Fixed
  
  // Products - these are correct
  getProducts: () => api.get('/admin/products/products/'),
  getProduct: (id) => api.get(`/admin/products/products/${id}/`),
  createProduct: (data) => api.post('/admin/products/products/', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  updateProduct: (id, data) => api.put(`/admin/products/products/${id}/`, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteProduct: (id) => api.delete(`/admin/products/products/${id}/`),

  // Categories
  getCategories: () => api.get('/admin/products/categories/'),
  createCategory: (data) => api.post('/admin/products/categories/', data),
  updateCategory: (id, data) => api.put(`/admin/products/categories/${id}/`, data),
  deleteCategory: (id) => api.delete(`/admin/products/categories/${id}/`),

  // Orders - FIXED: added extra /orders/
  getOrders: () => api.get('/admin/orders/orders/'),                    // ✅ Fixed
  getOrder: (id) => api.get(`/admin/orders/orders/${id}/`),             // ✅ Fixed
  updateOrderStatus: (id, status) => api.post(`/admin/orders/orders/${id}/update_status/`, { status }),  // ✅ Fixed
  
  // Reviews
  getReviews: () => api.get('/admin/products/reviews/'),
  deleteReview: (id) => api.delete(`/admin/products/reviews/${id}/`),
};

export const paymentAPI = {
  createRazorpayOrder: (orderId) => api.post('/payments/create_order/', { order_id: orderId }),
  verifyPayment: (data) => api.post('/payments/verify_payment/', data),
};

// Add this to your existing api.js file
export const salesAPI = {
  getLiveSales: () => api.get('/sales/flash-sales/?live_only=true'),
  getUpcomingSales: () => api.get('/sales/flash-sales/?upcoming=true'),
  getHomepageDeals: () => api.get('/sales/flash-sales/homepage_deals/'),
  getFlashSale: (id) => api.get(`/sales/flash-sales/${id}/`),
  claimDeal: (saleId, productId, quantity) => 
    api.post(`/sales/flash-sales/${saleId}/claim/`, { 
      product_id: productId, 
      quantity: quantity 
    }),
};

export default api;