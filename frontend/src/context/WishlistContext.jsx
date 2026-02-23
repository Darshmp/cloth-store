import { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { wishlistAPI } from '../services/api';
import toast from 'react-hot-toast';

const WishlistContext = createContext();

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};

export const WishlistProvider = ({ children }) => {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [loading, setLoading] = useState(false);
  
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchWishlist();
    } else {
      setWishlistItems([]);
      setWishlistCount(0);
    }
  }, [isAuthenticated, user]);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const response = await wishlistAPI.getWishlist();
      setWishlistItems(response.data);
      setWishlistCount(response.data.length);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToWishlist = async (product) => {
    if (!isAuthenticated) {
      toast.error('Please login to add items to wishlist');
      return false;
    }

    try {
      await wishlistAPI.addToWishlist(product.id);
      await fetchWishlist(); // Refresh wishlist
      toast.success(`${product.name} added to wishlist!`);
      return true;
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      toast.error('Failed to add to wishlist');
      return false;
    }
  };

  const removeFromWishlist = async (productId, productName) => {
    try {
      await wishlistAPI.removeFromWishlist(productId);
      await fetchWishlist(); // Refresh wishlist
      toast.success(productName ? `${productName} removed from wishlist` : 'Removed from wishlist');
      return true;
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      toast.error('Failed to remove from wishlist');
      return false;
    }
  };

  const checkInWishlist = async (productId) => {
    try {
      const response = await wishlistAPI.checkInWishlist(productId);
      return response.data.in_wishlist;
    } catch (error) {
      console.error('Error checking wishlist:', error);
      return false;
    }
  };

  return (
    <WishlistContext.Provider value={{
      wishlistItems,
      wishlistCount,
      loading,
      addToWishlist,
      removeFromWishlist,
      checkInWishlist,
      refreshWishlist: fetchWishlist
    }}>
      {children}
    </WishlistContext.Provider>
  );
};