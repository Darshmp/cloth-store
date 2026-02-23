import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { productAPI } from '../services/api';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import QuickViewModal from '../components/modals/QuickViewModal';
import { 
  FunnelIcon, 
  XMarkIcon, 
  MagnifyingGlassIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  StarIcon,
  HeartIcon as HeartOutline,
  ShoppingBagIcon,
  ArrowsPointingOutIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';

const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalProducts, setTotalProducts] = useState(0);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showQuickView, setShowQuickView] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    category: true,
    price: true,
    rating: true,
    size: true,
    color: true,
    brand: false
  });
  
  const [filters, setFilters] = useState({
    categories: searchParams.getAll('category') || [],
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    minRating: searchParams.get('minRating') || '',
    sizes: searchParams.getAll('size') || [],
    colors: searchParams.getAll('color') || [],
    brands: searchParams.getAll('brand') || [],
    minDiscount: searchParams.get('minDiscount') || '',
    inStock: searchParams.get('inStock') === 'true',
    search: searchParams.get('search') || '',
    sort: searchParams.get('sort') || 'popularity',
    page: parseInt(searchParams.get('page')) || 1
  });

  // Color mapping for swatches
  const colorMap = {
    'black': '#000000',
    'white': '#FFFFFF',
    'red': '#FF0000',
    'blue': '#0000FF',
    'green': '#008000',
    'yellow': '#FFFF00',
    'orange': '#FFA500',
    'purple': '#800080',
    'pink': '#FFC0CB',
    'brown': '#A52A2A',
    'grey': '#808080',
    'gray': '#808080',
    'navy': '#000080',
    'navy blue': '#000080',
    'maroon': '#800000',
    'olive': '#808000',
    'olive green': '#808000',
    'teal': '#008080',
    'cyan': '#00FFFF',
    'magenta': '#FF00FF',
    'lime': '#00FF00',
    'indigo': '#4B0082',
    'violet': '#EE82EE',
    'gold': '#FFD700',
    'silver': '#C0C0C0',
    'bronze': '#CD7F32',
    'copper': '#B87333',
    'charcoal grey': '#36454F',
    'coffee brown': '#6F4E37',
    'iris lavender': '#CAB8FF',
    'liril green': '#7FFFD4',
    'butter yellow': '#FFF9B0',
    'mustard yellow': '#FFDB58',
    'sky blue': '#87CEEB',
    'royal blue': '#4169E1',
    'baby blue': '#89CFF0',
    'mint green': '#98FB98',
    'melange grey': '#BEBEBE',
    'light pink': '#FFB6C1',
    'dusty rose': '#DCAE96',
    'golden yellow': '#FFDF00',
    'default': '#CCCCCC'
  };

  const [sortOptions] = useState([
    { value: 'popularity', label: 'Popularity' },
    { value: 'newest', label: 'Newest First' },
    { value: 'rating', label: 'Avg. Rating' },
    { value: 'price_low', label: 'Price: Low to High' },
    { value: 'price_high', label: 'Price: High to Low' }
  ]);

  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, checkInWishlist } = useWishlist();

  useEffect(() => {
    fetchProducts();
  }, [filters]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      
      const params = {
        page: filters.page,
        page_size: 12,
        search: filters.search,
        ordering: filters.sort
      };

      if (filters.categories?.length) {
        params.category__slug__in = filters.categories.join(',');
      }
      if (filters.minPrice) params.min_price = filters.minPrice;
      if (filters.maxPrice) params.max_price = filters.maxPrice;
      if (filters.minRating) params.min_rating = filters.minRating;
      if (filters.sizes?.length) {
        params.size__in = filters.sizes.join(',');
      }
      if (filters.colors?.length) {
        params.color__in = filters.colors.join(',');
      }
      if (filters.brands?.length) {
        params.brand__in = filters.brands.join(',');
      }
      if (filters.minDiscount) params.min_discount = filters.minDiscount;
      if (filters.inStock) params.in_stock = true;

      const response = await productAPI.getProducts(params);
      setProducts(response.data.results || response.data);
      setTotalProducts(response.data.count || response.data.length);
      
      updateUrlParams();
      
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const updateUrlParams = () => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach(v => params.append(key, v));
      } else if (value) {
        params.set(key, value);
      }
    });
    setSearchParams(params);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      categories: [],
      minPrice: '',
      maxPrice: '',
      minRating: '',
      sizes: [],
      colors: [],
      brands: [],
      minDiscount: '',
      inStock: false,
      search: '',
      sort: 'popularity',
      page: 1
    });
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleQuickView = (product) => {
    setSelectedProduct(product);
    setShowQuickView(true);
  };

  const handleWishlistToggle = async (product, e) => {
    e.preventDefault();
    const inWishlist = await checkInWishlist(product.id);
    if (inWishlist) {
      await removeFromWishlist(product.id, product.name);
    } else {
      await addToWishlist(product);
    }
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.categories?.length) count += filters.categories.length;
    if (filters.minPrice || filters.maxPrice) count++;
    if (filters.minRating) count++;
    if (filters.sizes?.length) count += filters.sizes.length;
    if (filters.colors?.length) count += filters.colors.length;
    if (filters.brands?.length) count += filters.brands.length;
    if (filters.minDiscount) count++;
    if (filters.inStock) count++;
    return count;
  };

  const getColorHex = (colorName) => {
    if (!colorName) return colorMap.default;
    const key = colorName.toLowerCase().trim();
    return colorMap[key] || colorMap.default;
  };

  const sizeOptions = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Shop</h1>
          <p className="text-gray-600 mt-1">
            {loading ? 'Loading...' : `${totalProducts} products found`}
          </p>
        </div>

        {/* Search and Sort Bar */}
        <div className="flex gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search products..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 w-64"
            />
            <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>

          <select
            value={filters.sort}
            onChange={(e) => handleFilterChange('sort', e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            {sortOptions.map(option => (
              <option key={option.value} value={option.value}>
                Sort by: {option.label}
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowMobileFilters(true)}
            className="md:hidden relative px-4 py-2 border rounded-lg"
          >
            <FunnelIcon className="h-5 w-5" />
            {getActiveFilterCount() > 0 && (
              <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {getActiveFilterCount()}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="flex gap-8">
        {/* Desktop Filters */}
        <div className="hidden md:block w-80 flex-shrink-0">
          <div className="bg-white rounded-lg shadow-lg p-6 sticky top-24">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <FunnelIcon className="h-5 w-5" />
                Filters
              </h2>
              <button
                onClick={clearFilters}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Clear All
              </button>
            </div>

            {/* Categories Filter */}
            <div className="border-b pb-4 mb-4">
              <button
                onClick={() => toggleSection('category')}
                className="flex items-center justify-between w-full text-left font-medium"
              >
                <span>Categories</span>
                {expandedSections.category ? (
                  <ChevronUpIcon className="h-5 w-5" />
                ) : (
                  <ChevronDownIcon className="h-5 w-5" />
                )}
              </button>
              
              {expandedSections.category && (
                <div className="mt-3 space-y-2">
                  {['Men\'s Clothing', 'Women\'s Clothing', 'Kids\' Clothing', 'Accessories'].map(cat => (
                    <label key={cat} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filters.categories?.includes(cat.toLowerCase().replace(/'/g, '').replace(/\s/g, '-'))}
                          onChange={() => {
                            const slug = cat.toLowerCase().replace(/'/g, '').replace(/\s/g, '-');
                            const current = filters.categories || [];
                            if (current.includes(slug)) {
                              handleFilterChange('categories', current.filter(c => c !== slug));
                            } else {
                              handleFilterChange('categories', [...current, slug]);
                            }
                          }}
                          className="mr-2 rounded text-blue-600"
                        />
                        <span className="text-sm">{cat}</span>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Size Filter */}
            <div className="border-b pb-4 mb-4">
              <button
                onClick={() => toggleSection('size')}
                className="flex items-center justify-between w-full text-left font-medium"
              >
                <span>Size</span>
                {expandedSections.size ? (
                  <ChevronUpIcon className="h-5 w-5" />
                ) : (
                  <ChevronDownIcon className="h-5 w-5" />
                )}
              </button>
              
              {expandedSections.size && (
                <div className="mt-3">
                  <div className="flex flex-wrap gap-2">
                    {sizeOptions.map(size => (
                      <button
                        key={size}
                        onClick={() => {
                          const currentSizes = filters.sizes || [];
                          if (currentSizes.includes(size)) {
                            handleFilterChange('sizes', currentSizes.filter(s => s !== size));
                          } else {
                            handleFilterChange('sizes', [...currentSizes, size]);
                          }
                        }}
                        className={`px-3 py-1.5 border rounded-md text-sm font-medium transition ${
                          filters.sizes?.includes(size)
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-blue-600 hover:text-blue-600'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Color Filter */}
            <div className="border-b pb-4 mb-4">
              <button
                onClick={() => toggleSection('color')}
                className="flex items-center justify-between w-full text-left font-medium"
              >
                <span>Color</span>
                {expandedSections.color ? (
                  <ChevronUpIcon className="h-5 w-5" />
                ) : (
                  <ChevronDownIcon className="h-5 w-5" />
                )}
              </button>
              
              {expandedSections.color && (
                <div className="mt-3">
                  <div className="flex flex-wrap gap-2">
                    {Object.keys(colorMap).slice(0, 20).map(color => (
                      <button
                        key={color}
                        onClick={() => {
                          const currentColors = filters.colors || [];
                          const colorName = color.charAt(0).toUpperCase() + color.slice(1);
                          if (currentColors.includes(colorName)) {
                            handleFilterChange('colors', currentColors.filter(c => c !== colorName));
                          } else {
                            handleFilterChange('colors', [...currentColors, colorName]);
                          }
                        }}
                        className={`w-8 h-8 rounded-full border-2 transition transform hover:scale-110 ${
                          filters.colors?.includes(color.charAt(0).toUpperCase() + color.slice(1))
                            ? 'border-blue-600 scale-110'
                            : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: getColorHex(color) }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Price Range Filter */}
            <div className="border-b pb-4 mb-4">
              <button
                onClick={() => toggleSection('price')}
                className="flex items-center justify-between w-full text-left font-medium"
              >
                <span>Price Range</span>
                {expandedSections.price ? (
                  <ChevronUpIcon className="h-5 w-5" />
                ) : (
                  <ChevronDownIcon className="h-5 w-5" />
                )}
              </button>
              
              {expandedSections.price && (
                <div className="mt-3">
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={filters.minPrice}
                      onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                      className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={filters.maxPrice}
                      onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                      className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Rating Filter */}
            <div className="border-b pb-4 mb-4">
              <button
                onClick={() => toggleSection('rating')}
                className="flex items-center justify-between w-full text-left font-medium"
              >
                <span>Rating</span>
                {expandedSections.rating ? (
                  <ChevronUpIcon className="h-5 w-5" />
                ) : (
                  <ChevronDownIcon className="h-5 w-5" />
                )}
              </button>
              
              {expandedSections.rating && (
                <div className="mt-3 space-y-2">
                  {[4, 3, 2, 1].map(rating => (
                    <label key={rating} className="flex items-center">
                      <input
                        type="radio"
                        name="rating"
                        checked={filters.minRating === rating.toString()}
                        onChange={() => handleFilterChange('minRating', rating)}
                        className="mr-2"
                      />
                      <span className="text-sm">{rating}★ & above</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Filters Modal */}
        <AnimatePresence>
          {showMobileFilters && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden"
              onClick={() => setShowMobileFilters(false)}
            >
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'tween' }}
                className="absolute right-0 top-0 h-full w-80 bg-white overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-4">
                  <button
                    onClick={() => setShowMobileFilters(false)}
                    className="mb-4 text-gray-500"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                  {/* Mobile filter content - simplified */}
                  <div className="bg-white rounded-lg p-4">
                    <h2 className="text-lg font-semibold mb-4">Filters</h2>
                    <p className="text-gray-500">Mobile filters coming soon...</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Products Grid */}
        <div className="flex-1">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow-lg p-4 animate-pulse">
                  <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16">
              <h3 className="text-xl font-semibold mb-2">No products found</h3>
              <p className="text-gray-600 mb-4">Try adjusting your filters</p>
              <button
                onClick={clearFilters}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
               {products.map((product, index) => (
  <motion.div
    key={product.id}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.05 }}
    className="bg-white rounded-lg shadow-lg overflow-hidden group relative"
  >
    {/* Product Image */}
    <Link to={`/product/${product.slug}`} className="block relative">
      <div className="h-48 bg-gray-200 overflow-hidden">
        {product.images && product.images.length > 0 ? (
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

      {/* Discount Badge */}
      {product.discount_percentage > 0 && (
        <span className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
          {product.discount_percentage}% OFF
        </span>
      )}

      {/* Quick View Button */}
      <button
        onClick={(e) => {
          e.preventDefault();
          handleQuickView(product);
        }}
        className="absolute top-2 right-12 bg-white p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <ArrowsPointingOutIcon className="h-4 w-4" />
      </button>

      {/* Wishlist Button */}
      <button
        onClick={(e) => handleWishlistToggle(product, e)}
        className="absolute top-2 right-2 bg-white p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <HeartOutline className="h-4 w-4" />
      </button>
    </Link>

    {/* Product Info */}
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
                    ? 'text-yellow-400'
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
        <span className="text-xl font-bold text-blue-600">
          ₹{product.price}
        </span>
        {product.compare_price && (
          <span className="ml-2 text-sm text-gray-500 line-through">
            ₹{product.compare_price}
          </span>
        )}
      </div>

      {/* Color Swatches */}
      {product.variants && product.variants.length > 0 && (
        <div className="mb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {[...new Set(product.variants.map(v => v.color))].slice(0, 6).map((color, idx) => (
              <button
                key={idx}
                className="w-6 h-6 rounded-full border-2 border-gray-200 shadow-sm hover:scale-110 transition-transform"
                style={{ backgroundColor: getColorHex(color) }}
                title={color}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toast.success(`${color} selected`);
                }}
              />
            ))}
            {product.variants.length > 6 && (
              <span className="text-xs text-gray-500">+{product.variants.length - 6}</span>
            )}
          </div>
        </div>
      )}

      {/* ✅ FIXED: Size Selection Buttons */}
      {product.variants && product.variants.length > 0 && (
        <div className="mb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Get unique sizes and sort them properly */}
            {[...new Set(product.variants.map(v => v.size))]
              .sort((a, b) => {
                const sizeOrder = { 'XS': 1, 'S': 2, 'M': 3, 'L': 4, 'XL': 5, 'XXL': 6, 'XXXL': 7 };
                return (sizeOrder[a] || 99) - (sizeOrder[b] || 99);
              })
              .map((size, idx) => {
                // Check if this size is in stock
                const hasStock = product.variants.some(v => v.size === size && v.stock > 0);
                
                return (
                  <button
                    key={idx}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (hasStock) {
                        toast.success(`Size ${size} selected`);
                        // You can store selected size in state
                        // Or directly add to cart with this size
                      } else {
                        toast.error(`Size ${size} is out of stock`);
                      }
                    }}
                    className={`px-3 py-1 text-xs font-medium border rounded-md transition
                      ${hasStock 
                        ? 'border-gray-300 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 cursor-pointer' 
                        : 'border-gray-200 text-gray-400 cursor-not-allowed bg-gray-50'
                      }`}
                    disabled={!hasStock}
                    title={hasStock ? `Select size ${size}` : `${size} out of stock`}
                  >
                    {size}
                  </button>
                );
            })}
          </div>
          {/* Optional: Show size guide link */}
          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toast('Size guide coming soon');
            }}
            className="text-xs text-blue-600 hover:underline mt-1 inline-block"
          >
            Size Guide
          </button>
        </div>
      )}

      {/* Add to Cart Button */}
      <button
        onClick={() => {
          addToCart(product);
          toast.success('Added to cart!');
        }}
        className="w-full bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700 transition"
      >
        Add to Cart
      </button>
    </div>
  </motion.div>
))}
              </div>

              {/* Pagination */}
              {totalProducts > 12 && (
                <div className="mt-8 flex justify-center gap-2">
                  <button
                    onClick={() => handleFilterChange('page', filters.page - 1)}
                    disabled={filters.page === 1}
                    className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-gray-100"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2">
                    Page {filters.page} of {Math.ceil(totalProducts / 12)}
                  </span>
                  <button
                    onClick={() => handleFilterChange('page', filters.page + 1)}
                    disabled={filters.page >= Math.ceil(totalProducts / 12)}
                    className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-gray-100"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Quick View Modal */}
      {showQuickView && selectedProduct && (
        <QuickViewModal
          product={selectedProduct}
          isOpen={showQuickView}
          onClose={() => setShowQuickView(false)}
          onAddToCart={addToCart}
        />
      )}
    </div>
  );
};

export default Shop;