import { useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

const OrderConfirmation = () => {
  const location = useLocation();
  const order = location.state?.order;

  if (!order) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold mb-4">No order found</h2>
        <Link to="/" className="text-blue-600 hover:underline">Go to Home</Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-lg p-8 text-center"
      >
        <CheckCircleIcon className="h-20 w-20 text-green-500 mx-auto mb-4" />
        
        <h1 className="text-3xl font-bold mb-2">Order Confirmed!</h1>
        <p className="text-gray-600 mb-6">
          Thank you for your purchase. Your order has been received.
        </p>

        <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left">
          <p className="font-semibold mb-2">Order Number:</p>
          <p className="text-2xl font-mono text-blue-600 mb-4">{order.order_number}</p>

          <p className="font-semibold mb-2">Order Total:</p>
          <p className="text-xl">₹{order.total}</p>
        </div>

        <div className="space-y-4">
          <Link
            to="/"
            className="block w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Continue Shopping
          </Link>
          <Link
            to="/orders"
            className="block w-full border-2 border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition"
          >
            View My Orders
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default OrderConfirmation;