import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { adminAPI } from '../../services/api';
import { motion } from 'framer-motion';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  MagnifyingGlassIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    compare_price: '',
    category: '',
    stock: '',
    sku: '',
    is_active: true,
    is_featured: false,
    material: '',
    care_instructions: '',
    variants: []
  });
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreview, setImagePreview] = useState([]);
  
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated || !user?.is_staff) {
      toast.error('Unauthorized access');
      navigate('/');
      return;
    }
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getProducts();
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await adminAPI.getCategories();
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedImages(files);
    
    // Create preview URLs
    const previews = files.map(file => URL.createObjectURL(file));
    setImagePreview(previews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const formDataToSend = new FormData();
    
    // Add all basic fields
    Object.keys(formData).forEach(key => {
      if (key === 'variants') {
        // Handle variants separately - send as JSON string
        if (formData.variants && formData.variants.length > 0) {
          // Clean up variants - remove any empty entries
          const cleanVariants = formData.variants
            .filter(v => v.size && v.color) // Only keep variants with size AND color
            .map(v => ({
              size: v.size,
              color: v.color,
              stock: parseInt(v.stock) || 0,
              price_adjustment: parseFloat(v.price_adjustment) || 0
            }));
          
          if (cleanVariants.length > 0) {
            formDataToSend.append('variants', JSON.stringify(cleanVariants));
          }
        }
      } else if (formData[key] !== null && formData[key] !== '') {
        formDataToSend.append(key, formData[key]);
      }
    });
    
    // Add images
    if (selectedImages.length > 0) {
      selectedImages.forEach(image => {
        formDataToSend.append('uploaded_images', image);
      });
    }

    // Log what we're sending for debugging
    console.log('Sending form data:');
    for (let pair of formDataToSend.entries()) {
      console.log(pair[0], pair[1]);
    }

    try {
      if (editingProduct) {
        await adminAPI.updateProduct(editingProduct.id, formDataToSend);
        toast.success('Product updated successfully');
      } else {
        await adminAPI.createProduct(formDataToSend);
        toast.success('Product created successfully');
      }
      
      setShowAddModal(false);
      setEditingProduct(null);
      resetForm();
      fetchProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      console.error('Error response:', error.response?.data);
      toast.error(error.response?.data?.error || 'Failed to save product');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    
    try {
      await adminAPI.deleteProduct(id);
      toast.success('Product deleted successfully');
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price,
      compare_price: product.compare_price || '',
      category: product.category,
      stock: product.stock,
      sku: product.sku,
      is_active: product.is_active,
      is_featured: product.is_featured,
      material: product.material || '',
      care_instructions: product.care_instructions || '',
      variants: product.variants || []
    });
    setShowAddModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      compare_price: '',
      category: '',
      stock: '',
      sku: '',
      is_active: true,
      is_featured: false,
      material: '',
      care_instructions: '',
      variants: []
    });
    setSelectedImages([]);
    setImagePreview([]);
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(search.toLowerCase()) ||
    product.sku?.toLowerCase().includes(search.toLowerCase())
  );

  // Size options
  const sizeOptions = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Manage Products</h1>
          <button
            onClick={() => {
              resetForm();
              setEditingProduct(null);
              setShowAddModal(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
          >
            <PlusIcon className="h-5 w-5" />
            Add Product
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search products by name or SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SKU
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center">
                      Loading...
                    </td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                      No products found
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            {product.images && product.images.length > 0 ? (
                              <img
                                src={product.images[0].image}
                                alt={product.name}
                                className="h-10 w-10 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="h-10 w-10 bg-gray-200 rounded-lg flex items-center justify-center">
                                <PhotoIcon className="h-5 w-5 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {product.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {product.category_name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {product.sku}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">₹{product.price}</div>
                        {product.compare_price && (
                          <div className="text-xs text-gray-500 line-through">
                            ₹{product.compare_price}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          product.stock > 10 
                            ? 'bg-green-100 text-green-800'
                            : product.stock > 0
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {product.stock} units
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          product.is_active 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {product.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        <button
                          onClick={() => handleEdit(product)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add/Edit Product Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <h2 className="text-xl font-bold mb-4">
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Basic Info */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description *
                    </label>
                    <textarea
                      required
                      rows="4"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Price (₹) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={formData.price}
                        onChange={(e) => setFormData({...formData, price: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Compare Price (₹)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.compare_price}
                        onChange={(e) => setFormData({...formData, compare_price: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category *
                      </label>
                      <select
                        required
                        value={formData.category}
                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select Category</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Stock *
                      </label>
                      <input
                        type="number"
                        required
                        value={formData.stock}
                        onChange={(e) => setFormData({...formData, stock: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      SKU *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.sku}
                      onChange={(e) => setFormData({...formData, sku: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Material
                    </label>
                    <input
                      type="text"
                      value={formData.material}
                      onChange={(e) => setFormData({...formData, material: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Care Instructions
                    </label>
                    <textarea
                      rows="2"
                      value={formData.care_instructions}
                      onChange={(e) => setFormData({...formData, care_instructions: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Variants Management Section */}
                  <div className="border-t pt-4 mt-4">
                    <h3 className="text-lg font-semibold mb-4">Product Variants (Sizes & Colors)</h3>
                    
                    {/* Variants List */}
                    {formData.variants && formData.variants.length > 0 ? (
                      <div className="space-y-3 mb-4">
                        {formData.variants.map((variant, index) => (
                          <div key={index} className="flex gap-3 items-center bg-gray-50 p-3 rounded-lg">
                            <select
                              value={variant.size || ''}
                              onChange={(e) => {
                                const newVariants = [...formData.variants];
                                newVariants[index].size = e.target.value;
                                setFormData({...formData, variants: newVariants});
                              }}
                              className="w-24 px-3 py-2 border rounded-lg"
                              required
                            >
                              <option value="">Size</option>
                              {sizeOptions.map(size => (
                                <option key={size} value={size}>{size}</option>
                              ))}
                            </select>

                            <input
                              type="text"
                              placeholder="Color (e.g., Red, Blue)"
                              value={variant.color || ''}
                              onChange={(e) => {
                                const newVariants = [...formData.variants];
                                newVariants[index].color = e.target.value;
                                setFormData({...formData, variants: newVariants});
                              }}
                              className="flex-1 px-3 py-2 border rounded-lg"
                              required
                            />

                            <input
                              type="number"
                              placeholder="Stock"
                              value={variant.stock || 0}
                              onChange={(e) => {
                                const newVariants = [...formData.variants];
                                newVariants[index].stock = parseInt(e.target.value) || 0;
                                setFormData({...formData, variants: newVariants});
                              }}
                              className="w-20 px-3 py-2 border rounded-lg"
                              min="0"
                              required
                            />

                            <input
                              type="number"
                              placeholder="Price Adj."
                              value={variant.price_adjustment || 0}
                              onChange={(e) => {
                                const newVariants = [...formData.variants];
                                newVariants[index].price_adjustment = parseFloat(e.target.value) || 0;
                                setFormData({...formData, variants: newVariants});
                              }}
                              className="w-24 px-3 py-2 border rounded-lg"
                              step="0.01"
                            />

                            <button
                              type="button"
                              onClick={() => {
                                const newVariants = formData.variants.filter((_, i) => i !== index);
                                setFormData({...formData, variants: newVariants});
                              }}
                              className="text-red-500 hover:text-red-700 p-2"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm mb-4">No variants added yet. Add sizes and colors for this product.</p>
                    )}

                    {/* Add Variant Button */}
                    <button
                      type="button"
                      onClick={() => {
                        const newVariants = [...(formData.variants || []), {
                          size: '',
                          color: '',
                          stock: 10,
                          price_adjustment: 0
                        }];
                        setFormData({...formData, variants: newVariants});
                      }}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                    >
                      <PlusIcon className="h-5 w-5" />
                      Add Size/Color Variant
                    </button>

                    {/* Bulk Add Suggestion */}
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800 mb-2">
                        <span className="font-semibold">Quick add common sizes:</span>
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {sizeOptions.map(size => (
                          <button
                            key={size}
                            type="button"
                            onClick={() => {
                              const newVariants = [...(formData.variants || [])];
                              // Add if not exists
                              if (!newVariants.some(v => v.size === size)) {
                                newVariants.push({
                                  size: size,
                                  color: '',
                                  stock: 10,
                                  price_adjustment: 0
                                });
                                setFormData({...formData, variants: newVariants});
                              } else {
                                toast.info(`Size ${size} already added`);
                              }
                            }}
                            className="px-3 py-1 bg-white border border-blue-300 rounded-md text-sm hover:bg-blue-100"
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Images */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Product Images
                    </label>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    
                    {/* Image Previews */}
                    {imagePreview.length > 0 && (
                      <div className="flex gap-2 mt-2">
                        {imagePreview.map((preview, index) => (
                          <div key={index} className="relative">
                            <img
                              src={preview}
                              alt={`Preview ${index + 1}`}
                              className="h-16 w-16 object-cover rounded-lg"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Status Toggles */}
                  <div className="flex items-center gap-6">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Active</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.is_featured}
                        onChange={(e) => setFormData({...formData, is_featured: e.target.checked})}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Featured</span>
                    </label>
                  </div>

                  {/* Form Buttons */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
                    >
                      {editingProduct ? 'Update Product' : 'Create Product'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddModal(false);
                        setEditingProduct(null);
                        resetForm();
                      }}
                      className="flex-1 border-2 border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminProducts;