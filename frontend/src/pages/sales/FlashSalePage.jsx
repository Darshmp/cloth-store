import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { salesAPI } from '../../services/api';
import { useCart } from '../../context/CartContext';
import FlashSaleTimer from '../../components/sales/FlashSaleTimer';
import { BoltIcon, ShoppingBagIcon, StarIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const FlashSalePage = () => {
  const { id } = useParams();
  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    fetchSale();
  }, [id]);

  const fetchSale = async () => {
    try {
      const response = await salesAPI.getFlashSale(id);
      setSale(response.data);
    } catch (error) {
      console.error('Error fetching sale:', error);
      toast.error('Failed to load flash sale');
    } finally {
      setLoading(false);
    }
  };

  const handleClaimDeal = async (product) => {
    try {
      const response = await salesAPI.claimDeal(sale.id, product.id, 1);
      addToCart({
        ...product,
        price: response.data.sale_price
      }, 1);
      toast.success('Deal claimed! Added to cart');
      fetchSale(); // Refresh to update sold count
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to claim deal');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-64 bg-gray-200 rounded-lg"></div>
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h2 className="text-2xl font-bold mb-4">Flash Sale Not Found</h2>
        <Link to="/" className="text-blue-600 hover:underline">Go back home</Link>
      </div>
    );
  }

  const isLive = sale.is_live;
  const remaining = sale.total_quantity - sale.sold_quantity;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Sale Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-gradient-to-r ${
          isLive 
            ? 'from-red-500 to-red-600' 
            : 'from-gray-600 to-gray-700'
        } text-white rounded-lg p-8 mb-8 shadow-xl`}
      >
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-white p-3 rounded-full">
              <BoltIcon className={`h-8 w-8 ${
                isLive ? 'text-red-500' : 'text-gray-500'
              }`} />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">{sale.title}</h1>
              <p className="text-white/90">{sale.description}</p>
            </div>
          </div>

          {isLive ? (
            <div className="text-center">
              <div className="text-sm mb-2">Ends in:</div>
              <FlashSaleTimer endTime={sale.end_time} size="large" />
            </div>
          ) : (
            <div className="bg-black/30 px-6 py-3 rounded-lg">
              <p className="text-lg font-semibold">Starts in:</p>
              <FlashSaleTimer endTime={sale.start_time} size="large" />
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          <div className="bg-white/10 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold">{sale.discount_percentage}%</div>
            <div className="text-sm text-white/80">Discount</div>
          </div>
          <div className="bg-white/10 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold">{remaining}</div>
            <div className="text-sm text-white/80">Items Left</div>
          </div>
          <div className="bg-white/10 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold">{sale.sold_quantity}</div>
            <div className="text-sm text-white/80">Sold</div>
          </div>
          <div className="bg-white/10 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold">{sale.max_quantity_per_user}</div>
            <div className="text-sm text-white/80">Max Per User</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="flex justify-between text-sm mb-2">
            <span>Claimed: {sale.sold_quantity}</span>
            <span>Available: {remaining}</span>
          </div>
          <div className="w-full bg-white/30 rounded-full h-3">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${sale.progress}%` }}
              transition={{ duration: 1 }}
              className="bg-white h-3 rounded-full"
            />
          </div>
        </div>
      </motion.div>

      {/* Products Grid */}
      <h2 className="text-2xl font-bold mb-6">Deals for You</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {sale.products.map((item, index) => {
          const product = item.product_details;
          const salePrice = item.sale_price;
          const originalPrice = product.price;
          const discount = Math.round(((originalPrice - salePrice) / originalPrice) * 100);

          return (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-lg shadow-lg overflow-hidden group relative"
            >
              {/* Discount Badge */}
              <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-full text-sm font-bold z-10">
                {discount}% OFF
              </div>

              {/* Product Image */}
              <Link to={`/product/${product.slug}`} className="block">
                <div className="h-48 bg-gray-200 overflow-hidden">
                  {product.images && product.images[0] ? (
                    <img
                      src={product.images[0].image}
                      alt={product.name}
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
                <Link to={`/product/${product.slug}`}>
                  <h3 className="font-semibold mb-1 hover:text-blue-600 transition line-clamp-2">
                    {product.name}
                  </h3>
                </Link>

                {/* Rating */}
                {product.average_rating > 0 && (
                  <div className="flex items-center gap-1 mb-2">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <StarIcon
                          key={i}
                          className={`h-4 w-4 ${
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
                  </div>
                )}

                {/* Price */}
                <div className="mb-3">
                  <span className="text-2xl font-bold text-red-600">₹{salePrice}</span>
                  <span className="ml-2 text-sm text-gray-500 line-through">
                    ₹{originalPrice}
                  </span>
                </div>

                {/* Stock Status */}
                {remaining > 0 ? (
                  <div className="mb-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-green-600">In Stock</span>
                      <span className="text-gray-500">{remaining} left</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-red-500 h-1.5 rounded-full"
                        style={{ width: `${(sale.sold_quantity / sale.total_quantity) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ) : (
                  <p className="text-red-500 text-sm mb-3">Sold Out</p>
                )}

                {/* Action Button */}
                <button
                  onClick={() => handleClaimDeal(product)}
                  disabled={!isLive || remaining === 0}
                  className={`w-full py-2 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${
                    isLive && remaining > 0
                      ? 'bg-red-500 text-white hover:bg-red-600'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <ShoppingBagIcon className="h-4 w-4" />
                  {isLive ? (remaining > 0 ? 'Claim Deal' : 'Sold Out') : 'Not Live Yet'}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default FlashSalePage;
