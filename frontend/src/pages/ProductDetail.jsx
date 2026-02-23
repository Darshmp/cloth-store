import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { productAPI } from '../services/api';
import { StarIcon } from '@heroicons/react/24/solid';
import { HeartIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import ReviewForm from '../components/reviews/ReviewForm';
import ReviewsList from '../components/reviews/ReviewsList';
import { useWishlist } from '../context/WishlistContext';
import { HeartIcon as HeartOutlineIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import FrequentlyBought from '../components/recommendations/FrequentlyBought';
import RecentlyViewed from '../components/recommendations/RecentlyViewed';


const ProductDetail = () => {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [userHasReviewed, setUserHasReviewed] = useState(false);
  
  const { addToCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const [inWishlist, setInWishlist] = useState(false);
  const { addToWishlist, removeFromWishlist, checkInWishlist } =useWishlist();

  // Add this useEffect in ProductDetail.jsx
useEffect(() => {
  if (product) {
    // Track recently viewed
    const viewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
    const newViewed = [
      {
        id: product.id,
        slug: product.slug,
        name: product.name,
        price: product.price,
        image: product.images?.[0]?.image
      },
      ...viewed.filter(p => p.id !== product.id)
    ].slice(0, 6); // Keep only last 6
    localStorage.setItem('recentlyViewed', JSON.stringify(newViewed));
  }
}, [product]);


  useEffect(() => {
    fetchProduct();
  }, [slug]);

  useEffect(() => {
    if (user && product?.reviews) {
      const reviewed = product.reviews.some(review => review.user_email === user.email);
      setUserHasReviewed(reviewed);
    }
  }, [user, product]);

  const fetchProduct = async () => {
    try {
      const response = await productAPI.getProduct(slug);
      setProduct(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Failed to load product');
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (product.variants && product.variants.length > 0) {
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

    addToCart(product, quantity, variant);
    toast.success(`${product.name} added to cart!`);
  };

  const handleReviewSubmit = async (reviewData) => {
    try {
      await productAPI.addReview(slug, reviewData);
      toast.success('Review submitted successfully!');
      setShowReviewForm(false);
      // Refresh product data to show new review
      fetchProduct();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error(error.response?.data?.error || 'Failed to submit review');
    }
  };


  useEffect(() => {
  if (isAuthenticated && product) {
    checkWishlistStatus();
  }
}, [isAuthenticated, product]);

const checkWishlistStatus = async () => {
  const status = await checkInWishlist(product.id);
  setInWishlist(status);
};

const handleWishlistToggle = async () => {
  if (!isAuthenticated) {
    toast.error('Please login to add to wishlist');
    return;
  }

  if (inWishlist) {
    await removeFromWishlist(product.id, product.name);
    setInWishlist(false);
  } else {
    await addToWishlist(product);
    setInWishlist(true);
  }
};

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="h-96 bg-gray-200 rounded-lg animate-pulse"></div>
          <div className="space-y-4">
            <div className="h-8 bg-gray-200 rounded w-3/4 animate-pulse"></div>
            <div className="h-6 bg-gray-200 rounded w-1/2 animate-pulse"></div>
            <div className="h-24 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h2 className="text-2xl font-bold mb-4">Product Not Found</h2>
        <Link to="/" className="text-blue-600 hover:underline">Go back home</Link>
      </div>
    );
  }

  const images = product.images || [];
  const variants = product.variants || [];
  const sizes = [...new Set(variants.map(v => v.size))];
  const colors = [...new Set(variants.map(v => v.color))];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Image Gallery */}
        <div>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-lg shadow-lg overflow-hidden mb-4"
          >
            <img
              src={images[selectedImage]?.image || 'https://via.placeholder.com/600'}
              alt={product.name}
              className="w-full h-96 object-cover"
            />
          </motion.div>
          
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
                  <img src={img.image} alt={product.name} className="w-full h-20 object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div>
          <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
          
          {/* Rating */}
          {product.reviews && product.reviews.length > 0 && (
            <div className="flex items-center mb-4">
              <div className="flex text-yellow-400 mr-2">
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
              <span className="text-gray-600">
                ({product.reviews.length} reviews)
              </span>
            </div>
          )}

          {/* Price */}
          <div className="mb-6">
            <span className="text-3xl font-bold text-blue-600">₹{product.price}</span>
            {product.compare_price && (
              <span className="ml-2 text-lg text-gray-500 line-through">
                ₹{product.compare_price}
              </span>
            )}
            {product.discount_percentage > 0 && (
              <span className="ml-2 bg-red-500 text-white px-2 py-1 rounded-full text-sm">
                {product.discount_percentage}% OFF
              </span>
            )}
          </div>

          {/* Description */}
          <p className="text-gray-600 mb-6">{product.description}</p>

          {/* Size Selection */}
          {sizes.length > 0 && (
            <div className="mb-6">
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
            <div className="mb-6">
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
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantity
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => quantity > 1 && setQuantity(quantity - 1)}
                className="w-10 h-10 border rounded-lg hover:bg-gray-100 transition"
              >
                -
              </button>
              <span className="w-16 text-center text-lg">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-10 h-10 border rounded-lg hover:bg-gray-100 transition"
              >
                +
              </button>
            </div>
          </div>

{/* Actions */}
<div className="flex gap-4">
  <button
    onClick={handleAddToCart}
    className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold 
               hover:bg-blue-700 transition transform hover:scale-105"
  >
    Add to Cart
  </button>
  <button
    onClick={handleWishlistToggle}
    className={`p-3 border rounded-lg transition transform hover:scale-105 ${
      inWishlist 
        ? 'bg-red-50 border-red-500 text-red-500' 
        : 'hover:bg-gray-100'
    }`}
  >
    {inWishlist ? (
      <HeartSolidIcon className="h-6 w-6 text-red-500" />
    ) : (
      <HeartOutlineIcon className="h-6 w-6" />
    )}
  </button>
</div>

          {/* Product Details */}
          <div className="mt-8 border-t pt-8">
            <h3 className="font-semibold mb-2">Product Details</h3>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              {product.material && (
                <li>Material: {product.material}</li>
              )}
              {product.care_instructions && (
                <li>Care: {product.care_instructions}</li>
              )}
              <li>SKU: {product.sku}</li>
              <li>Availability: {product.stock > 0 ? 'In Stock' : 'Out of Stock'}</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Customer Reviews</h2>
          
          {isAuthenticated && !userHasReviewed && (
            <button
              onClick={() => setShowReviewForm(!showReviewForm)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Write a Review
            </button>
          )}
        </div>
          <FrequentlyBought productSlug={slug} />
<RecentlyViewed />

        {/* Review Form */}
        {showReviewForm && (
          <div className="mb-8">
            <ReviewForm
              productId={product.id}
              onSubmit={handleReviewSubmit}
              onCancel={() => setShowReviewForm(false)}
            />
          </div>
        )}

        {/* Reviews List */}
        <ReviewsList
          reviews={product.reviews || []}
          averageRating={product.average_rating || 0}
          totalReviews={product.reviews?.length || 0}
        />
      </div>
    </div>
  );
};

export default ProductDetail;