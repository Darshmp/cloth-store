import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { productAPI } from '../services/api';
import toast from 'react-hot-toast';
import FlashSaleBanner from '../components/sales/FlashSaleBanner';

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  const fetchFeaturedProducts = async () => {
    try {
      const response = await productAPI.getFeaturedProducts();
      setFeaturedProducts(response.data.results || response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Style That Speaks
              <span className="text-blue-600"> Volumes</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Discover the latest trends in fashion with our premium collection
            </p>
            <Link to="/shop">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold 
                           hover:bg-blue-700 transition-all duration-300 
                           transform hover:shadow-lg"
              >
                Shop Now
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>
<FlashSaleBanner />

      {/* Featured Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Featured Collection</h2>
          
          {loading ? (
            // Loading skeleton
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[1, 2, 3].map((item) => (
                <div key={item} className="bg-white rounded-xl shadow-lg overflow-hidden animate-pulse">
                  <div className="h-64 bg-gray-300"></div>
                  <div className="p-6">
                    <div className="h-6 bg-gray-300 rounded mb-2"></div>
                    <div className="h-4 bg-gray-300 rounded mb-4 w-1/2"></div>
                    <div className="h-10 bg-gray-300 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {featuredProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -10 }}
                  className="bg-white rounded-xl shadow-lg overflow-hidden group"
                >
                  <Link to={`/product/${product.slug}`}>
                    <div className="h-64 bg-gray-200 relative overflow-hidden">
                      {product.images && product.images.length > 0 ? (
                        <img 
                          src={product.images[0].image} 
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">
                          No image
                        </div>
                      )}
                      {product.discount_percentage > 0 && (
                        <span className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full text-sm">
                          {product.discount_percentage}% OFF
                        </span>
                      )}
                    </div>
                  </Link>
                  <div className="p-6">
                    <Link to={`/product/${product.slug}`}>
                      <h3 className="text-xl font-semibold mb-2 hover:text-blue-600 transition">
                        {product.name}
                      </h3>
                    </Link>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <span className="text-2xl font-bold text-gray-900">
                          ${product.price}
                        </span>
                        {product.compare_price && (
                          <span className="ml-2 text-sm text-gray-500 line-through">
                            ${product.compare_price}
                          </span>
                        )}
                      </div>
                      {product.average_rating > 0 && (
                        <span className="text-yellow-500">
                          {'★'.repeat(Math.round(product.average_rating))}
                          {'☆'.repeat(5 - Math.round(product.average_rating))}
                        </span>
                      )}
                    </div>
                    <button 
                      onClick={() => addToCart(product)}
                      className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg 
                                 hover:bg-blue-700 transition transform hover:scale-105
                                 flex items-center justify-center gap-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      Add to Cart
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;