import { Routes, Route } from "react-router-dom";
import Home from "./components/Home";
import Layout from "./components/Layout";
import Cart from "./components/Cart";
import { AuthProvider } from "./Context/AuthContext";
import { WebSocketProvider } from "./Context/WebSocketContext";
import { CartProvider } from "./Context/CartContext";
import { WishlistProvider } from "./Context/WishlistContext";
import { ToastProvider } from "./components/Toast";
import ProductsPage from "./pages/ProductsPage";
import OrderHistoryPage from "./pages/OrderHistoryPage";
import OrderDetailPage from "./pages/OrderDetailPage";
import PaymentSuccess from "./components/PaymentSuccess";
import PaymentCancel from "./components/PaymentCancel";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import PrivateRoute from "./components/PrivateRoute";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminOrders from "./pages/AdminOrders";
import AdminProducts from "./components/AdminProducts";
import AdminAddProductPage from "./pages/AdminAddProductPage";
import AdminEditProductPage from "./pages/AdminEditProductPage";
import ErrorBoundary from "./components/ErrorBoundary";
import NetworkBanner from "./components/NetworkBanner";
import NotFound from "./components/NotFound";
import PageLoader from "./components/PageLoader";
import ProductDetailPage from "./pages/ProductDetailPage";
import CheckoutPage from "./pages/CheckoutPage";
import WishlistPage from "./pages/WishlistPage";
import { Suspense } from "react";

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <WebSocketProvider>
          <CartProvider>
            <WishlistProvider>
              <ToastProvider>
                <NetworkBanner />
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/" element={<Layout><Home /></Layout>} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/products" element={<Layout><ProductsPage /></Layout>} />
                    <Route path="/products/:id" element={<Layout><ProductDetailPage /></Layout>} />
                    <Route path="/payment/success" element={<Layout><PaymentSuccess /></Layout>} />
                    <Route path="/payment/cancel" element={<Layout><PaymentCancel /></Layout>} />
                    <Route element={<PrivateRoute />}>
                      <Route path="/cart" element={<Layout><Cart /></Layout>} />
                      <Route path="/checkout" element={<Layout><CheckoutPage /></Layout>} />
                      <Route path="/orders" element={<Layout><OrderHistoryPage /></Layout>} />
                      <Route path="/orders/:id" element={<Layout><OrderDetailPage /></Layout>} />
                      <Route path="/wishlist" element={<Layout><WishlistPage /></Layout>} />
                      <Route path="/profile" element={<Layout><Profile /></Layout>} />
                    </Route>
                    <Route element={<PrivateRoute admin={true} />}>
                      <Route path="/admin" element={<Layout><AdminDashboard /></Layout>} />
                      <Route path="/admin/users" element={<Layout><AdminUsers /></Layout>} />
                      <Route path="/admin/orders" element={<Layout><AdminOrders /></Layout>} />
<Route path="/admin/products" element={<Layout><AdminProducts /></Layout>} />
                      <Route path="/admin/products/new" element={<Layout><AdminAddProductPage /></Layout>} />
                      <Route path="/admin/products/:id/edit" element={<Layout><AdminEditProductPage /></Layout>} />
                    </Route>
                    <Route path="/unauthorized" element={<div className="container text-center" style={{ marginTop: "100px" }}><h2>401 — Unauthorized</h2><div className="text-center mt-4"><p>You do not have permission to access this page.</p></div></div>} />
                    <Route path="*" element={<Layout><NotFound /></Layout>} />
                  </Routes>
                </Suspense>
              </ToastProvider>
            </WishlistProvider>
          </CartProvider>
        </WebSocketProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;