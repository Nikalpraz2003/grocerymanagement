import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { Toaster } from "react-hot-toast"
import { CartProvider } from "./context/CartContext"
import { ProtectedRoute } from "./components/ProtectedRoute"
import AppLayout from "./components/layout/AppLayout"
import AdminLayout from "./components/layout/AdminLayout"
import VendorLayout from "./components/layout/VendorLayout"

// Shop pages
import Login from "./pages/Login"
import Home from "./pages/Home"
import Products from "./pages/Products"
import ProductPage from "./pages/ProductPage"
import FlashDeals from "./pages/FlashDeals"
import SearchResults from "./pages/SearchResults"
import Cart from "./pages/Cart"
import Checkout from "./pages/Checkout"
import MyOrders from "./pages/MyOrders"
import OrderTracking from "./pages/OrderTracking"
import Addresses from "./pages/Addresses"
import BecomeSeller from "./pages/BecomeSeller"
import Profile from "./pages/Profile"
import PaymentResult from "./pages/PaymentResult"

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard"
import AdminProducts from "./pages/admin/AdminProducts"
import AdminCategories from "./pages/admin/AdminCategories"
import AdminInventory from "./pages/admin/AdminInventory"
import AdminOrders from "./pages/admin/AdminOrders"
import AdminPayments from "./pages/admin/AdminPayments"
import AdminDelivery from "./pages/admin/AdminDelivery"
import AdminCustomers from "./pages/admin/AdminCustomers"
import AdminVendors from "./pages/admin/AdminVendors"
import AdminCommission from "./pages/admin/AdminCommission"
import AdminCoupons from "./pages/admin/AdminCoupons"
import AdminReviews from "./pages/admin/AdminReviews"
import AdminAnalytics from "./pages/admin/AdminAnalytics"
import AdminSettings from "./pages/admin/AdminSettings"

// Vendor (seller) pages
import VendorDashboard from "./pages/vendor/VendorDashboard"
import VendorOrders from "./pages/vendor/VendorOrders"
import VendorProducts from "./pages/vendor/VendorProducts"
import VendorInventory from "./pages/vendor/VendorInventory"
import VendorEarnings from "./pages/vendor/VendorEarnings"

const Protected = ({ children }: { children: React.ReactNode }) => <ProtectedRoute>{children}</ProtectedRoute>

function App() {
  return (
    <BrowserRouter>
      <CartProvider>
        <Toaster position="top-center" />
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Shop: navbar + footer around every page */}
          <Route element={<AppLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<Products />} />
            <Route path="/product/:id" element={<ProductPage />} />
            <Route path="/deals" element={<FlashDeals />} />
            <Route path="/search" element={<SearchResults />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/become-seller" element={<BecomeSeller />} />
            <Route path="/checkout" element={<Protected><Checkout /></Protected>} />
            <Route path="/orders" element={<Protected><MyOrders /></Protected>} />
            <Route path="/orders/:id" element={<Protected><OrderTracking /></Protected>} />
            <Route path="/addresses" element={<Protected><Addresses /></Protected>} />
            <Route path="/profile" element={<Protected><Profile /></Protected>} />
            <Route path="/payment/:provider" element={<Protected><PaymentResult /></Protected>} />
          </Route>

          {/* Admin: sidebar around every admin page, Admin role only */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="Admin">
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="inventory" element={<AdminInventory />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="payments" element={<AdminPayments />} />
            <Route path="delivery" element={<AdminDelivery />} />
            <Route path="customers" element={<AdminCustomers />} />
            <Route path="vendors" element={<AdminVendors />} />
            <Route path="commission" element={<AdminCommission />} />
            <Route path="coupons" element={<AdminCoupons />} />
            <Route path="reviews" element={<AdminReviews />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          {/* Vendor: sidebar around every seller page, Vendor role only */}
          <Route
            path="/vendor"
            element={
              <ProtectedRoute requiredRole="Vendor">
                <VendorLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<VendorDashboard />} />
            <Route path="orders" element={<VendorOrders />} />
            <Route path="products" element={<VendorProducts />} />
            <Route path="inventory" element={<VendorInventory />} />
            <Route path="earnings" element={<VendorEarnings />} />
          </Route>

          {/* Anything else goes home (keep this last) */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </CartProvider>
    </BrowserRouter>
  )
}

export default App