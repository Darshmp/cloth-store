import { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { cartAPI } from '../services/api';
import toast from 'react-hot-toast';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [cartTotal, setCartTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  
  const { isAuthenticated, user } = useAuth();

  // Load cart based on auth state
  useEffect(() => {
    const loadCart = async () => {
      console.log('Auth state changed:', { isAuthenticated, user });
      
      if (isAuthenticated && user) {
        // User logged in - load from server
        await fetchServerCart();
      } else {
        // User logged out - load from localStorage
        loadLocalCart();
      }
      setInitialized(true);
    };

    loadCart();
  }, [isAuthenticated, user]);

  const loadLocalCart = () => {
    console.log('Loading local cart');
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        setCartItems(parsedCart);
        updateCountAndTotal(parsedCart);
      } catch (error) {
        console.error('Error loading cart:', error);
        setCartItems([]);
        updateCountAndTotal([]);
      }
    } else {
      setCartItems([]);
      updateCountAndTotal([]);
    }
  };

  const fetchServerCart = async () => {
    try {
      setLoading(true);
      console.log('Fetching server cart for user:', user?.username);
      const response = await cartAPI.getCart();
      console.log('Server cart response:', response.data);
      
      const serverCart = response.data.items.map(item => ({
        id: item.product,
        cartItemId: item.id,
        name: item.product_details.name,
        price: item.product_details.price,
        image: item.product_details.images?.[0]?.image,
        quantity: item.quantity,
        slug: item.product_details.slug,
        variantId: item.variant,
      }));
      
      setCartItems(serverCart);
      updateCountAndTotal(serverCart);
      
      // Clear localStorage cart since we're using server cart
      localStorage.removeItem('cart');
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching server cart:', error);
      // Fallback to local cart if server fails
      loadLocalCart();
      setLoading(false);
    }
  };

  const updateCountAndTotal = (items) => {
    const count = items.reduce((total, item) => total + item.quantity, 0);
    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    setCartCount(count);
    setCartTotal(total);
  };

  // Save to localStorage only when not authenticated
  const saveCart = (items) => {
    setCartItems(items);
    updateCountAndTotal(items);
    
    if (!isAuthenticated) {
      localStorage.setItem('cart', JSON.stringify(items));
    }
  };

  const addToCart = async (product, quantity = 1, variant = null) => {
    const newItems = [...cartItems];
    const existingItemIndex = newItems.findIndex(
      item => item.id === product.id && 
      (variant ? item.variantId === variant.id : true)
    );

    if (existingItemIndex > -1) {
      newItems[existingItemIndex].quantity += quantity;
    } else {
      newItems.push({
        id: product.id,
        slug: product.slug,
        name: product.name,
        price: product.price,
        image: product.images?.[0]?.image || null,
        quantity: quantity,
        variantId: variant?.id,
        size: variant?.size,
        color: variant?.color,
      });
    }

    saveCart(newItems);
    
    // If user is logged in, sync with server
    if (isAuthenticated) {
      try {
        await cartAPI.addToCart({
          product_id: product.id,
          variant_id: variant?.id,
          quantity: quantity
        });
        // Refresh cart from server to ensure consistency
        await fetchServerCart();
      } catch (error) {
        console.error('Error adding to server cart:', error);
      }
    }
    
    toast.success(`${product.name} added to cart!`);
  };

  const removeFromCart = async (itemId) => {
    const itemToRemove = cartItems.find(item => item.id === itemId);
    const newItems = cartItems.filter(item => item.id !== itemId);
    saveCart(newItems);

    if (isAuthenticated && itemToRemove?.cartItemId) {
      try {
        await cartAPI.removeItem(itemToRemove.cartItemId);
        await fetchServerCart();
      } catch (error) {
        console.error('Error removing from server cart:', error);
      }
    }
    
    toast.error(`${itemToRemove?.name} removed from cart`);
  };

  const updateQuantity = async (itemId, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(itemId);
      return;
    }

    const newItems = cartItems.map(item =>
      item.id === itemId ? { ...item, quantity: newQuantity } : item
    );
    saveCart(newItems);

    const updatedItem = cartItems.find(item => item.id === itemId);
    if (isAuthenticated && updatedItem?.cartItemId) {
      try {
        await cartAPI.updateItem(updatedItem.cartItemId, newQuantity);
        await fetchServerCart();
      } catch (error) {
        console.error('Error updating server cart:', error);
      }
    }
  };

  const clearCart = async () => {
    saveCart([]);
    
    if (isAuthenticated) {
      try {
        await cartAPI.clearCart();
        await fetchServerCart();
      } catch (error) {
        console.error('Error clearing server cart:', error);
      }
    }
    
    toast.success('Cart cleared');
  };

  // Function to manually sync cart (useful after login)
  const syncCartAfterLogin = useCallback(async () => {
    if (!isAuthenticated || !user) return;
    
    const localCart = localStorage.getItem('cart');
    if (localCart) {
      try {
        const items = JSON.parse(localCart);
        if (items.length > 0) {
          const itemsToSync = items.map(item => ({
            product_id: item.id,
            variant_id: item.variantId,
            quantity: item.quantity
          }));
          
          await cartAPI.syncCart(itemsToSync);
          localStorage.removeItem('cart');
          await fetchServerCart();
          toast.success('Cart synced with your account');
        }
      } catch (error) {
        console.error('Error syncing cart:', error);
      }
    }
  }, [isAuthenticated, user]);

  // Sync cart when user logs in
  useEffect(() => {
    if (isAuthenticated && user && initialized) {
      syncCartAfterLogin();
    }
  }, [isAuthenticated, user, initialized, syncCartAfterLogin]);

  return (
    <CartContext.Provider value={{
      cartItems,
      cartCount,
      cartTotal,
      loading,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      syncCartAfterLogin
    }}>
      {children}
    </CartContext.Provider>
  );
};