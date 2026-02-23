import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { StarIcon } from '@heroicons/react/24/outline';

const RecentlyViewed = () => {
  const [recentProducts, setRecentProducts] = useState([]);

  useEffect(() => {
    const viewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
    setRecentProducts(viewed);
  }, []);

  if (recentProducts.length === 0) return null;

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold mb-6">Recently Viewed</h2>
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {recentProducts.map((product, index) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
          >
            <Link to={`/product/${product.slug}`} className="block">
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-2">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                />
              </div>
              <h3 className="font-medium text-xs line-clamp-2 hover:text-blue-600">
                {product.name}
              </h3>
              <p className="font-bold text-sm mt-1">₹{product.price}</p>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default RecentlyViewed;