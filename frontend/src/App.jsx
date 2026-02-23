import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';
import Home from './pages/Home';
import Cart from './pages/Cart';
import ProductDetail from './pages/ProductDetail';
import Login from './pages/Login';
import Shop from './pages/Shop';
import Orders from './pages/Orders';
import Wishlist from './pages/Wishlist';
import Checkout from './pages/Checkout';
import OrderConfirmation from './pages/OrderConfirmation';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import FlashSalePage from './pages/sales/FlashSalePage';
import OrderDetails from './pages/OrderDetails';
import AdminOrders from './pages/admin/AdminOrders';

console.log('App.jsx loaded');
console.log('AdminDashboard component:', AdminDashboard);
console.log('PrivateRoute component:', PrivateRoute);

function App() {
  return (
    <Router>
      <AuthProvider>
        <WishlistProvider>
          <CartProvider>
            <div className="min-h-screen bg-gray-50">
              <Navbar />
              <Routes>
	        <Route path="/flash-sale/:id" element={<FlashSalePage />} />
                <Route path="/" element={<Home />} />
		<Route path="/order/:id" element={<OrderDetails />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/product/:slug" element={<ProductDetail />} />
                <Route path="/login" element={<Login />} />
                <Route path="/shop" element={<Shop />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/wishlist" element={<Wishlist />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/order-confirmation" element={<OrderConfirmation />} />
                
                {/* ADMIN ROUTES - Make sure these are exactly as below */}
                <Route path="/admin" element={
                  <PrivateRoute adminOnly={true}>
                    <AdminDashboard />
                  </PrivateRoute>
                } />
                <Route path="/admin/products" element={
                  <PrivateRoute adminOnly={true}>
                    <AdminProducts />
                  </PrivateRoute>
                } />

		<Route path="/admin/orders" element={
  <PrivateRoute adminOnly={true}>
    <AdminOrders />
  </PrivateRoute>
} />
              </Routes>
              <Toaster position="top-right" />
            </div>
          </CartProvider>
        </WishlistProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;