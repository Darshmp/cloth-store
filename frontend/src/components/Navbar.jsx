import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBagIcon, UserIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import { HeartIcon } from '@heroicons/react/24/outline';
import { useWishlist } from '../context/WishlistContext';

const Navbar = () => {
  const { cartCount } = useCart();
  const { user, isAuthenticated, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();
  const { wishlistCount } = useWishlist();

  const handleLogout = () => {
    logout();
    navigate('/');
    setShowUserMenu(false);
  };

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="text-2xl font-bold text-blue-600">
            CLOTH<span className="text-gray-900">STORE</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex space-x-8">
            <Link to="/" className="text-gray-700 hover:text-blue-600 transition">Home</Link>
            <Link to="/shop" className="text-gray-700 hover:text-blue-600 transition">Shop</Link>
            <Link to="/new-arrivals" className="text-gray-700 hover:text-blue-600 transition">New Arrivals</Link>
            <Link to="/sale" className="text-gray-700 hover:text-blue-600 transition">Sale</Link>
          </div>

          {/* Icons */}
          <div className="flex items-center space-x-4">
            <button className="p-2 hover:bg-gray-100 rounded-full transition">
              <MagnifyingGlassIcon className="h-5 w-5" />
            </button>
            
            {/* User Menu */}
            <div className="relative">
              {isAuthenticated ? (
                <>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="p-2 hover:bg-gray-100 rounded-full transition flex items-center gap-2"
                  >
                    <UserIcon className="h-5 w-5" />
                    <span className="text-sm hidden lg:inline">
                      {user?.first_name || user?.username}
                    </span>
                  </button>

                  {/* Dropdown Menu */}
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-50">
                      <Link
                        to="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowUserMenu(false)}
                      >
                        Profile
                      </Link>
                      <Link
                        to="/orders"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowUserMenu(false)}
                      >
                        Orders
                      </Link>

		<Link
  to="/orders"
  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
  onClick={() => setShowUserMenu(false)}
>
  My Orders
</Link>
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <Link to="/login" className="p-2 hover:bg-gray-100 rounded-full transition">
                  <UserIcon className="h-5 w-5" />
                </Link>
              )}
            </div>

  {/* Wishlist Icon */}
  <Link to="/wishlist" className="p-2 hover:bg-gray-100 rounded-full transition relative">
    <HeartIcon className="h-5 w-5" />
    {wishlistCount > 0 && (
      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
        {wishlistCount}
      </span>
    )}
  </Link>

            {/* Cart */}
            <Link to="/cart" className="p-2 hover:bg-gray-100 rounded-full transition relative">
    <ShoppingBagIcon className="h-5 w-5" />
    {cartCount > 0 && (
      <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
        {cartCount}
      </span>
    )}
  </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;