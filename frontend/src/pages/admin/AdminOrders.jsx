import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { adminAPI } from '../../services/api';
import { motion } from 'framer-motion';
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  TruckIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [updating, setUpdating] = useState(false);
  
  const { user, isAuthenticated } = useAuth();

  const orderStatuses = [
    'pending',
    'processing',
    'shipped',
    'out_for_delivery',
    'delivered',
    'cancelled'
  ];

  const paymentStatuses = [
    'pending',
    'paid',
    'failed',
    'refunded'
  ];

  useEffect(() => {
    if (!isAuthenticated || !user?.is_staff) {
      toast.error('Unauthorized access');
      return;
    }
    fetchOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [search, statusFilter, orders]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getOrders();
      setOrders(response.data);
      setFilteredOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = orders;

    // Apply search filter
    if (search) {
      filtered = filtered.filter(order => 
        order.order_number.toLowerCase().includes(search.toLowerCase()) ||
        order.email?.toLowerCase().includes(search.toLowerCase()) ||
        order.first_name?.toLowerCase().includes(search.toLowerCase()) ||
        order.last_name?.toLowerCase().includes(search.toLowerCase()) ||
        order.phone?.includes(search)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.order_status === statusFilter);
    }

    setFilteredOrders(filtered);
  };

 const updateOrderStatus = async (orderId, newStatus) => {
  try {
    setUpdating(true);
    const response = await adminAPI.updateOrderStatus(orderId, newStatus);
    
    if (response.data.success) {
      toast.success(`Order status updated to ${newStatus.replace(/_/g, ' ')}`);
      
      // Update local state with the updated order data
      const updatedOrders = orders.map(order => 
        order.id === orderId ? { ...order, order_status: newStatus } : order
      );
      setOrders(updatedOrders);
      
      // Also refresh the orders list to get fresh tracking data
      setTimeout(() => {
        fetchOrders();
      }, 1000);
    }
  } catch (error) {
    console.error('Error updating order status:', error);
    toast.error('Failed to update order status');
  } finally {
    setUpdating(false);
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
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'delivered': return <CheckCircleIcon className="h-5 w-5" />;
      case 'shipped':
      case 'out_for_delivery': return <TruckIcon className="h-5 w-5" />;
      case 'cancelled': return <XCircleIcon className="h-5 w-5" />;
      default: return <ClockIcon className="h-5 w-5" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="h-8 bg-gray-200 rounded w-64 mb-8 animate-pulse"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="bg-white rounded-lg shadow-lg p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Manage Orders</h1>
          <div className="text-sm text-gray-600">
            Total Orders: {orders.length}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search by order #, customer, email, phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>

            {/* Status Filter */}
            <div className="w-full md:w-64 relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
              >
                <option value="all">All Statuses</option>
                {orderStatuses.map(status => (
                  <option key={status} value={status}>
                    {status.replace(/_/g, ' ').toUpperCase()}
                  </option>
                ))}
              </select>
              <FunnelIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {filteredOrders.length === 0 ? (
            <div className="bg-white rounded-lg shadow-lg p-12 text-center">
              <p className="text-gray-500">No orders found</p>
            </div>
          ) : (
            filteredOrders.map((order) => (
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
                      {/* Order Status Badge */}
                      <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${getStatusColor(order.order_status)}`}>
                        {getStatusIcon(order.order_status)}
                        {order.order_status.replace(/_/g, ' ')}
                      </span>
                      
                      {/* Payment Status Badge */}
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPaymentStatusColor(order.payment_status)}`}>
                        Payment: {order.payment_status}
                      </span>
                      
                      <span className="font-bold text-blue-600">
                        {formatCurrency(order.total)}
                      </span>
                      
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
                    {/* Status Update Section */}
                    <div className="mb-6 bg-white p-4 rounded-lg shadow">
                      <h3 className="font-semibold mb-3">Update Order Status</h3>
                      <div className="flex flex-wrap gap-2">
                        {orderStatuses.map((status) => (
                          <button
                            key={status}
                            onClick={() => updateOrderStatus(order.id, status)}
                            disabled={updating || order.order_status === status}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
                              order.order_status === status
                                ? getStatusColor(status) + ' cursor-default'
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                            } ${updating ? 'opacity-50 cursor-wait' : ''}`}
                          >
                            {getStatusIcon(status)}
                            {status.replace(/_/g, ' ')}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Customer Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <h3 className="font-semibold mb-2">Customer Details</h3>
                        <p className="text-gray-600">
                          {order.first_name} {order.last_name}<br />
                          Email: {order.email}<br />
                          Phone: {order.phone}
                        </p>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">Shipping Address</h3>
                        <p className="text-gray-600">
                          {order.address_line1}<br />
                          {order.address_line2 && <>{order.address_line2}<br /></>}
                          {order.city}, {order.state} - {order.pincode}<br />
                          {order.country}
                        </p>
                      </div>
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
                              <p className="font-semibold">{formatCurrency(item.product_price)}</p>
                              <p className="text-sm text-gray-500">Subtotal: {formatCurrency(item.subtotal)}</p>
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
                            <span>{formatCurrency(order.subtotal)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Shipping:</span>
                            <span>{formatCurrency(order.shipping_cost)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Tax:</span>
                            <span>{formatCurrency(order.tax)}</span>
                          </div>
                          <div className="flex justify-between font-bold text-lg border-t pt-2">
                            <span>Total:</span>
                            <span className="text-blue-600">{formatCurrency(order.total)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminOrders;