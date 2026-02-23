import { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const token = localStorage.getItem('access_token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
        setIsAuthenticated(true);
        
        // Verify with server
        const response = await authAPI.getProfile();
        const userData = {
          ...response.data,
          is_staff: response.data.is_staff || false,
          is_superuser: response.data.is_superuser || false
        };
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
      } catch (error) {
        console.error('Token expired or invalid');
        logout();
      }
    }
    setLoading(false);
  };

const login = async (credentials) => {
  try {
    // For Google login, credentials already contain tokens
    if (credentials.access && credentials.refresh) {
      // Google login case
      setUser(credentials.user);
      setIsAuthenticated(true);
      
      // Only show toast for Google login if we're sure it's new
      // We'll let the component handle this
      return { success: true };
    }
    
    // Regular email/password login
    const response = await authAPI.login(credentials);
    const { access, refresh } = response.data;

    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);

    const userResponse = await authAPI.getProfile();
    const userData = {
      ...userResponse.data,
      is_staff: userResponse.data.is_staff || false,
      is_superuser: userResponse.data.is_superuser || false
    };
    
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);

    toast.success('Login successful!'); // Only for email login
    return { success: true };
  } catch (error) {
    console.error('Login error:', error);
    const message = error.response?.data?.detail || 'Login failed';
    toast.error(message);
    return { success: false, error: message };
  }
};
  const register = async (userData) => {
    try {
      await authAPI.register(userData);
      toast.success('Registration successful! Please login.');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('cart');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
    toast.success('Logged out successfully');
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isAuthenticated,
      login,
      register,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};