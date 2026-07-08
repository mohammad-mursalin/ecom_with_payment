// src/App.jsx
import { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider }      from './Context/AuthContext';
import { WebSocketProvider } from './Context/WebSocketContext';
import { CartProvider }      from './Context/CartContext';
import { WishlistProvider }  from './Context/WishlistContext';
import { ToastProvider }     from './components/Toast';
import RequireAuth from './components/RequireAuth';
import Layout      from './components/Layout'; // Eagerly imported — always visible

// All pages are lazy-loaded. No page component is imported eagerly.
const HomePage             = lazy(() => import('./pages/HomePage'));
const LoginPage            = lazy(() => import('./pages/LoginPage'));
const RegisterPage         = lazy(() => import('./pages/RegisterPage'));
const ProductsPage         = lazy(() => import('./pages/ProductsPage'));
const ProductDetailPage    = lazy(() => import('./pages/ProductDetailPage'));
const CartPage             = lazy(() => import('./pages/CartPage'));
const CheckoutPage         = lazy(() => import('./pages/CheckoutPage'));
const OrderHistoryPage     = lazy(() => import('./pages/OrderHistoryPage'));
const OrderDetailPage      = lazy(() => import('./pages/OrderDetailPage'));
const WishlistPage         = lazy(() => import('./pages/WishlistPage'));
const ProfilePage          = lazy(() => import('./pages/ProfilePage'));
const AdminDashboard   = lazy(() => import('./pages/AdminDashboard'));
const AdminUsersPage       = lazy(() => import('./pages/AdminUsersPage'));
const AdminOrdersPage      = lazy(() => import('./pages/AdminOrdersPage'));
const AdminProductsPage    = lazy(() => import('./pages/AdminProductsPage'));
const AdminAddProductPage  = lazy(() => import('./pages/AdminAddProductPage'));
const AdminEditProductPage = lazy(() => import('./pages/AdminEditProductPage'));
const PaymentSuccessPage   = lazy(() => import('./pages/PaymentSuccessPage'));
const PaymentCancelPage    = lazy(() => import('./pages/PaymentCancelPage'));
const UnauthorizedPage     = lazy(() => import('./pages/UnauthorizedPage'));
const NotFoundPage         = lazy(() => import('./pages/NotFoundPage'));

// Shown while a lazy page chunk is downloading
const PageSpinner = () => (
  <div
    className="d-flex justify-content-center align-items-center"
    style={{ minHeight: '60vh' }}
  >
    <div className="spinner-border text-primary" role="status">
      <span className="visually-hidden">Loading...</span>
    </div>
  </div>
);

function App() {
  return (
    // Provider nesting order is load-bearing. Do not change it.
    // AuthProvider must be outermost so all other providers can read auth state.
    <AuthProvider>
      <WebSocketProvider>
        <CartProvider>
          <WishlistProvider>
            <ToastProvider>
              <Suspense fallback={<PageSpinner />}>
                <Routes>
                  <Route element={<Layout />}>

                    {/* ── Public routes ── */}
                    <Route path="/"                  element={<HomePage />} />
                    <Route path="/products"          element={<ProductsPage />} />
                    <Route path="/products/:id"      element={<ProductDetailPage />} />
                    <Route path="/payment/success"   element={<PaymentSuccessPage />} />
                    <Route path="/payment/cancel"    element={<PaymentCancelPage />} />
                    <Route path="/unauthorized"      element={<UnauthorizedPage />} />

                    {/* ── Guest-only routes (redirect away if already authenticated) ── */}
                    <Route path="/login"    element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />

                    {/* ── Authenticated user routes ── */}
                    <Route path="/cart"        element={<RequireAuth><CartPage /></RequireAuth>} />
                    <Route path="/checkout"    element={<RequireAuth><CheckoutPage /></RequireAuth>} />
                    <Route path="/orders"      element={<RequireAuth><OrderHistoryPage /></RequireAuth>} />
                    <Route path="/orders/:id"  element={<RequireAuth><OrderDetailPage /></RequireAuth>} />
                    <Route path="/wishlist"    element={<RequireAuth><WishlistPage /></RequireAuth>} />
                    <Route path="/profile"     element={<RequireAuth><ProfilePage /></RequireAuth>} />

                    {/* ── Admin-only routes ── */}
                    <Route path="/admin"                    element={<RequireAuth requireAdmin><AdminDashboard /></RequireAuth>} />
                    <Route path="/admin/users"              element={<RequireAuth requireAdmin><AdminUsersPage /></RequireAuth>} />
                    <Route path="/admin/orders"             element={<RequireAuth requireAdmin><AdminOrdersPage /></RequireAuth>} />
                    <Route path="/admin/products"           element={<RequireAuth requireAdmin><AdminProductsPage /></RequireAuth>} />
                    <Route path="/admin/products/new"       element={<RequireAuth requireAdmin><AdminAddProductPage /></RequireAuth>} />
                    <Route path="/admin/products/:id/edit"  element={<RequireAuth requireAdmin><AdminEditProductPage /></RequireAuth>} />

                    {/* ── Catch-all ── */}
                    <Route path="*" element={<NotFoundPage />} />

                  </Route>
                </Routes>
              </Suspense>
            </ToastProvider>
          </WishlistProvider>
        </CartProvider>
      </WebSocketProvider>
    </AuthProvider>
  );
}

export default App;