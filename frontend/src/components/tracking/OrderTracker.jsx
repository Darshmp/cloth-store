import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircleIcon, 
  TruckIcon, 
  CubeIcon,
  ClockIcon,
  MapPinIcon,
  ShoppingBagIcon,
  HomeIcon
} from '@heroicons/react/24/solid';
import { orderAPI } from '../../services/api';

const OrderTracker = ({ orderId }) => {
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTracking();
    // Refresh every 30 seconds
    const interval = setInterval(fetchTracking, 30000);
    return () => clearInterval(interval);
  }, [orderId]);

  const fetchTracking = async () => {
    try {
      const response = await orderAPI.trackOrder(orderId);
      console.log('Tracking data:', response.data);
      setTracking(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to load tracking information');
      console.error('Tracking error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'order_placed': return <ShoppingBagIcon className="h-5 w-5" />;
      case 'processed': return <CubeIcon className="h-5 w-5" />;
      case 'shipped': return <TruckIcon className="h-5 w-5" />;
      case 'out_for_delivery': return <TruckIcon className="h-5 w-5" />;
      case 'delivered': return <CheckCircleIcon className="h-5 w-5" />;
      default: return <ClockIcon className="h-5 w-5" />;
    }
  };

  const getStatusColor = (status, isCompleted) => {
    if (isCompleted) {
      switch(status) {
        case 'delivered': return 'bg-green-500';
        case 'shipped': 
        case 'out_for_delivery': return 'bg-blue-500';
        case 'processed': return 'bg-indigo-500';
        case 'order_placed': return 'bg-purple-500';
        default: return 'bg-green-500';
      }
    }
    return 'bg-gray-300';
  };

  const getStatusText = (status) => {
    switch(status) {
      case 'order_placed': return 'Order Placed';
      case 'processed': return 'Processed';
      case 'shipped': return 'Shipped';
      case 'out_for_delivery': return 'Out for Delivery';
      case 'delivered': return 'Delivered';
      default: return status.replace(/_/g, ' ');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateLong = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !tracking) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 text-center">
        <p className="text-red-500">{error || 'Unable to load tracking information'}</p>
        <button 
          onClick={fetchTracking}
          className="mt-4 text-blue-600 hover:text-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  const trackingHistory = tracking.tracking_history || [];
  
  // Define all possible statuses in order
  const allStatuses = [
    { key: 'order_placed', label: 'Order Placed' },
    { key: 'processed', label: 'Processed' },
    { key: 'shipped', label: 'Shipped' },
    { key: 'out_for_delivery', label: 'Out for Delivery' },
    { key: 'delivered', label: 'Delivered' }
  ];

  // Determine which statuses are completed
  const completedStatuses = trackingHistory.map(event => event.status);
  const isDelivered = completedStatuses.includes('delivered') || tracking.order_status === 'delivered';
  
  // Calculate progress
  const completedCount = completedStatuses.length;
  const totalSteps = allStatuses.length;
  const progressPercentage = (completedCount / totalSteps) * 100;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            Track Order
            {isDelivered && (
              <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                <CheckCircleIcon className="h-3 w-3" />
                Delivered
              </span>
            )}
          </h3>
          <p className="text-sm text-gray-600">Order #{tracking.order_number}</p>
        </div>
        
        {tracking.tracking_number && (
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-xs text-gray-500">Tracking Number</p>
            <p className="font-mono text-sm font-semibold">{tracking.tracking_number}</p>
            <p className="text-xs text-gray-500 mt-1">{tracking.courier_company}</p>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Order Progress</span>
          <span className="text-sm text-gray-600">
            {completedCount} of {totalSteps} steps completed
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.5 }}
            className={`h-3 rounded-full ${
              isDelivered ? 'bg-green-500' : 'bg-gradient-to-r from-blue-500 to-green-500'
            }`}
          />
        </div>
      </div>

      {/* Estimated Delivery or Delivery Confirmation */}
      {tracking.estimated_delivery && !isDelivered && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg mb-8">
          <p className="text-sm text-blue-800 font-medium flex items-center gap-2">
            <ClockIcon className="h-4 w-4" />
            Estimated Delivery
          </p>
          <p className="text-lg font-bold text-blue-900">
            {formatDateLong(tracking.estimated_delivery)}
          </p>
        </div>
      )}

      {isDelivered && tracking.delivered_at && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg mb-8">
          <p className="text-sm text-green-800 font-medium flex items-center gap-2">
            <CheckCircleIcon className="h-4 w-4" />
            Delivered on
          </p>
          <p className="text-lg font-bold text-green-900">
            {formatDateLong(tracking.delivered_at)}
          </p>
        </div>
      )}

      {/* Timeline */}
      <div className="relative">
        <h4 className="font-medium text-gray-700 mb-4">Tracking History</h4>
        
        {/* Vertical Line */}
        <div className="absolute left-4 top-12 bottom-0 w-0.5 bg-gray-200"></div>

        {/* Status Steps */}
        <div className="space-y-6">
          {allStatuses.map((status, index) => {
            const isCompleted = completedStatuses.includes(status.key);
            const matchingEvent = trackingHistory.find(e => e.status === status.key);
            
            return (
              <motion.div
                key={status.key}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative flex items-start gap-4"
              >
                {/* Status Icon */}
                <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-white ${
                  getStatusColor(status.key, isCompleted)
                }`}>
                  {getStatusIcon(status.key)}
                </div>

                {/* Status Content */}
                <div className="flex-1 pb-2">
                  <p className={`font-medium ${isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>
                    {status.label}
                  </p>
                  
                  {matchingEvent && (
                    <>
                      <p className="text-sm text-gray-600 mt-1">
                        {matchingEvent.description}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <MapPinIcon className="h-3 w-3" />
                          {matchingEvent.location}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <ClockIcon className="h-3 w-3" />
                          {formatDate(matchingEvent.timestamp)}
                        </span>
                      </div>
                    </>
                  )}
                  
                  {/* Special handling for delivered step when no matching event but order is delivered */}
                  {status.key === 'delivered' && !matchingEvent && isDelivered && (
                    <>
                      <p className="text-sm text-gray-600 mt-1">
                        Package has been delivered successfully
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <MapPinIcon className="h-3 w-3" />
                          Your Location
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <ClockIcon className="h-3 w-3" />
                          {formatDate(tracking.delivered_at)}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {/* Checkmark for completed */}
                {isCompleted && (
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Refresh Indicator */}
      <div className="mt-6 text-center text-xs text-gray-400 flex items-center justify-center gap-2">
        <ClockIcon className="h-3 w-3" />
        Updates every 30 seconds
      </div>
    </div>
  );
};

export default OrderTracker;