import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Home from "./pages/Home.jsx";
function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<div>Login</div>} />
        <Route path="/register" element={<div>Register</div>} />
        <Route path="/search" element={<div>Search Results</div>} />
        <Route path="/trips/:id" element={<div>Trip Detail</div>} />
        <Route path="/bookings" element={<div>My Bookings</div>} />
        <Route path="/tickets/:bookingId" element={<div>Ticket</div>} />
      </Routes>
    </>
  );
}

export default App;
