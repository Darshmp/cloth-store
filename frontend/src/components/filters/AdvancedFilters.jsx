import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDownIcon, 
  ChevronUpIcon,
  XMarkIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';

const AdvancedFilters = ({ filters, onFilterChange, onClearFilters }) => {
  const [expandedSections, setExpandedSections] = useState({
    category: true,
    price: true,
    rating: true,
    size: false,
    color: false,
    discount: false,
    brand: false
  });

  const [priceRange, setPriceRange] = useState({
    min: filters.minPrice || 0,
    max: filters.maxPrice || 10000
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handlePriceChange = (type, value) => {
    const newRange = { ...priceRange, [type]: value };
    setPriceRange(newRange);
    onFilterChange('minPrice', newRange.min);
    onFilterChange('maxPrice', newRange.max);
  };

  const handleRatingChange = (rating) => {
    if (filters.minRating === rating) {
      onFilterChange('minRating', null);
    } else {
      onFilterChange('minRating', rating);
    }
  };

  const handleDiscountChange = (discount) => {
    if (filters.minDiscount === discount) {
      onFilterChange('minDiscount', null);
    } else {
      onFilterChange('minDiscount', discount);
    }
  };

  const handleSizeChange = (size) => {
    const currentSizes = filters.sizes || [];
    if (currentSizes.includes(size)) {
      onFilterChange('sizes', currentSizes.filter(s => s !== size));
    } else {
      onFilterChange('sizes', [...currentSizes, size]);
    }
  };

  const handleColorChange = (color) => {
    const currentColors = filters.colors || [];
    if (currentColors.includes(color)) {
      onFilterChange('colors', currentColors.filter(c => c !== color));
    } else {
      onFilterChange('colors', [...currentColors, color]);
    }
  };

  // Sample data - replace with API call
  const filterOptions = {
    categories: [
      { slug: 'mens-clothing', name: "Men's Clothing", count: 45 },
      { slug: 'womens-clothing', name: "Women's Clothing", count: 62 },
      { slug: 'kids-clothing', name: "Kids' Clothing", count: 28 },
      { slug: 'accessories', name: 'Accessories', count: 34 }
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    colors: ['Black', 'White', 'Red', 'Blue', 'Green', 'Yellow'],
    brands: ['Nike', 'Adidas', 'Puma', 'Zara', 'H&M'],
    rating_options: [4, 3, 2, 1],
    discount_options: [10, 20, 30, 40, 50],
    price_range: { min: 0, max: 10000 }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <FunnelIcon className="h-5 w-5" />
          Filters
        </h2>
        <button
          onClick={onClearFilters}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          Clear All
        </button>
      </div>

      {/* Active Filters */}
      {Object.keys(filters).length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {Object.entries(filters).map(([key, value]) => {
            if (!value || (Array.isArray(value) && value.length === 0)) return null;
            return (
              <span
                key={key}
                className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm"
              >
                {key}: {Array.isArray(value) ? value.join(', ') : value}
                <button onClick={() => onFilterChange(key, null)}>
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </span>
            );
          })}
        </div>
      )}

      {/* Categories */}
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
        
        <AnimatePresence>
          {expandedSections.category && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-2 space-y-2"
            >
              {filterOptions.categories.map(cat => (
                <label key={cat.slug} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.categories?.includes(cat.slug)}
                      onChange={() => {
                        const current = filters.categories || [];
                        if (current.includes(cat.slug)) {
                          onFilterChange('categories', current.filter(c => c !== cat.slug));
                        } else {
                          onFilterChange('categories', [...current, cat.slug]);
                        }
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm">{cat.name}</span>
                  </div>
                  <span className="text-xs text-gray-500">({cat.count})</span>
                </label>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Price Range */}
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
        
        <AnimatePresence>
          {expandedSections.price && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4"
            >
              <input
                type="range"
                min={filterOptions.price_range.min}
                max={filterOptions.price_range.max}
                value={priceRange.max}
                onChange={(e) => handlePriceChange('max', parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between mt-2">
                <input
                  type="number"
                  value={priceRange.min}
                  onChange={(e) => handlePriceChange('min', parseInt(e.target.value))}
                  className="w-20 px-2 py-1 border rounded text-sm"
                  placeholder="Min"
                />
                <span>-</span>
                <input
                  type="number"
                  value={priceRange.max}
                  onChange={(e) => handlePriceChange('max', parseInt(e.target.value))}
                  className="w-20 px-2 py-1 border rounded text-sm"
                  placeholder="Max"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Rating */}
      <div className="border-b pb-4 mb-4">
        <button
          onClick={() => toggleSection('rating')}
          className="flex items-center justify-between w-full text-left font-medium"
        >
          <span>Customer Rating</span>
          {expandedSections.rating ? (
            <ChevronUpIcon className="h-5 w-5" />
          ) : (
            <ChevronDownIcon className="h-5 w-5" />
          )}
        </button>
        
        <AnimatePresence>
          {expandedSections.rating && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-2 space-y-2"
            >
              {filterOptions.rating_options.map(rating => (
                <label key={rating} className="flex items-center">
                  <input
                    type="radio"
                    name="rating"
                    checked={filters.minRating === rating}
                    onChange={() => handleRatingChange(rating)}
                    className="mr-2"
                  />
                  <span className="text-sm">
                    {rating}★ & above
                  </span>
                </label>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Size */}
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
        
        <AnimatePresence>
          {expandedSections.size && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-2 flex flex-wrap gap-2"
            >
              {filterOptions.sizes.map(size => (
                <button
                  key={size}
                  onClick={() => handleSizeChange(size)}
                  className={`px-3 py-1 border rounded-md text-sm ${
                    filters.sizes?.includes(size)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'hover:border-blue-600'
                  }`}
                >
                  {size}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Color */}
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
        
        <AnimatePresence>
          {expandedSections.color && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-2 flex flex-wrap gap-2"
            >
              {filterOptions.colors.map(color => (
                <button
                  key={color}
                  onClick={() => handleColorChange(color)}
                  className={`px-3 py-1 border rounded-md text-sm ${
                    filters.colors?.includes(color)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'hover:border-blue-600'
                  }`}
                >
                  {color}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Discount */}
      <div className="border-b pb-4 mb-4">
        <button
          onClick={() => toggleSection('discount')}
          className="flex items-center justify-between w-full text-left font-medium"
        >
          <span>Discount</span>
          {expandedSections.discount ? (
            <ChevronUpIcon className="h-5 w-5" />
          ) : (
            <ChevronDownIcon className="h-5 w-5" />
          )}
        </button>
        
        <AnimatePresence>
          {expandedSections.discount && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-2 space-y-2"
            >
              {filterOptions.discount_options.map(discount => (
                <label key={discount} className="flex items-center">
                  <input
                    type="radio"
                    name="discount"
                    checked={filters.minDiscount === discount}
                    onChange={() => handleDiscountChange(discount)}
                    className="mr-2"
                  />
                  <span className="text-sm">{discount}% or above</span>
                </label>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Brand */}
      <div>
        <button
          onClick={() => toggleSection('brand')}
          className="flex items-center justify-between w-full text-left font-medium"
        >
          <span>Brand</span>
          {expandedSections.brand ? (
            <ChevronUpIcon className="h-5 w-5" />
          ) : (
            <ChevronDownIcon className="h-5 w-5" />
          )}
        </button>
        
        <AnimatePresence>
          {expandedSections.brand && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-2 space-y-2"
            >
              {filterOptions.brands.map(brand => (
                <label key={brand} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.brands?.includes(brand)}
                    onChange={() => {
                      const current = filters.brands || [];
                      if (current.includes(brand)) {
                        onFilterChange('brands', current.filter(b => b !== brand));
                      } else {
                        onFilterChange('brands', [...current, brand]);
                      }
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm">{brand}</span>
                </label>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AdvancedFilters;