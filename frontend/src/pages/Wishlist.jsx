import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { HeartIcon, ShoppingBagIcon, TrashIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';

const Wishlist = () => {
  const { wishlistItems, loading, removeFromWishlist, refreshWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('Please login to view wishlist');
    }
  }, [isAuthenticated]);

  const handleAddToCart = (item) => {
    addToCart(item.product_details);
    removeFromWishlist(item.product, item.product_details.name);
    toast.success('Added to cart and removed from wishlist');
  };

  const handleRemove = (item) => {
    removeFromWishlist(item.product, item.product_details.name);
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <HeartIcon className="h-24 w-24 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Please Login</h2>
        <p className="text-gray-600 mb-8">Login to view and manage your wishlist</p>
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
        <h1 className="text-3xl font-bold mb-8">My Wishlist</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow-lg p-4 animate-pulse">
              <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (wishlistItems.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <HeartIcon className="h-24 w-24 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Your Wishlist is Empty</h2>
        <p className="text-gray-600 mb-8">Save items you love to your wishlist</p>
        <Link
          to="/shop"
          className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
        >
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8">My Wishlist ({wishlistItems.length} items)</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {wishlistItems.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white rounded-lg shadow-lg overflow-hidden group relative"
          >
            <Link to={`/product/${item.product_details.slug}`}>
              <div className="h-48 bg-gray-200 overflow-hidden">
                {item.product_details.images && item.product_details.images.length > 0 ? (
                  <img
                    src={item.product_details.images[0].image}
                    alt={item.product_details.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    No image
                  </div>
                )}
              </div>
            </Link>

            <div className="p-4">
              <Link to={`/product/${item.product_details.slug}`}>
                <h3 className="font-semibold mb-1 hover:text-blue-600 transition">
                  {item.product_details.name}
                </h3>
              </Link>

              <p className="text-sm text-gray-600 mb-2">
                {item.product_details.category_name}
              </p>

              <div className="flex items-center justify-between mb-3">
                <span className="text-xl font-bold text-blue-600">
                  ₹{item.product_details.price}
                </span>
                {item.product_details.compare_price && (
                  <span className="text-sm text-gray-500 line-through">
                    ₹{item.product_details.compare_price}
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleAddToCart(item)}
                  className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm 
                           hover:bg-blue-700 transition flex items-center justify-center gap-1"
                >
                  <ShoppingBagIcon className="h-4 w-4" />
                  Add to Cart
                </button>
                <button
                  onClick={() => handleRemove(item)}
                  className="p-2 border rounded-lg hover:bg-red-50 hover:border-red-500 
                           transition group"
                >
                  <TrashIcon className="h-5 w-5 text-gray-500 group-hover:text-red-500" />
                </button>
              </div>
            </div>

            {/* Heart Icon */}
            <div className="absolute top-2 right-2">
              <HeartSolidIcon className="h-6 w-6 text-red-500" />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Wishlist;