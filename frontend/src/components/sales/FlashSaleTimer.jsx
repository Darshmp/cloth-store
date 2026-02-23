import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const FlashSaleTimer = ({ endTime, onComplete, size = 'medium' }) => {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  function calculateTimeLeft() {
    const difference = new Date(endTime) - new Date();
    
    if (difference <= 0) {
      onComplete?.();
      return { hours: 0, minutes: 0, seconds: 0 };
    }

    return {
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60)
    };
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [endTime]);

  const sizeClasses = {
    small: {
      container: 'gap-1',
      box: 'px-2 py-1 min-w-[40px]',
      number: 'text-lg',
      label: 'text-[10px]'
    },
    medium: {
      container: 'gap-2',
      box: 'px-3 py-2 min-w-[60px]',
      number: 'text-2xl',
      label: 'text-xs'
    },
    large: {
      container: 'gap-3',
      box: 'px-4 py-3 min-w-[80px]',
      number: 'text-3xl',
      label: 'text-sm'
    }
  };

  const selectedSize = sizeClasses[size] || sizeClasses.medium;

  return (
    <div className={`flex items-center ${selectedSize.container}`}>
      <div className={`bg-gray-800 text-white rounded-lg text-center ${selectedSize.box}`}>
        <div className={`font-bold ${selectedSize.number}`}>
          {String(timeLeft.hours).padStart(2, '0')}
        </div>
        <div className={`${selectedSize.label} text-gray-400`}>Hours</div>
      </div>
      <span className={`font-bold text-gray-400 ${selectedSize.number}`}>:</span>
      <div className={`bg-gray-800 text-white rounded-lg text-center ${selectedSize.box}`}>
        <div className={`font-bold ${selectedSize.number}`}>
          {String(timeLeft.minutes).padStart(2, '0')}
        </div>
        <div className={`${selectedSize.label} text-gray-400`}>Mins</div>
      </div>
      <span className={`font-bold text-gray-400 ${selectedSize.number}`}>:</span>
      <div className={`bg-gray-800 text-white rounded-lg text-center ${selectedSize.box}`}>
        <div className={`font-bold ${selectedSize.number}`}>
          {String(timeLeft.seconds).padStart(2, '0')}
        </div>
        <div className={`${selectedSize.label} text-gray-400`}>Secs</div>
      </div>
    </div>
  );
};

export default FlashSaleTimer;