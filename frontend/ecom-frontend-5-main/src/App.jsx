// src/App.jsx
import { Suspense, lazy, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider }      from './Context/AuthContext';
import { ChatProvider }       from './Context/ChatContext';
import { WebSocketProvider } from './Context/WebSocketContext';
import { CartProvider }      from './Context/CartContext';
import { WishlistProvider }  from './Context/WishlistContext';
import { ToastProvider, useToast } from './components/Toast';
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
const AdminChatSessionsPage = lazy(() => import('./pages/AdminChatSessionsPage'));
const AdminChatSessionDetailPage = lazy(() => import('./pages/AdminChatSessionDetailPage'));
const AdminKbPage = lazy(() => import('./pages/AdminKbPage'));
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

function ChatConnectivityListener() {
  const { toast } = useToast();
  useEffect(() => {
    const handler = (e) => {
      toast.error(e.detail?.message || "Unable to connect. Please check your network and try again.");
    };
    window.addEventListener("chat:connectivity-error", handler);
    return () => window.removeEventListener("chat:connectivity-error", handler);
  }, [toast]);
  return null;
}

function App() {
  return (
    // Provider nesting order is load-bearing. Do not change it.
    // AuthProvider must be outermost so all other providers can read auth state.
    <AuthProvider>
      <ChatProvider>
        <WebSocketProvider>
          <CartProvider>
            <WishlistProvider>
              <ToastProvider>
                <ChatConnectivityListener />
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
                      <Route path="/admin/chat"                element={<RequireAuth requireAdmin><AdminChatSessionsPage /></RequireAuth>} />
                      <Route path="/admin/chat/:id"            element={<RequireAuth requireAdmin><AdminChatSessionDetailPage /></RequireAuth>} />
                      <Route path="/admin/kb"                  element={<RequireAuth requireAdmin><AdminKbPage /></RequireAuth>} />

                      {/* ── Catch-all ── */}
                      <Route path="*" element={<NotFoundPage />} />

                    </Route>
                  </Routes>
                </Suspense>
              </ToastProvider>
            </WishlistProvider>
          </CartProvider>
        </WebSocketProvider>
      </ChatProvider>
    </AuthProvider>
  );
}

export default App;