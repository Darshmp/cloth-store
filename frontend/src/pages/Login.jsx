import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { EnvelopeIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { useLocation } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import GoogleLogin from '../components/GoogleLogin';

// const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
console.log('Google Client ID:', GOOGLE_CLIENT_ID); // Debug: Check if it loads
const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password2: '',
    first_name: '',
    last_name: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (isLogin) {
      // Login
      const result = await login({
        username: formData.username,
        password: formData.password
      });
      
      if (result.success) {
  // Check if there's a redirect location
  const from = location.state?.from || '/';
  navigate(from);
}
    } else {
      // Register
      if (formData.password !== formData.password2) {
        toast.error('Passwords do not match');
        setLoading(false);
        return;
      }

      const result = await register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        password2: formData.password2,
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone
      });

      if (result.success) {
        setIsLogin(true); // Switch to login form
      }
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sm:mx-auto sm:w-full sm:max-w-md"
      >
        <h2 className="text-center text-3xl font-extrabold text-gray-900">
          {isLogin ? 'Sign in to your account' : 'Create new account'}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            {isLogin ? 'Register here' : 'Sign in'}
          </button>
        </p>
      </motion.div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <div className="mt-1 relative">
                <input
                  type="text"
                  name="username"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 
                           rounded-md shadow-sm focus:outline-none focus:ring-blue-500 
                           focus:border-blue-500"
                />
              </div>
            </div>

            {/* Email - only for registration */}
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <div className="mt-1 relative">
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 
                             rounded-md shadow-sm focus:outline-none focus:ring-blue-500 
                             focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            {/* First & Last Name - only for registration */}
            {!isLogin && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 
                             rounded-md shadow-sm focus:outline-none focus:ring-blue-500 
                             focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 
                             rounded-md shadow-sm focus:outline-none focus:ring-blue-500 
                             focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            {/* Phone - only for registration */}
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Phone (Optional)
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 
                           rounded-md shadow-sm focus:outline-none focus:ring-blue-500 
                           focus:border-blue-500"
                />
              </div>
            )}

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 
                           rounded-md shadow-sm focus:outline-none focus:ring-blue-500 
                           focus:border-blue-500"
                />
              </div>
            </div>

            {/* Confirm Password - only for registration */}
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <div className="mt-1 relative">
                  <input
                    type="password"
                    name="password2"
                    required
                    value={formData.password2}
                    onChange={handleChange}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 
                             rounded-md shadow-sm focus:outline-none focus:ring-blue-500 
                             focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent 
                         rounded-md shadow-sm text-sm font-medium text-white 
                         bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 
                         focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50
                         transition transform hover:scale-105"
              >
                {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Register')}
              </button>
            </div>
          </form>

{/* Divider */}
<div className="relative my-6">
  <div className="absolute inset-0 flex items-center">
    <div className="w-full border-t border-gray-300"></div>
  </div>
  <div className="relative flex justify-center text-sm">
    <span className="px-2 bg-white text-gray-500">Or continue with</span>
  </div>
</div>

{/* Google Login */}
<GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
  <GoogleLogin />
</GoogleOAuthProvider>
        </div>
      </div>
    </div>
  );
};

export default Login;