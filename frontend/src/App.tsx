import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import PlannerPage from './pages/PlannerPage';
import BookingPage from './pages/BookingPage';
import PaymentPage from './pages/PaymentPage';
import TripDetailsPage from './pages/TripDetailsPage';
import './index.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        {/* We will add a persistent navigation bar here later */}
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/planner" element={<PlannerPage />} />
          <Route path="/planner/:tripId" element={<PlannerPage />} />
          <Route path="/trip/:tripId" element={<TripDetailsPage />} />
          <Route path="/bookings/:tripId" element={<BookingPage />} />
          <Route path="/payment" element={<PaymentPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
