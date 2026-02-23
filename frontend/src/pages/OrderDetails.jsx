import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { orderAPI } from '../services/api';
import OrderTracker from '../components/tracking/OrderTracker';
import { motion } from 'framer-motion';
import { ArrowLeftIcon, ClockIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check authentication first
    if (!authLoading && !isAuthenticated) {
      toast.error('Please login to view orders');
      navigate('/login', { state: { from: `/order/${id}` } });
      return;
    }

    if (isAuthenticated) {
      fetchOrder();
    }
  }, [id, isAuthenticated, authLoading, navigate]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await orderAPI.getOrder(id);
      setOrder(response.data);
    } catch (error) {
      console.error('Error fetching order:', error);
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        navigate('/login');
      } else if (error.response?.status === 404) {
        setError('Order not found');
      } else {
        setError('Failed to load order details');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (authLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">{error || 'Order Not Found'}</h2>
        <p className="text-gray-600 mb-8">The order you're looking for doesn't exist or you don't have permission to view it.</p>
        <Link to="/orders" className="text-blue-600 hover:text-blue-700 font-medium">
          Back to My Orders
        </Link>
      </div>
    );
  }

  // Verify this order belongs to the logged-in user
  if (order.user !== user?.id) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
        <p className="text-gray-600 mb-8">You don't have permission to view this order.</p>
        <Link to="/orders" className="text-blue-600 hover:text-blue-700 font-medium">
          View My Orders
        </Link>
      </div>
    );
  }

  // Show payment pending message for unpaid orders
  if (order.payment_status !== 'paid') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link to="/orders" className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-6 transition">
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Orders
        </Link>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center mb-8">
          <ClockIcon className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-yellow-800 mb-2">Payment Pending</h2>
          <p className="text-yellow-700 mb-6">
            Tracking information will be available once payment is confirmed.
          </p>
          <p className="text-sm text-yellow-600">
            Order #{order.order_number} • Placed on {formatDate(order.created_at)}
          </p>
        </div>
        
        {/* Order Summary - Show basic order info even without tracking */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
          <div className="space-y-4">
            {order.items?.map(item => (
              <div key={item.id} className="flex justify-between border-b pb-2">
                <div>
                  <p className="font-medium">{item.product_name}</p>
                  <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                </div>
                <p className="font-semibold">₹{item.product_price}</p>
              </div>
            ))}
          </div>
          
          <div className="mt-4 pt-4 border-t">
            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span className="text-blue-600">₹{order.total}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show full tracking for paid orders
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link to="/orders" className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-6 transition">
        <ArrowLeftIcon className="h-4 w-4" />
        Back to Orders
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold mb-8">Order Details</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Tracking Info */}
          <div className="lg:col-span-2">
            <OrderTracker orderId={id} />
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-24">
              <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
              <p className="text-sm text-gray-600 mb-2">Order #{order.order_number}</p>
              <p className="text-sm text-gray-600 mb-4">
                Placed on {formatDate(order.created_at)}
              </p>
              
              <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
                {order.items?.map(item => (
                  <div key={item.id} className="flex gap-3 border-b pb-2">
                    <div className="w-16 h-16 bg-gray-100 rounded flex-shrink-0">
                      {item.product?.images?.[0]?.image && (
                        <img 
                          src={item.product.images[0].image} 
                          alt={item.product_name}
                          className="w-full h-full object-cover rounded"
                        />
                      )}
                    </div>
                    <div className="flex-grow">
                      <p className="font-medium text-sm">{item.product_name}</p>
                      <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                      <p className="text-sm font-semibold mt-1">₹{item.product_price}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span>₹{order.subtotal}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping:</span>
                  <span>₹{order.shipping_cost}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax:</span>
                  <span>₹{order.tax}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Total:</span>
                  <span className="text-blue-600">₹{order.total}</span>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="mt-6 pt-6 border-t">
                <h3 className="font-medium text-sm text-gray-600 mb-2">Shipping Address</h3>
                <p className="text-sm">
                  {order.first_name} {order.last_name}<br />
                  {order.address_line1}<br />
                  {order.address_line2 && <>{order.address_line2}<br /></>}
                  {order.city}, {order.state} - {order.pincode}<br />
                  {order.country}<br />
                  Phone: {order.phone}
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default OrderDetails;