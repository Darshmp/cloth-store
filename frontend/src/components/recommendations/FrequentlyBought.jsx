import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { productAPI } from '../../services/api';
import { useCart } from '../../context/CartContext';
import { ShoppingBagIcon, StarIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const FrequentlyBought = ({ productSlug }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    if (productSlug) {
      fetchRecommendations();
    }
  }, [productSlug]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const response = await productAPI.getRecommendations(productSlug);
      setRecommendations(response.data);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAllToCart = () => {
    recommendations.forEach(product => {
      addToCart(product, 1);
    });
    toast.success('Added all items to cart!');
  };

  if (loading) {
    return (
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6">Frequently Bought Together</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-200 rounded-lg h-48 animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) return null;

  const totalPrice = recommendations.reduce((sum, p) => sum + p.price, 0);
  const originalPrice = recommendations.reduce((sum, p) => sum + (p.compare_price || p.price), 0);
  const discount = originalPrice - totalPrice;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-12 bg-white rounded-lg shadow-lg p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Frequently Bought Together</h2>
        {recommendations.length > 1 && (
          <button
            onClick={handleAddAllToCart}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition flex items-center gap-2"
          >
            <ShoppingBagIcon className="h-5 w-5" />
            Add All to Cart (₹{totalPrice})
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {recommendations.map((product, index) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative"
          >
            <Link to={`/product/${product.slug}`} className="block">
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-3">
                {product.images && product.images[0] ? (
                  <img
                    src={product.images[0].image}
                    alt={product.name}
                    className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    No image
                  </div>
                )}
              </div>
              
              <h3 className="font-medium text-sm mb-1 line-clamp-2 hover:text-blue-600">
                {product.name}
              </h3>
              
              <div className="flex items-center gap-1 mb-1">
                {product.average_rating > 0 && (
                  <>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <StarIcon
                          key={i}
                          className={`h-3 w-3 ${
                            i < Math.round(product.average_rating)
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-gray-500">
                      ({product.review_count || 0})
                    </span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="font-bold text-blue-600">₹{product.price}</span>
                {product.compare_price && (
                  <span className="text-xs text-gray-500 line-through">
                    ₹{product.compare_price}
                  </span>
                )}
              </div>
            </Link>

            <button
              onClick={() => {
                addToCart(product);
                toast.success('Added to cart!');
              }}
              className="mt-2 w-full bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-700 transition"
            >
              Add to Cart
            </button>

            {/* Plus sign between products */}
            {index < recommendations.length - 1 && (
              <div className="absolute -right-3 top-1/2 transform -translate-y-1/2 bg-gray-200 rounded-full w-6 h-6 flex items-center justify-center text-gray-600 font-bold">
                +
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {discount > 0 && (
        <div className="mt-4 p-4 bg-green-50 rounded-lg">
          <p className="text-green-700">
            <span className="font-bold">Bundle offer:</span> Buy together and save ₹{discount}
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default FrequentlyBought;