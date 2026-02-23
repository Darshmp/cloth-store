import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { orderAPI } from '../services/api';
import { motion } from 'framer-motion';
import { 
  ShoppingBagIcon, 
  ChevronDownIcon, 
  ChevronUpIcon,
  TruckIcon 
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Wait for auth to load first
    if (authLoading) {
      return;
    }

    // Check if user is authenticated
    if (!isAuthenticated) {
      toast.error('Please login to view your orders');
      navigate('/login', { state: { from: '/orders' } });
      return;
    }

    // User is authenticated, fetch orders
    fetchOrders();
  }, [isAuthenticated, authLoading, navigate]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      console.log('Fetching orders for user:', user?.username);
      const response = await orderAPI.getMyOrders();
      console.log('Orders response:', response.data);
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        navigate('/login');
      } else {
        toast.error('Failed to load orders');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'out_for_delivery': return 'bg-orange-100 text-orange-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status) => {
    switch(status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'refunded': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Show loading while auth is loading
  if (authLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-8">My Orders</h1>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow-lg p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Show message if not authenticated (should redirect, but just in case)
  if (!isAuthenticated) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <ShoppingBagIcon className="h-24 w-24 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Please Login</h2>
        <p className="text-gray-600 mb-8">You need to be logged in to view your orders.</p>
        <Link
          to="/login"
          className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
        >
          Login Now
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-8">My Orders</h1>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow-lg p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <ShoppingBagIcon className="h-24 w-24 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">No Orders Yet</h2>
        <p className="text-gray-600 mb-8">Looks like you haven't placed any orders yet.</p>
        <Link
          to="/shop"
          className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
        >
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8">My Orders</h1>

      <div className="space-y-4">
        {orders.map((order) => (
          <motion.div
            key={order.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-lg overflow-hidden"
          >
            {/* Order Header */}
            <div 
              className="p-6 cursor-pointer hover:bg-gray-50 transition"
              onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-gray-500">Order #{order.order_number}</p>
                  <p className="text-sm text-gray-500">Placed on {formatDate(order.created_at)}</p>
                </div>
                
                <div className="flex items-center gap-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.order_status)}`}>
                    {order.order_status?.replace(/_/g, ' ')}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPaymentStatusColor(order.payment_status)}`}>
                    Payment: {order.payment_status}
                  </span>
                  <span className="font-bold text-blue-600">₹{order.total}</span>
                  
{/* Track Order Button - Show for any order that might have tracking */}
{(order.payment_status === 'paid' || order.order_status === 'shipped' || 
  order.order_status === 'out_for_delivery' || order.order_status === 'delivered') && (
  <Link
    to={`/order/${order.id}`}
    onClick={(e) => e.stopPropagation()}
    className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-700 transition flex items-center gap-1"
  >
    <TruckIcon className="h-4 w-4" />
    Track
  </Link>
)}
                  
                  {expandedOrder === order.id ? (
                    <ChevronUpIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </div>
            </div>

            {/* Expanded Order Details */}
            {expandedOrder === order.id && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="border-t border-gray-200 p-6 bg-gray-50"
              >
                {/* Shipping Address */}
                <div className="mb-6">
                  <h3 className="font-semibold mb-2">Shipping Address</h3>
                  <p className="text-gray-600">
                    {order.first_name} {order.last_name}<br />
                    {order.address_line1}<br />
                    {order.address_line2 && <>{order.address_line2}<br /></>}
                    {order.city}, {order.state} - {order.pincode}<br />
                    {order.country}<br />
                    Phone: {order.phone}<br />
                    Email: {order.email}
                  </p>
                </div>

                {/* Order Items */}
                <div>
                  <h3 className="font-semibold mb-4">Order Items</h3>
                  <div className="space-y-4">
                    {order.items?.map((item) => (
                      <div key={item.id} className="flex gap-4 bg-white p-4 rounded-lg shadow">
                        <div className="w-20 h-20 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden">
                          {item.product?.images?.[0]?.image ? (
                            <img 
                              src={item.product.images[0].image} 
                              alt={item.product_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              No image
                            </div>
                          )}
                        </div>
                        <div className="flex-grow">
                          <h4 className="font-medium">{item.product_name}</h4>
                          {item.variant && (
                            <p className="text-sm text-gray-500">
                              Size: {item.variant.size} | Color: {item.variant.color}
                            </p>
                          )}
                          <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">₹{item.product_price}</p>
                          <p className="text-sm text-gray-500">Subtotal: ₹{item.subtotal}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Summary */}
                <div className="mt-6 border-t pt-4">
                  <div className="flex justify-end">
                    <div className="w-64 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Subtotal:</span>
                        <span>₹{order.subtotal}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Shipping:</span>
                        <span>₹{order.shipping_cost}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tax:</span>
                        <span>₹{order.tax}</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg border-t pt-2">
                        <span>Total:</span>
                        <span className="text-blue-600">₹{order.total}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Orders;