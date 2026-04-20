import { Routes, Route, Outlet, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Search from "./pages/Search.jsx";
import TripDetail from "./pages/TripDetail.jsx";
import Checkout from "./pages/Checkout.jsx";
import Profile from "./pages/Profile.jsx";
import BookingConfirm from "./pages/BookingConfirm.jsx";
import PaymentResult from "./pages/PaymentResult.jsx";

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
    </>
  );
}

function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<Search />} />
        <Route path="/trips/:id" element={<TripDetail />} />
        <Route
          path="/bookings"
          element={
            <ProtectedRoute>
              <div>Bookings</div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <RoleRoute roles={["admin"]}>
              <div>Admin</div>
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
        <Route path="/booking/:id" element={<ProtectedRoute><BookingConfirm /></ProtectedRoute>} />
        <Route path="/payment/result" element={<PaymentResult />} />
        <Route path="/tickets/:bookingId" element={<div>Ticket</div>} />
      </Route>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
    </Routes>
  );
}

export default App;
