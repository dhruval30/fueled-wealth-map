import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import AcceptInvitation from './pages/AcceptInvitation';
import Dashboard from './pages/Dashboard';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import PropertyMapPage from './pages/PropertyMapPage';
import RegisterCompany from './pages/RegisterCompany';
import SavedProperties from './pages/SavedProperties';
import TeamManagement from './pages/TeamManagement';

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('authToken');
  
  if (!isAuthenticated) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// Admin Route component
const AdminRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('authToken');
  const isAdmin = localStorage.getItem('isAdmin') === 'true';
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/register-company" element={<RegisterCompany />} />
        <Route path="/login" element={<Login />} />
        <Route path="/accept-invitation/:token" element={<AcceptInvitation />} />
        
        {/* Protected routes - require authentication */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        
        {/* Dedicated Property Map Page */}
        <Route path="/property-map" element={
          <ProtectedRoute>
            <PropertyMapPage />
          </ProtectedRoute>
        } />
        
        {/* Admin-only routes */}
        <Route path="/team" element={
          <AdminRoute>
            <TeamManagement />
          </AdminRoute>
        } />
        
        {/* Other protected routes */}
        <Route path="/search" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/analytics" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/saved-properties" element={
          <ProtectedRoute>
            <SavedProperties />
          </ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        
        {/* Redirect to home page for any unknown routes */}
        <Route path="*" element={
          localStorage.getItem('authToken') 
            ? <Navigate to="/dashboard" replace /> 
            : <Navigate to="/" replace />
        } />
      </Routes>
    </Router>
  );
}

export default App;