import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { paymentAPI } from '../services/api';
import toast from 'react-hot-toast';

const RazorpayPayment = ({ order, amount, onSuccess, onFailure }) => {
  const navigate = useNavigate();

  useEffect(() => {
    loadRazorpayScript();
  }, []);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        resolve(true);
      };
      script.onerror = () => {
        resolve(false);
      };
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    try {
      // Create Razorpay order
      const response = await paymentAPI.createRazorpayOrder(order.id);
      const razorpayOrder = response.data;

      const options = {
        key: razorpayOrder.key,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: 'Cloth Store',
        description: `Order #${order.order_number}`,
        order_id: razorpayOrder.order_id,
        handler: async (response) => {
          // Verify payment
          try {
            const verifyResponse = await paymentAPI.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              order_id: order.id
            });

            if (verifyResponse.data.success) {
              toast.success('Payment successful!');
              onSuccess?.();
              navigate('/order-confirmation', { state: { order } });
            }
          } catch (error) {
            console.error('Payment verification failed:', error);
            toast.error('Payment verification failed');
            onFailure?.();
          }
        },
        prefill: {
          name: `${order.first_name} ${order.last_name}`,
          email: order.email,
          contact: order.phone
        },
        theme: {
          color: '#2563eb'
        },
        modal: {
          ondismiss: () => {
            toast.error('Payment cancelled');
            onFailure?.();
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();

    } catch (error) {
      console.error('Error creating payment:', error);
      toast.error('Failed to initialize payment');
      onFailure?.();
    }
  };

  return (
    <button
      onClick={handlePayment}
      className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold 
                 hover:bg-blue-700 transition transform hover:scale-105"
    >
      Pay Now (₹{amount})
    </button>
  );
};

export default RazorpayPayment;