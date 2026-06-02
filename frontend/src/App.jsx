import { Routes, Route, Outlet, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import { lazy, Suspense } from "react";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import NotFound from "./pages/NotFound.jsx";
import CookieConsent from "./components/CookieConsent.jsx";

const Chatbot = lazy(() => import("./components/Chatbot.jsx"));
const Search = lazy(() => import("./pages/Search.jsx"));
const TripDetail = lazy(() => import("./pages/TripDetail.jsx"));
const Checkout = lazy(() => import("./pages/Checkout.jsx"));
const Profile = lazy(() => import("./pages/Profile.jsx"));
const BookingConfirm = lazy(() => import("./pages/BookingConfirm.jsx"));
const PaymentResult = lazy(() => import("./pages/PaymentResult.jsx"));
const Ticket = lazy(() => import("./pages/Ticket.jsx"));
const Admin = lazy(() => import("./pages/Admin.jsx"));
const AllRoutes = lazy(() => import("./pages/AllRoutes.jsx"));
const CheckIn = lazy(() => import("./pages/CheckIn.jsx"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy.jsx"));
const TermsOfService = lazy(() => import("./pages/TermsOfService.jsx"));
const Support = lazy(() => import("./pages/Support.jsx"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword.jsx"));
const ResetPassword = lazy(() => import("./pages/ResetPassword.jsx"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail.jsx"));

// Chỉ cần đăng nhập
function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

// Cần đúng role
function RoleRoute({ children, roles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

function MainLayout() {
  return (
    <>
      <Navbar />
      <Outlet />
      <Footer />
      <Chatbot />
      <CookieConsent />
    </>
  );
}

function App() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          Đang tải...
        </div>
      }
    >
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/routes" element={<AllRoutes />} />
          <Route path="/search" element={<Search />} />
          <Route path="/trips/:id" element={<TripDetail />} />
          <Route
            path="/admin"
            element={
              <RoleRoute roles={["admin", "company_admin"]}>
                <Admin />
              </RoleRoute>
            }
          />
          <Route path="/checkout/:id" element={<Checkout />} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/booking/:id"
            element={
              <ProtectedRoute>
                <BookingConfirm />
              </ProtectedRoute>
            }
          />
          <Route path="/payment/result" element={<PaymentResult />} />
          <Route
            path="/tickets/:bookingId"
            element={
              <ProtectedRoute>
                <Ticket />
              </ProtectedRoute>
            }
          />
          <Route
            path="/checkin"
            element={
              <RoleRoute roles={["admin", "company_admin", "staff"]}>
                <CheckIn />
              </RoleRoute>
            }
          />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/support" element={<Support />} />
          <Route path="*" element={<NotFound />} />
        </Route>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
      </Routes>
    </Suspense>
  );
}

export default App;
