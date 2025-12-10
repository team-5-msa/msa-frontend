import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import AuthPage from './pages/AuthPage';
import PerformancesPage from './pages/PerformancesPage';
import PerformanceDetailPage from './pages/PerformanceDetailPage';
import BookingPage from './pages/BookingPage';
import MyBookingsPage from './pages/MyBookingsPage';
import { ReviewPage } from './pages/ReviewPage';
import { MyReviewsPage } from './pages/MyReviewsPage';
import './App.css';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to='/' replace />;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route
        path='/'
        element={isAuthenticated ? <Navigate to='/performances' replace /> : <AuthPage />}
      />
      <Route
        path='/performances'
        element={
          <PrivateRoute>
            <Navbar />
            <PerformancesPage />
          </PrivateRoute>
        }
      />
      <Route
        path='/performances/:id'
        element={
          <PrivateRoute>
            <Navbar />
            <PerformanceDetailPage />
          </PrivateRoute>
        }
      />
      <Route
        path='/booking/:id'
        element={
          <PrivateRoute>
            <Navbar />
            <BookingPage />
          </PrivateRoute>
        }
      />
      <Route
        path='/my-bookings'
        element={
          <PrivateRoute>
            <Navbar />
            <MyBookingsPage />
          </PrivateRoute>
        }
      />
      <Route
        path='/performance/:performanceId/reviews'
        element={
          <PrivateRoute>
            <Navbar />
            <ReviewPage />
          </PrivateRoute>
        }
      />
      <Route
        path='/my-reviews'
        element={
          <PrivateRoute>
            <Navbar />
            <MyReviewsPage />
          </PrivateRoute>
        }
      />
      <Route path='*' element={<Navigate to='/' replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
