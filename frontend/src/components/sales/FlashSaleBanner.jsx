import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { salesAPI } from '../../services/api';
import FlashSaleTimer from './FlashSaleTimer';
import { BoltIcon, FireIcon } from '@heroicons/react/24/solid';

const FlashSaleBanner = () => {
  const [liveSales, setLiveSales] = useState([]);
  const [upcomingSales, setUpcomingSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    fetchDeals();
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % liveSales.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [liveSales.length]);

  const fetchDeals = async () => {
    try {
      const response = await salesAPI.getHomepageDeals();
      setLiveSales(response.data.live);
      setUpcomingSales(response.data.upcoming);
    } catch (error) {
      console.error('Error fetching deals:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-6 rounded-lg shadow-lg animate-pulse">
        <div className="h-8 bg-red-400 rounded w-48"></div>
      </div>
    );
  }

  if (liveSales.length === 0 && upcomingSales.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Live Sales Carousel */}
      {liveSales.length > 0 && (
        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg p-6 shadow-lg"
            >
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className="bg-white p-2 rounded-full">
                    <BoltIcon className="h-6 w-6 text-red-500" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold flex items-center gap-2">
                      {liveSales[currentIndex].title}
                      <span className="bg-yellow-400 text-red-600 text-xs px-2 py-1 rounded-full animate-pulse">
                        LIVE
                      </span>
                    </h3>
                    <p className="text-red-100">{liveSales[currentIndex].description}</p>
                  </div>
                </div>
                
                <FlashSaleTimer 
                  endTime={liveSales[currentIndex].end_time} 
                  onComplete={fetchDeals}
                  size="medium"
                />
                
                <Link
                  to={`/flash-sale/${liveSales[currentIndex].id}`}
                  className="bg-white text-red-600 px-6 py-2 rounded-lg font-semibold hover:bg-red-50 transition shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Shop Now →
                </Link>
              </div>

              {/* Progress Bar */}
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-1">
                  <span>🔥 {liveSales[currentIndex].sold_quantity} sold</span>
                  <span>⚡ Only {liveSales[currentIndex].total_quantity - liveSales[currentIndex].sold_quantity} left</span>
                </div>
                <div className="w-full bg-red-400 rounded-full h-2.5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${liveSales[currentIndex].progress}%` }}
                    transition={{ duration: 0.5 }}
                    className="bg-white h-2.5 rounded-full"
                  />
                </div>
              </div>

              {/* Dots Indicator */}
              {liveSales.length > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  {liveSales.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentIndex(idx)}
                      className={`h-2 rounded-full transition-all ${
                        idx === currentIndex ? 'w-8 bg-white' : 'w-2 bg-red-300'
                      }`}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {/* Upcoming Sales Teaser */}
      {upcomingSales.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-lg p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <FireIcon className="h-5 w-5 text-yellow-400" />
            <h4 className="font-semibold">Coming Soon</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {upcomingSales.map((sale) => (
              <div key={sale.id} className="border-l-2 border-yellow-400 pl-3">
                <p className="font-medium">{sale.title}</p>
                <p className="text-sm text-gray-400">
                  Starts: {new Date(sale.start_time).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
                <p className="text-sm text-yellow-400 mt-1">{sale.discount_percentage}% OFF</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default FlashSaleBanner;