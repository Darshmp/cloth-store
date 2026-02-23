import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, StarIcon, ShoppingBagIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartOutline } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid';
import { useWishlist } from '../../context/WishlistContext';
import toast from 'react-hot-toast';

const QuickViewModal = ({ product, isOpen, onClose, onAddToCart }) => {
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [inWishlist, setInWishlist] = useState(false);
  
  const { addToWishlist, removeFromWishlist, checkInWishlist } = useWishlist();

  useEffect(() => {
    if (product) {
      checkWishlistStatus();
    }
  }, [product]);

  const checkWishlistStatus = async () => {
    const status = await checkInWishlist(product?.id);
    setInWishlist(status);
  };

  const handleWishlistToggle = async (e) => {
    e.preventDefault();
    if (inWishlist) {
      await removeFromWishlist(product.id, product.name);
      setInWishlist(false);
    } else {
      await addToWishlist(product);
      setInWishlist(true);
    }
  };

  const handleAddToCart = () => {
    if (product.variants?.length > 0) {
      if (!selectedSize) {
        toast.error('Please select a size');
        return;
      }
      if (!selectedColor) {
        toast.error('Please select a color');
        return;
      }
    }
    
    const variant = product.variants?.find(
      v => v.size === selectedSize && v.color === selectedColor
    );
    
    onAddToCart(product, quantity, variant);
    toast.success('Added to cart!');
    onClose();
  };

  if (!product) return null;

  const images = product.images || [];
  const variants = product.variants || [];
  const sizes = [...new Set(variants.map(v => v.size))];
  const colors = [...new Set(variants.map(v => v.color))];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50"
              onClick={onClose}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto z-10"
            >
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
                {/* Images */}
                <div>
                  <div className="bg-gray-100 rounded-lg overflow-hidden mb-4 h-64">
                    <img
                      src={images[selectedImage]?.image || 'https://via.placeholder.com/400'}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  {images.length > 1 && (
                    <div className="grid grid-cols-4 gap-2">
                      {images.map((img, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedImage(index)}
                          className={`border-2 rounded-lg overflow-hidden ${
                            selectedImage === index ? 'border-blue-600' : 'border-transparent'
                          }`}
                        >
                          <img src={img.image} alt="" className="w-full h-16 object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Details */}
                <div>
                  <h2 className="text-2xl font-bold mb-2">{product.name}</h2>
                  
                  {/* Rating */}
                  {product.average_rating > 0 && (
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <StarIcon
                            key={i}
                            className={`h-5 w-5 ${
                              i < Math.round(product.average_rating)
                                ? 'text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-600">
                        ({product.review_count || 0} reviews)
                      </span>
                    </div>
                  )}

                  {/* Price */}
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-blue-600">₹{product.price}</span>
                    {product.compare_price && (
                      <span className="ml-2 text-lg text-gray-500 line-through">
                        ₹{product.compare_price}
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-gray-600 mb-4">{product.description}</p>

                  {/* Size Selection */}
                  {sizes.length > 0 && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Size
                      </label>
                      <div className="flex gap-2 flex-wrap">
                        {sizes.map(size => (
                          <button
                            key={size}
                            onClick={() => setSelectedSize(size)}
                            className={`px-4 py-2 border rounded-lg transition ${
                              selectedSize === size
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'hover:border-blue-600'
                            }`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Color Selection */}
                  {colors.length > 0 && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Color
                      </label>
                      <div className="flex gap-2 flex-wrap">
                        {colors.map(color => (
                          <button
                            key={color}
                            onClick={() => setSelectedColor(color)}
                            className={`px-4 py-2 border rounded-lg transition ${
                              selectedColor === color
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'hover:border-blue-600'
                            }`}
                          >
                            {color}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quantity */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantity
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => quantity > 1 && setQuantity(quantity - 1)}
                        className="w-8 h-8 border rounded-lg hover:bg-gray-100"
                      >
                        -
                      </button>
                      <span className="w-12 text-center">{quantity}</span>
                      <button
                        onClick={() => setQuantity(quantity + 1)}
                        className="w-8 h-8 border rounded-lg hover:bg-gray-100"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button
                      onClick={handleAddToCart}
                      className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2"
                    >
                      <ShoppingBagIcon className="h-5 w-5" />
                      Add to Cart
                    </button>
                    <button
                      onClick={handleWishlistToggle}
                      className={`p-3 border rounded-lg transition ${
                        inWishlist ? 'bg-red-50 border-red-500' : 'hover:bg-gray-100'
                      }`}
                    >
                      {inWishlist ? (
                        <HeartSolid className="h-6 w-6 text-red-500" />
                      ) : (
                        <HeartOutline className="h-6 w-6" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default QuickViewModal;